import { logger } from './logger'
// ═══════════════════════════════════════════════════════════════════════════════
// Circuit Breaker Pattern — Protection contre les dégradations de service
// ═══════════════════════════════════════════════════════════════════════════════

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerConfig {
  failureThreshold: number      // Nombre d'échecs avant ouverture
  resetTimeoutMs: number        // Temps avant passage en HALF_OPEN
  halfOpenMaxCalls: number      // Nombre de tests en HALF_OPEN
}

interface CircuitStats {
  state: CircuitState
  failures: number
  successes: number
  lastFailureTime: number | null
  nextAttempt: number | null
  halfOpenCalls: number
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30 * 1000, // 30 secondes
  halfOpenMaxCalls: 3,
}

// Store in-memory (pour production, utiliser Redis)
const circuits = new Map<string, CircuitStats>()

/**
 * Circuit Breaker pour protéger les appels à des services externes (Stripe, etc.)
 * États:
 * - CLOSED: Fonctionnement normal, les appels passent
 * - OPEN: Trop d'échecs, les appels sont rejetés immédiatement
 * - HALF_OPEN: Test après timeout, quelques appels autorisés pour vérifier le service
 */
export class CircuitBreaker {
  private name: string
  private config: CircuitBreakerConfig

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initStats()
  }

  private initStats(): void {
    if (!circuits.has(this.name)) {
      circuits.set(this.name, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        nextAttempt: null,
        halfOpenCalls: 0,
      })
    }
  }

  private getStats(): CircuitStats {
    return circuits.get(this.name)!
  }

  private updateStats(stats: Partial<CircuitStats>): void {
    const current = this.getStats()
    circuits.set(this.name, { ...current, ...stats })
  }

  /**
   * Vérifie si le circuit est ouvert (bloquant les appels)
   */
  isOpen(): boolean {
    const stats = this.getStats()
    const now = Date.now()

    if (stats.state === 'OPEN') {
      // Vérifier si on doit passer en HALF_OPEN
      if (stats.nextAttempt && now >= stats.nextAttempt) {
        this.updateStats({
          state: 'HALF_OPEN',
          halfOpenCalls: 0,
        })
        logger.info(`[CircuitBreaker:${this.name}] Passage en HALF_OPEN`)
        return false
      }
      return true
    }

    return false
  }

  /**
   * Enregistre un succès
   */
  recordSuccess(): void {
    const stats = this.getStats()

    if (stats.state === 'HALF_OPEN') {
      const newHalfOpenCalls = stats.halfOpenCalls + 1
      if (newHalfOpenCalls >= this.config.halfOpenMaxCalls) {
        // Assez de succès, on ferme le circuit
        this.updateStats({
          state: 'CLOSED',
          failures: 0,
          successes: stats.successes + 1,
          halfOpenCalls: 0,
          nextAttempt: null,
        })
        logger.info(`[CircuitBreaker:${this.name}] Circuit FERMÉ (service rétabli)`)
      } else {
        this.updateStats({
          successes: stats.successes + 1,
          halfOpenCalls: newHalfOpenCalls,
        })
      }
    } else {
      this.updateStats({
        failures: 0,
        successes: stats.successes + 1,
      })
    }
  }

  /**
   * Enregistre un échec
   */
  recordFailure(error?: Error): void {
    const stats = this.getStats()
    const now = Date.now()
    const newFailures = stats.failures + 1

    logger.error(`[CircuitBreaker:${this.name}] Échec ${newFailures}/${this.config.failureThreshold}`, error?.message)

    if (stats.state === 'HALF_OPEN') {
      // Échec en HALF_OPEN = retour en OPEN immédiatement
      this.updateStats({
        state: 'OPEN',
        failures: newFailures,
        lastFailureTime: now,
        nextAttempt: now + this.config.resetTimeoutMs,
        halfOpenCalls: 0,
      })
      logger.warn(`[CircuitBreaker:${this.name}] Circuit OUVERT (échec en HALF_OPEN)`)
    } else if (newFailures >= this.config.failureThreshold) {
      // Trop d'échecs = ouverture du circuit
      this.updateStats({
        state: 'OPEN',
        failures: newFailures,
        lastFailureTime: now,
        nextAttempt: now + this.config.resetTimeoutMs,
      })
      logger.warn(`[CircuitBreaker:${this.name}] Circuit OUVERT après ${newFailures} échecs`)
    } else {
      this.updateStats({ failures: newFailures })
    }
  }

  /**
   * Exécute une fonction avec protection du circuit breaker
   * @returns Le résultat de la fonction, ou une erreur si le circuit est ouvert
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    // Vérifier si le circuit est ouvert
    if (this.isOpen()) {
      const stats = this.getStats()
      const retryAfter = stats.nextAttempt
        ? Math.ceil((stats.nextAttempt - Date.now()) / 1000)
        : this.config.resetTimeoutMs / 1000

      logger.warn(`[CircuitBreaker:${this.name}] Circuit ouvert — appel rejeté (retry dans ${retryAfter}s)`)

      if (fallback) {
        return fallback()
      }

      throw new CircuitBreakerError(
        `Service ${this.name} temporairement indisponible. Réessayez dans ${retryAfter}s.`,
        this.name,
        retryAfter
      )
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure(error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * Récupère l'état actuel du circuit
   */
  getState(): CircuitStats {
    return this.getStats()
  }

  /**
   * Force la fermeture du circuit (utile pour les tests ou recovery manuel)
   */
  forceClose(): void {
    this.updateStats({
      state: 'CLOSED',
      failures: 0,
      nextAttempt: null,
      halfOpenCalls: 0,
    })
    logger.info(`[CircuitBreaker:${this.name}] Circuit forcé en CLOSED`)
  }
}

export class CircuitBreakerError extends Error {
  public readonly service: string
  public readonly retryAfter: number

  constructor(message: string, service: string, retryAfter: number) {
    super(message)
    this.name = 'CircuitBreakerError'
    this.service = service
    this.retryAfter = retryAfter
  }
}

// Instance globale pour Stripe
export const stripeCircuitBreaker = new CircuitBreaker('stripe', {
  failureThreshold: 5,
  resetTimeoutMs: 30 * 1000,
  halfOpenMaxCalls: 2,
})

// Instance pour Supabase
export const supabaseCircuitBreaker = new CircuitBreaker('supabase', {
  failureThreshold: 10,
  resetTimeoutMs: 15 * 1000,
  halfOpenMaxCalls: 3,
})
