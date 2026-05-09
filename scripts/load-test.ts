#!/usr/bin/env ts-node
// ═══════════════════════════════════════════════════════════════════════════════
// LOAD TEST — Montée en Charge Progressive CalendaPro
// Audit #10 — Test de robustesse finale
// ═══════════════════════════════════════════════════════════════════════════════
//
// SCÉNARIO: 10 → 50 → 100 → 500 utilisateurs simultanés
// MESURES: Temps de réponse à chaque palier
// OBJECTIF: Identifier le point de rupture
//
// USAGE: npx ts-node scripts/load-test.ts [--api <endpoint>] [--mock]
//
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Paliers de charge (utilisateurs simultanés)
  TIERS: [10, 50, 100, 500],

  // Durée de chaque palier (ms)
  TIER_DURATION_MS: 30_000, // 30 secondes par palier

  // Ramp-up entre paliers (ms)
  RAMP_UP_MS: 5_000, // 5 secondes

  // URL de l'API à tester
  API_BASE_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.API_BASE_URL || 'http://localhost:3000',

  // Mode mock (pas d'appels réels)
  MOCK_MODE: process.argv.includes('--mock'),

  // Endpoint spécifique
  ENDPOINT: process.argv.find((_, i, arr) => arr[i - 1] === '--api') || '/api/marketplace',

  // Timeout par requête
  REQUEST_TIMEOUT_MS: 10_000,
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface LoadTestResult {
  tier: number
  timestamp: number
  responseTimeMs: number
  statusCode: number
  success: boolean
  error?: string
}

interface TierSummary {
  tier: number
  totalRequests: number
  successful: number
  failed: number
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  throughputRPS: number
  errorRate: number
}

interface LoadTestReport {
  startTime: number
  endTime: number
  totalDurationMs: number
  tierSummaries: TierSummary[]
  breakingPoint?: number
  recommendations: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD TEST ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class ProgressiveLoadTest {
  private results: LoadTestResult[] = []
  private abortController: AbortController = new AbortController()

  constructor(private mockMode: boolean = true) {}

  async run(): Promise<LoadTestReport> {
    console.log('═'.repeat(80))
    console.log('CALENDAPRO — LOAD TEST: Montée en Charge Progressive')
    console.log('═'.repeat(80))
    console.log(`Mode: ${this.mockMode ? 'MOCK' : 'LIVE'}`)
    console.log(`Endpoint: ${CONFIG.ENDPOINT}`)
    console.log(`Paliers: ${CONFIG.TIERS.join(' → ')} utilisateurs`)
    console.log('═'.repeat(80))

    const startTime = Date.now()
    const tierSummaries: TierSummary[] = []
    let breakingPoint: number | undefined

    for (const tier of CONFIG.TIERS) {
      if (this.abortController.signal.aborted) break

      console.log(`\n📈 PALIER ${tier} UTILISATEURS`)
      console.log('-'.repeat(40))

      const tierResults = await this.runTier(tier)
      this.results.push(...tierResults)

      const summary = this.analyzeTier(tier, tierResults)
      tierSummaries.push(summary)

      this.printTierSummary(summary)

      // Détecter point de rupture
      if (summary.errorRate > 0.1 || summary.avgResponseTime > 5000) {
        if (!breakingPoint) {
          breakingPoint = tier
          console.log(`⚠️  POINT DE RUPTURE DÉTECTÉ à ${tier} utilisateurs`)
        }
      }

      // Pause entre paliers (sauf dernier)
      if (tier !== CONFIG.TIERS[CONFIG.TIERS.length - 1]) {
        console.log(`⏳ Ramp-down ${CONFIG.RAMP_UP_MS / 1000}s avant prochain palier...`)
        await this.delay(CONFIG.RAMP_UP_MS)
      }
    }

    const endTime = Date.now()

    const report: LoadTestReport = {
      startTime,
      endTime,
      totalDurationMs: endTime - startTime,
      tierSummaries,
      breakingPoint,
      recommendations: this.generateRecommendations(tierSummaries, breakingPoint),
    }

    this.printFinalReport(report)
    return report
  }

  private async runTier(tier: number): Promise<LoadTestResult[]> {
    const tierStart = Date.now()
    const results: LoadTestResult[] = []
    const promises: Promise<void>[] = []

    // Lancer N utilisateurs simultanés
    for (let i = 0; i < tier; i++) {
      promises.push(
        this.simulateUser(i, tierStart, results).catch(error => {
          results.push({
            tier,
            timestamp: Date.now(),
            responseTimeMs: 0,
            statusCode: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown',
          })
        })
      )
    }

    // Attendre la fin du palier ou timeout
    const tierTimeout = new Promise<void>(resolve =>
      setTimeout(resolve, CONFIG.TIER_DURATION_MS)
    )

    await Promise.race([Promise.all(promises), tierTimeout])

    return results
  }

  private async simulateUser(
    userIndex: number,
    tierStart: number,
    results: LoadTestResult[]
  ): Promise<void> {
    const maxIterations = Math.floor(CONFIG.TIER_DURATION_MS / 100) // Max 10 req/sec par user

    for (let i = 0; i < maxIterations; i++) {
      if (Date.now() - tierStart >= CONFIG.TIER_DURATION_MS) break
      if (this.abortController.signal.aborted) break

      const reqStart = Date.now()

      try {
        if (this.mockMode) {
          await this.mockRequest()
        } else {
          await this.liveRequest()
        }

        const responseTime = Date.now() - reqStart

        results.push({
          tier: 0, // Sera mis à jour par runTier
          timestamp: reqStart,
          responseTimeMs: responseTime,
          statusCode: 200,
          success: true,
        })
      } catch (error) {
        results.push({
          tier: 0,
          timestamp: reqStart,
          responseTimeMs: Date.now() - reqStart,
          statusCode: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Request failed',
        })
      }

      // Petit délai entre requêtes d'un même utilisateur
      await this.delay(Math.random() * 50 + 50) // 50-100ms
    }
  }

  private async mockRequest(): Promise<void> {
    // Simule un temps de réponse variable basé sur la charge
    const baseLatency = 50
    const randomFactor = Math.random() * 100
    const loadFactor = this.results.length > 1000 ? 200 : 0

    const totalLatency = baseLatency + randomFactor + loadFactor
    await this.delay(totalLatency)

    // Simule une erreur aléatoire rare (0.5%)
    if (Math.random() < 0.005) {
      throw new Error('Mock random error')
    }
  }

  private async liveRequest(): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINT}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      })

      return response
    } finally {
      clearTimeout(timeout)
    }
  }

  private analyzeTier(tier: number, results: LoadTestResult[]): TierSummary {
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    const responseTimes = successful.map(r => r.responseTimeMs).sort((a, b) => a - b)

    const avg = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    const p50 = this.percentile(responseTimes, 0.5)
    const p95 = this.percentile(responseTimes, 0.95)
    const p99 = this.percentile(responseTimes, 0.99)

    // Throughput: requêtes par seconde
    const durationSeconds = CONFIG.TIER_DURATION_MS / 1000
    const throughput = results.length / durationSeconds

    return {
      tier,
      totalRequests: results.length,
      successful: successful.length,
      failed: failed.length,
      avgResponseTime: Math.round(avg),
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      p50ResponseTime: p50,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      throughputRPS: Math.round(throughput * 10) / 10,
      errorRate: results.length > 0 ? failed.length / results.length : 0,
    }
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0
    const index = Math.ceil(sortedArray.length * p) - 1
    return sortedArray[Math.max(0, index)]
  }

  private printTierSummary(summary: TierSummary): void {
    const status = summary.errorRate > 0.1 || summary.avgResponseTime > 2000 ? '❌' :
                   summary.avgResponseTime > 500 ? '⚠️' : '✅'

    console.log(`
   ${status} Résultats pour ${summary.tier} utilisateurs:
      Requêtes:      ${summary.totalRequests} (${summary.successful} OK, ${summary.failed} KO)
      Temps moyen:   ${summary.avgResponseTime}ms
      P50 / P95:     ${summary.p50ResponseTime}ms / ${summary.p95ResponseTime}ms
      Throughput:    ${summary.throughputRPS} req/sec
      Taux d'erreur: ${(summary.errorRate * 100).toFixed(1)}%
    `)
  }

  private generateRecommendations(summaries: TierSummary[], breakingPoint?: number): string[] {
    const recommendations: string[] = []

    if (breakingPoint) {
      recommendations.push(`⚠️ Point de rupture identifié à ${breakingPoint} utilisateurs simultanés`)
      recommendations.push(`   → Envisager une mise à l'échelle horizontale (load balancing)`)
      recommendations.push(`   → Augmenter les ressources serveur (CPU/Memory)`)
    }

    // Analyser la dégradation
    for (let i = 1; i < summaries.length; i++) {
      const prev = summaries[i - 1]
      const curr = summaries[i]

      const timeIncrease = (curr.avgResponseTime - prev.avgResponseTime) / prev.avgResponseTime
      if (timeIncrease > 1) {
        recommendations.push(`⚠️ Dégradation significative entre ${prev.tier} et ${curr.tier} users (+${(timeIncrease * 100).toFixed(0)}%)`)
      }
    }

    // Recommandations générales
    const lastSummary = summaries[summaries.length - 1]
    if (lastSummary.p95ResponseTime > 1000) {
      recommendations.push(`🔧 P95 > 1s: Optimiser les requêtes DB (index, cache)`)
    }

    if (lastSummary.throughputRPS < 100) {
      recommendations.push(`🔧 Throughput faible: Envisager Redis/cache pour le marketplace`)
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Système stable à tous les paliers testés')
      recommendations.push(`   → Capacité estimée: ${lastSummary.tier}+ utilisateurs simultanés`)
    }

    return recommendations
  }

  private printFinalReport(report: LoadTestReport): void {
    console.log('\n' + '═'.repeat(80))
    console.log('RAPPORT FINAL — LOAD TEST')
    console.log('═'.repeat(80))

    console.log(`
📊 RÉSUMÉ:
   Durée totale:    ${(report.totalDurationMs / 1000).toFixed(0)} secondes
   Point de rupture: ${report.breakingPoint ? report.breakingPoint + ' utilisateurs' : 'Non atteint'}
`)

    console.log('📈 ÉVOLUTION PAR PALIER:')
    console.log('   Tier    | Avg (ms) | P95 (ms) | Throughput | Error Rate')
    console.log('   --------|----------|----------|------------|------------')
    for (const s of report.tierSummaries) {
      console.log(
        `   ${s.tier.toString().padEnd(7)} | ` +
        `${s.avgResponseTime.toString().padEnd(8)} | ` +
        `${s.p95ResponseTime.toString().padEnd(8)} | ` +
        `${s.throughputRPS.toString().padEnd(10)} | ` +
        `${(s.errorRate * 100).toFixed(1)}%`
      )
    }

    console.log('\n💡 RECOMMANDATIONS:')
    for (const rec of report.recommendations) {
      console.log(`   ${rec}`)
    }

    // Estimation capacité
    const maxStable = report.tierSummaries
      .filter(s => s.errorRate < 0.05 && s.avgResponseTime < 1000)
      .pop()

    console.log(`\n🎯 CAPACITÉ ESTIMÉE: ${maxStable ? maxStable.tier : 'N/A'} utilisateurs simultanés (stable)`)
    console.log('═'.repeat(80))
  }

  stop(): void {
    this.abortController.abort()
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const test = new ProgressiveLoadTest(CONFIG.MOCK_MODE)

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Arrêt demandé...')
    test.stop()
  })

  try {
    const report = await test.run()

    // Exit code basé sur les résultats
    const hasBreakingPoint = report.breakingPoint !== undefined
    const lastTier = report.tierSummaries[report.tierSummaries.length - 1]
    const acceptable = lastTier && lastTier.errorRate < 0.1 && lastTier.avgResponseTime < 2000

    process.exit(hasBreakingPoint || !acceptable ? 1 : 0)
  } catch (error) {
    console.error('Erreur fatale:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { ProgressiveLoadTest }
