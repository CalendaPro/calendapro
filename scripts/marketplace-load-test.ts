#!/usr/bin/env ts-node
// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE LOAD TEST — 1000 Requêtes Simultanées
// CalendaPro Audit #10 — Vérification cache et index DB
// ═══════════════════════════════════════════════════════════════════════════════
//
// OBJECTIF: Vérifier que:
//   ✓ Les index DB (Audit #7) tiennent la charge
//   ✓ unstable_cache réduit la charge DB
//   ✓ Temps de réponse < 2s sous charge
//
// MÉTRIQUES:
//   - DB Query time vs Cache hit ratio
//   - Response time P50/P95/P99
//   - Error rate
//
// USAGE: npx ts-node scripts/marketplace-load-test.ts [--live] [--concurrent N]
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Nombre total de requêtes
  TOTAL_REQUESTS: 1000,

  // Nombre de requêtes simultanées (batch)
  CONCURRENT_BATCH_SIZE: parseInt(process.argv.find((_, i, arr) => arr[i - 1] === '--concurrent') || '50'),

  // URL API
  API_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.API_BASE_URL || 'http://localhost:3000',
  ENDPOINT: '/api/marketplace',

  // Paramètres de test (variation pour tester cache)
  QUERY_PARAMS: [
    '', // Liste complète
    '?category=coach',
    '?city=Paris',
    '?search=massage',
    '?sort=rating_desc',
    '?lat=48.8566&lng=2.3522', // Avec géoloc
  ],

  // Mode
  MOCK_MODE: !process.argv.includes('--live'),

  // Timeouts
  REQUEST_TIMEOUT_MS: 5000,
  TOTAL_TIMEOUT_MS: 120_000, // 2 minutes max
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MarketplaceRequestResult {
  id: number
  paramIndex: number
  param: string
  startTime: number
  endTime: number
  responseTimeMs: number
  statusCode: number
  success: boolean
  cacheHit?: boolean
  prosCount?: number
  error?: string
}

interface MarketplaceLoadReport {
  totalRequests: number
  successful: number
  failed: number
  cacheHitRate: number
  avgResponseTime: number
  p50Time: number
  p95Time: number
  p99Time: number
  minTime: number
  maxTime: number
  throughputRPS: number
  totalDurationMs: number
  errorsByType: Map<string, number>
  responseTimeByParam: Map<string, { count: number; avg: number }>
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE LOAD TEST
// ═══════════════════════════════════════════════════════════════════════════════

class MarketplaceLoadTest {
  private results: MarketplaceRequestResult[] = []
  private startTime: number = 0

  async run(): Promise<MarketplaceLoadReport> {
    console.log('═'.repeat(80))
    console.log('CALENDAPRO — MARKETPLACE LOAD TEST')
    console.log('═'.repeat(80))
    console.log(`Mode:      ${CONFIG.MOCK_MODE ? 'MOCK (simulation)' : 'LIVE (requêtes réelles)'}`)
    console.log(`Requests:  ${CONFIG.TOTAL_REQUESTS} total, ${CONFIG.CONCURRENT_BATCH_SIZE} concurrent`)
    console.log(`Endpoint:  ${CONFIG.ENDPOINT}`)
    console.log(`Cache:     ${CONFIG.MOCK_MODE ? 'Simulated' : 'Next.js unstable_cache (60s)'}`)
    console.log('═'.repeat(80))

    this.startTime = Date.now()

    // Exécuter en batches
    const batches = Math.ceil(CONFIG.TOTAL_REQUESTS / CONFIG.CONCURRENT_BATCH_SIZE)
    let completed = 0

    for (let batch = 0; batch < batches; batch++) {
      if (Date.now() - this.startTime > CONFIG.TOTAL_TIMEOUT_MS) {
        console.log('\n⏱️  Timeout global atteint, arrêt...')
        break
      }

      const batchSize = Math.min(
        CONFIG.CONCURRENT_BATCH_SIZE,
        CONFIG.TOTAL_REQUESTS - completed
      )

      const batchPromises = Array.from({ length: batchSize }, (_, i) => {
        const requestId = completed + i
        const paramIndex = requestId % CONFIG.QUERY_PARAMS.length
        return this.executeRequest(requestId, paramIndex)
      })

      const batchResults = await Promise.all(batchPromises)
      this.results.push(...batchResults)
      completed += batchSize

      if (batch % 5 === 0 || batch === batches - 1) {
        console.log(`   Progress: ${completed}/${CONFIG.TOTAL_REQUESTS} (${Math.round(completed / CONFIG.TOTAL_REQUESTS * 100)}%)`)
      }
    }

    return this.generateReport()
  }

  private async executeRequest(id: number, paramIndex: number): Promise<MarketplaceRequestResult> {
    const param = CONFIG.QUERY_PARAMS[paramIndex]
    const startTime = Date.now()

    try {
      if (CONFIG.MOCK_MODE) {
        return await this.mockRequest(id, paramIndex, param, startTime)
      } else {
        return await this.liveRequest(id, paramIndex, param, startTime)
      }
    } catch (error) {
      return {
        id,
        paramIndex,
        param,
        startTime,
        endTime: Date.now(),
        responseTimeMs: Date.now() - startTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async mockRequest(
    id: number,
    paramIndex: number,
    param: string,
    startTime: number
  ): Promise<MarketplaceRequestResult> {
    // Simuler temps de réponse variable
    // - Cache hit: 10-50ms
    // - Cache miss: 100-300ms (simule requête DB)
    // - Paramètre complexe (géoloc): +50-100ms

    const isCacheHit = Math.random() < 0.7 // 70% hit rate simulé
    const isGeoloc = param.includes('lat=')
    const isComplex = param.includes('search=')

    let latency: number
    if (isCacheHit) {
      latency = 10 + Math.random() * 40 // 10-50ms
    } else {
      latency = 100 + Math.random() * 200 // 100-300ms
    }

    if (isGeoloc) latency += 50 + Math.random() * 100
    if (isComplex) latency += 20 + Math.random() * 50

    // Simuler erreur occasionnelle (0.1%)
    if (Math.random() < 0.001) {
      await this.delay(latency)
      throw new Error('Simulated DB timeout')
    }

    await this.delay(latency)

    const endTime = Date.now()

    return {
      id,
      paramIndex,
      param,
      startTime,
      endTime,
      responseTimeMs: endTime - startTime,
      statusCode: 200,
      success: true,
      cacheHit: isCacheHit,
      prosCount: 25 + Math.floor(Math.random() * 75), // 25-100 pros
    }
  }

  private async liveRequest(
    id: number,
    paramIndex: number,
    param: string,
    startTime: number
  ): Promise<MarketplaceRequestResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINT}${param}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Request-ID': `load-${id}`,
        },
      })

      const endTime = Date.now()
      const data = await response.json().catch(() => ({}))

      // Détecter cache hit via header (si configuré sur l'API)
      const cacheHeader = response.headers.get('x-cache') || ''
      const cacheHit = cacheHeader.includes('HIT') || cacheHeader.includes('hit')

      return {
        id,
        paramIndex,
        param,
        startTime,
        endTime,
        responseTimeMs: endTime - startTime,
        statusCode: response.status,
        success: response.ok,
        cacheHit,
        prosCount: data.pros?.length,
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  private generateReport(): MarketplaceLoadReport {
    const endTime = Date.now()
    const totalDuration = endTime - this.startTime

    const successful = this.results.filter(r => r.success)
    const failed = this.results.filter(r => !r.success)
    const withCache = this.results.filter(r => r.cacheHit)

    const responseTimes = successful.map(r => r.responseTimeMs).sort((a, b) => a - b)

    // Calculer stats par paramètre
    const byParam = new Map<string, { count: number; total: number }>()
    for (const r of this.results) {
      const key = r.param || 'default'
      const current = byParam.get(key) || { count: 0, total: 0 }
      current.count++
      current.total += r.responseTimeMs
      byParam.set(key, current)
    }

    const responseTimeByParam = new Map<string, { count: number; avg: number }>()
    for (const [key, val] of byParam) {
      responseTimeByParam.set(key, { count: val.count, avg: Math.round(val.total / val.count) })
    }

    // Errors
    const errorsByType = new Map<string, number>()
    for (const r of failed) {
      const key = r.error || 'Unknown'
      errorsByType.set(key, (errorsByType.get(key) || 0) + 1)
    }

    const report: MarketplaceLoadReport = {
      totalRequests: this.results.length,
      successful: successful.length,
      failed: failed.length,
      cacheHitRate: withCache.length / this.results.length,
      avgResponseTime: responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
      p50Time: this.percentile(responseTimes, 0.5),
      p95Time: this.percentile(responseTimes, 0.95),
      p99Time: this.percentile(responseTimes, 0.99),
      minTime: responseTimes[0] || 0,
      maxTime: responseTimes[responseTimes.length - 1] || 0,
      throughputRPS: Math.round((this.results.length / (totalDuration / 1000)) * 10) / 10,
      totalDurationMs: totalDuration,
      errorsByType,
      responseTimeByParam,
    }

    this.printReport(report)
    return report
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[Math.max(0, index)]
  }

  private printReport(report: MarketplaceLoadReport): void {
    console.log('\n' + '═'.repeat(80))
    console.log('RAPPORT — MARKETPLACE LOAD TEST (1000 requêtes)')
    console.log('═'.repeat(80))

    console.log(`
📊 STATISTIQUES GLOBALES:
   Requêtes totales:  ${report.totalRequests}
   Succès:            ${report.successful} ✅
   Échecs:            ${report.failed} ${report.failed > 0 ? '❌' : '✅'}
   Taux de réussite:  ${((report.successful / report.totalRequests) * 100).toFixed(2)}%

⚡ PERFORMANCE:
   Temps total:       ${(report.totalDurationMs / 1000).toFixed(1)}s
   Throughput:        ${report.throughputRPS} req/sec
   
   Temps de réponse:
   ├─ Min:            ${report.minTime}ms
   ├─ Moyenne:        ${report.avgResponseTime}ms
   ├─ P50 (médiane):  ${report.p50Time}ms
   ├─ P95:            ${report.p95Time}ms
   └─ P99:            ${report.p99Time}ms

💾 CACHE:
   Hit rate:          ${(report.cacheHitRate * 100).toFixed(1)}%
   ${report.cacheHitRate > 0.6 ? '✅ Cache efficace' : '⚠️ Cache sous-utilisé'}
`)

    console.log('📋 TEMPS PAR PARAMÈTRE:')
    console.log('   Paramètre           | Count | Avg (ms)')
    console.log('   --------------------|-------|----------')
    for (const [param, stats] of report.responseTimeByParam) {
      const displayParam = (param || 'default').padEnd(19)
      console.log(`   ${displayParam} | ${stats.count.toString().padEnd(5)} | ${stats.avg}`)
    }

    if (report.errorsByType.size > 0) {
      console.log('\n❌ ERREURS:')
      for (const [error, count] of report.errorsByType) {
        console.log(`   ${error}: ${count}x`)
      }
    }

    // Validation
    console.log('\n' + '═'.repeat(80))
    console.log('VALIDATION')
    console.log('═'.repeat(80))

    const checks = [
      { name: 'P95 < 2000ms (objectif)', pass: report.p95Time < 2000 },
      { name: 'Error rate < 1%', pass: (report.failed / report.totalRequests) < 0.01 },
      { name: 'Throughput > 50 req/s', pass: report.throughputRPS > 50 },
      { name: 'Cache hit rate > 60%', pass: report.cacheHitRate > 0.6 },
    ]

    for (const check of checks) {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`)
    }

    const allPassed = checks.every(c => c.pass)
    console.log(`\n${allPassed ? '✅ MARKETPLACE LOAD TEST RÉUSSI' : '❌ MARKETPLACE LOAD TEST ÉCHOUÉ'}`)

    if (report.p95Time > 2000) {
      console.log('\n💡 RECOMMANDATIONS:')
      console.log('   → P95 élevé: Vérifier les index DB (idx_profiles_fulltext, idx_services_user_price)')
      console.log('   → Augmenter le TTL du cache marketplace (actuel: 60s)')
      console.log('   → Ajouter un CDN pour les assets statiques')
    }

    console.log('═'.repeat(80))
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const test = new MarketplaceLoadTest()

  try {
    const report = await test.run()

    const success = report.p95Time < 2000 &&
                   (report.failed / report.totalRequests) < 0.01 &&
                   report.throughputRPS > 50

    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('Erreur fatale:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { MarketplaceLoadTest }
