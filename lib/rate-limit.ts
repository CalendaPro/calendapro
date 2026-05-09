// ═══════════════════════════════════════════════════════════════════════════════
// Rate Limiting — Protection contre les abus d'API
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerSupabaseClient } from './supabase-server'
import { logger } from './logger'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Store in-memory (fallback si Supabase indisponible)
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // en millisecondes
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
}

/**
 * Vérifie si une requête est autorisée selon le rate limiting
 * @param identifier — identifiant unique (userId, IP, etc.)
 * @param config — configuration optionnelle
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config }
  const now = Date.now()

  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Nouvelle fenêtre
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(identifier, newEntry)
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // Fenêtre existante
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limiting spécifique pour les routes Stripe
 */
export const stripeRateLimits = {
  refund: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req/minute
  checkout: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/minute
  connect: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 req/minute
}

/**
 * Nettoie les entrées expirées du store (à appeler périodiquement)
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup automatique toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENT RATE LIMITING — Utilise Supabase comme store (Fix #12)
// Remplace le rate limiting en mémoire qui ne fonctionne pas en serverless
// ═══════════════════════════════════════════════════════════════════════════════

interface PersistentRateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Rate limiting persistant utilisant Supabase
 * Fonctionne en serverless multi-instance contrairement au Map en mémoire
 */
export async function checkPersistentRateLimit(
  identifier: string,
  config: { maxRequests: number; windowMs: number } = { maxRequests: 10, windowMs: 60 * 1000 }
): Promise<PersistentRateLimitResult> {
  const supabase = createServerSupabaseClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  try {
    // Appeler la fonction RPC atomique pour vérifier et incrémenter
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_max_requests: config.maxRequests,
      p_window_ms: config.windowMs,
    })

    if (error) {
      logger.error('[RateLimit] Erreur Supabase, fallback mémoire:', error)
      // Fallback au rate limiting en mémoire
      const memResult = checkRateLimit(identifier, config)
      return {
        ...memResult,
        retryAfter: memResult.allowed ? undefined : Math.ceil((memResult.resetTime - Date.now()) / 1000)
      }
    }

    const result = data as { allowed: boolean; count: number; reset_at: string }
    const resetTime = new Date(result.reset_at).getTime()
    const remaining = Math.max(0, config.maxRequests - result.count)

    return {
      allowed: result.allowed,
      remaining,
      resetTime,
      retryAfter: result.allowed ? undefined : Math.ceil((resetTime - now.getTime()) / 1000)
    }
  } catch (err) {
    logger.error('[RateLimit] Exception, fallback mémoire:', err)
    // Fallback au rate limiting en mémoire
    const memResult = checkRateLimit(identifier, config)
    return {
      ...memResult,
      retryAfter: memResult.allowed ? undefined : Math.ceil((memResult.resetTime - Date.now()) / 1000)
    }
  }
}

/**
 * Wrapper pour les routes API Next.js avec rate limiting persistant
 */
export async function withRateLimit<T>(
  identifier: string,
  handler: () => Promise<T>,
  config?: { maxRequests?: number; windowMs?: number }
): Promise<T | Response> {
  const rateLimit = await checkPersistentRateLimit(identifier, {
    maxRequests: config?.maxRequests ?? 20,
    windowMs: config?.windowMs ?? 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Trop de requêtes',
        retryAfter: rateLimit.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter ?? 60),
          'X-RateLimit-Limit': String(config?.maxRequests ?? 20),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
        },
      }
    )
  }

  return handler()
}
