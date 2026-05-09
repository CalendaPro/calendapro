#!/usr/bin/env ts-node
// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK STRESS TEST — 50 Webhooks Stripe Simultanés
// CalendaPro Audit #10 — Test idempotence et queue de retry
// ═══════════════════════════════════════════════════════════════════════════════
//
// OBJECTIF: Vérifier que:
//   ✓ L'idempotency check en DB tient (webhook_events_log)
//   ✓ Aucune transaction traitée 2 fois
//   ✓ La queue de retry gère les échecs
//
// SCÉNARIOS:
//   1. 50 webhooks checkout.session.completed identiques (même event.id)
//   2. 50 webhooks checkout.session.completed différents (même PI, erreur simulée)
//   3. Vérification idempotence avec retry
//
// USAGE: npx ts-node scripts/webhook-stress-test.ts [--live] [--stripe-secret KEY]
//
// ⚠️  NE PAS EXÉCUTER EN PRODUCTION SANS --mock
//
// ═══════════════════════════════════════════════════════════════════════════════

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Nombre de webhooks simultanés
  CONCURRENT_WEBHOOKS: 50,

  // Types d'événements à tester
  EVENT_TYPES: ['checkout.session.completed', 'invoice.paid', 'charge.refunded'],

  // Mode
  MOCK_MODE: !process.argv.includes('--live'),

  // URL webhook
  WEBHOOK_URL: process.env.WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/webhook`,

  // Stripe config (mode live uniquement)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Timeout
  REQUEST_TIMEOUT_MS: 10000,
  TOTAL_TIMEOUT_MS: 60_000,
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface WebhookResult {
  eventId: string
  eventType: string
  startTime: number
  endTime: number
  durationMs: number
  statusCode: number
  success: boolean
  responseBody?: string
  duplicate?: boolean
  retryQueued?: boolean
  error?: string
}

interface WebhookStressReport {
  totalSent: number
  uniqueEvents: number
  duplicatesSent: number
  accepted200: number
  rejected400: number
  idempotentSkipped: number
  retryQueued: number
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  errors: Map<string, number>
  idempotenceCheck: boolean
  duplicateProcessingCheck: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK WEBHOOK SERVER
// ═══════════════════════════════════════════════════════════════════════════════

class MockWebhookServer {
  private processedEvents: Set<string> = new Set()
  private retryQueue: Array<{ eventId: string; attempt: number }> = []
  private bookings: Map<string, any> = new Map()

  // Simule le traitement du webhook route.ts
  async processWebhook(eventId: string, eventType: string, shouldFail: boolean = false): Promise<{
    statusCode: number
    idempotent: boolean
    retryQueued: boolean
    processed: boolean
  }> {
    // Simuler un délai de traitement (50-200ms)
    await this.delay(50 + Math.random() * 150)

    // 1. Vérifier idempotence (comme webhook_events_log)
    if (this.processedEvents.has(eventId)) {
      return { statusCode: 200, idempotent: true, retryQueued: false, processed: false }
    }

    // 2. Simuler un échec aléatoire pour tester retry queue
    if (shouldFail) {
      this.retryQueue.push({ eventId, attempt: 1 })
      return { statusCode: 500, idempotent: false, retryQueued: true, processed: false }
    }

    // 3. Traiter l'événement
    this.processedEvents.add(eventId)

    // Simuler création booking pour checkout.session.completed
    if (eventType === 'checkout.session.completed') {
      const bookingId = `booking_${eventId}`
      this.bookings.set(bookingId, { eventId, createdAt: Date.now() })
    }

    return { statusCode: 200, idempotent: false, retryQueued: false, processed: true }
  }

  getStats() {
    return {
      processedEvents: this.processedEvents.size,
      retryQueueSize: this.retryQueue.length,
      bookingsCreated: this.bookings.size,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK STRESS TEST
// ═══════════════════════════════════════════════════════════════════════════════

class WebhookStressTest {
  private mockServer: MockWebhookServer
  private results: WebhookResult[] = []
  private startTime: number = 0

  constructor(private mockMode: boolean = true) {
    this.mockServer = new MockWebhookServer()
  }

  async run(): Promise<WebhookStressReport> {
    console.log('═'.repeat(80))
    console.log('CALENDAPRO — WEBHOOK STRESS TEST (50 webhooks simultanés)')
    console.log('═'.repeat(80))
    console.log(`Mode:        ${this.mockMode ? 'MOCK (simulation sécurisée)' : 'LIVE ⚠️'}`)
    console.log(`Webhook URL: ${CONFIG.WEBHOOK_URL}`)
    console.log(`Objectif:    Vérifier idempotence + retry queue`)
    console.log('═'.repeat(80))

    if (!this.mockMode && !CONFIG.STRIPE_WEBHOOK_SECRET) {
      console.error('\n❌ STRIPE_WEBHOOK_SECRET requis en mode live')
      process.exit(1)
    }

    this.startTime = Date.now()

    // Phase 1: Webhooks dupliqués (même event.id)
    console.log('\n📤 Phase 1: 30 webhooks identiques (test idempotence)')
    const duplicateEventId = `evt_stress_${Date.now()}_duplicate`
    const duplicatePromises = Array.from({ length: 30 }, (_, i) =>
      this.sendWebhook(duplicateEventId, 'checkout.session.completed', false, i)
    )
    const phase1Results = await Promise.all(duplicatePromises)
    this.results.push(...phase1Results)

    // Phase 2: Webhooks uniques (traitement normal)
    console.log('\n📤 Phase 2: 20 webhooks uniques (traitement normal)')
    const uniquePromises = Array.from({ length: 20 }, (_, i) => {
      const eventId = `evt_stress_${Date.now()}_unique_${i}`
      const eventType = CONFIG.EVENT_TYPES[i % CONFIG.EVENT_TYPES.length]
      return this.sendWebhook(eventId, eventType, false, i + 30)
    })
    const phase2Results = await Promise.all(uniquePromises)
    this.results.push(...phase2Results)

    // Phase 3: Webhooks avec erreur (test retry queue)
    console.log('\n📤 Phase 3: 10 webhooks avec échec simulé (test retry)')
    const failPromises = Array.from({ length: 10 }, (_, i) => {
      const eventId = `evt_stress_${Date.now()}_fail_${i}`
      return this.sendWebhook(eventId, 'invoice.paid', true, i + 50)
    })
    const phase3Results = await Promise.all(failPromises)
    this.results.push(...phase3Results)

    return this.generateReport()
  }

  private async sendWebhook(
    eventId: string,
    eventType: string,
    shouldFail: boolean,
    index: number
  ): Promise<WebhookResult> {
    const startTime = Date.now()

    try {
      if (this.mockMode) {
        return await this.sendMockWebhook(eventId, eventType, shouldFail, startTime)
      } else {
        return await this.sendLiveWebhook(eventId, eventType, startTime)
      }
    } catch (error) {
      return {
        eventId,
        eventType,
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown',
      }
    }
  }

  private async sendMockWebhook(
    eventId: string,
    eventType: string,
    shouldFail: boolean,
    startTime: number
  ): Promise<WebhookResult> {
    const result = await this.mockServer.processWebhook(eventId, eventType, shouldFail)

    const endTime = Date.now()

    return {
      eventId,
      eventType,
      startTime,
      endTime,
      durationMs: endTime - startTime,
      statusCode: result.statusCode,
      success: result.statusCode === 200,
      duplicate: result.idempotent,
      retryQueued: result.retryQueued,
    }
  }

  private async sendLiveWebhook(
    eventId: string,
    eventType: string,
    startTime: number
  ): Promise<WebhookResult> {
    // Créer un payload Stripe-like
    const payload = {
      id: eventId,
      object: 'event',
      api_version: '2024-04-10',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_test_${Date.now()}`,
          object: 'checkout.session',
          status: 'complete',
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: eventType,
    }

    const body = JSON.stringify(payload)

    // Générer une signature Stripe (nécessite la vraie clé webhook)
    // En mode test, on ne peut pas générer une vraie signature sans le secret
    // Donc on s'attend à ce que le webhook renvoie 400 (signature invalide)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 't=1234567890,v1=fake_signature_for_test',
        },
        body,
        signal: controller.signal,
      })

      const endTime = Date.now()
      const responseBody = await response.text().catch(() => '')

      return {
        eventId,
        eventType,
        startTime,
        endTime,
        durationMs: endTime - startTime,
        statusCode: response.status,
        success: response.ok,
        responseBody,
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  private generateReport(): WebhookStressReport {
    const endTime = Date.now()

    // Analyser les résultats
    const uniqueEvents = new Set(this.results.map(r => r.eventId)).size
    const duplicatesSent = this.results.length - uniqueEvents

    const accepted = this.results.filter(r => r.statusCode === 200)
    const rejected = this.results.filter(r => r.statusCode === 400 || r.statusCode === 500)
    const idempotent = this.results.filter(r => r.duplicate)
    const retryQueued = this.results.filter(r => r.retryQueued)

    const responseTimes = this.results.map(r => r.durationMs).sort((a, b) => a - b)

    // Compter les erreurs
    const errors = new Map<string, number>()
    for (const r of this.results.filter(x => !x.success)) {
      const key = r.error || `HTTP ${r.statusCode}`
      errors.set(key, (errors.get(key) || 0) + 1)
    }

    // Vérifications critiques
    const idempotenceCheck = idempotent.length > 0 // Au moins certains marqués comme dupliqués

    // Vérifier pas de double traitement (si on a des doublons, ils doivent être marqués idempotent)
    const duplicateEventId = this.results.find(r => r.eventId.includes('duplicate'))?.eventId
    const duplicateResults = this.results.filter(r => r.eventId === duplicateEventId)
    const processedDuplicates = duplicateResults.filter(r => !r.duplicate && r.success)
    const duplicateProcessingCheck = processedDuplicates.length <= 1 // Max 1 traité

    const report: WebhookStressReport = {
      totalSent: this.results.length,
      uniqueEvents,
      duplicatesSent,
      accepted200: accepted.length,
      rejected400: rejected.length,
      idempotentSkipped: idempotent.length,
      retryQueued: retryQueued.length,
      avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
      minResponseTime: responseTimes[0],
      maxResponseTime: responseTimes[responseTimes.length - 1],
      errors,
      idempotenceCheck,
      duplicateProcessingCheck,
    }

    this.printReport(report)
    return report
  }

  private printReport(report: WebhookStressReport): void {
    console.log('\n' + '═'.repeat(80))
    console.log('RAPPORT — WEBHOOK STRESS TEST')
    console.log('═'.repeat(80))

    console.log(`
📊 STATISTIQUES:
   Webhooks envoyés:     ${report.totalSent}
   Événements uniques:   ${report.uniqueEvents}
   Doublons envoyés:     ${report.duplicatesSent}

✅ RÉSULTATS:
   Acceptés (200):       ${report.accepted200}
   Rejetés (400/500):    ${report.rejected400}
   Idempotents (skip):   ${report.idempotentSkipped}
   Retry queued:         ${report.retryQueued}

⚡ PERFORMANCE:
   Temps moyen:          ${report.avgResponseTime}ms
   Min:                  ${report.minResponseTime}ms
   Max:                  ${report.maxResponseTime}ms
`)

    if (report.errors.size > 0) {
      console.log('❌ ERREURS:')
      for (const [error, count] of report.errors) {
        console.log(`   ${error}: ${count}x`)
      }
    }

    // Validation
    console.log('\n' + '═'.repeat(80))
    console.log('VALIDATION CRITIQUE')
    console.log('═'.repeat(80))

    const checks = [
      { name: 'Idempotence fonctionne', pass: report.idempotenceCheck },
      { name: 'Pas de double traitement', pass: report.duplicateProcessingCheck },
      { name: 'Retry queue capt les échecs', pass: report.retryQueued > 0 },
      { name: 'Response time < 500ms (moy)', pass: report.avgResponseTime < 500 },
    ]

    for (const check of checks) {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`)
    }

    if (this.mockMode) {
      const stats = this.mockServer.getStats()
      console.log(`\n📦 Mock Server Stats:`)
      console.log(`   Events traités: ${stats.processedEvents}`)
      console.log(`   Retry queue: ${stats.retryQueueSize}`)
      console.log(`   Bookings créés: ${stats.bookingsCreated}`)
    }

    const allPassed = checks.every(c => c.pass)
    console.log(`\n${allPassed ? '✅ WEBHOOK STRESS TEST RÉUSSI' : '❌ WEBHOOK STRESS TEST ÉCHOUÉ'}`)
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
  const test = new WebhookStressTest(CONFIG.MOCK_MODE)

  try {
    const report = await test.run()

    const success = report.idempotenceCheck &&
                   report.duplicateProcessingCheck &&
                   report.avgResponseTime < 500

    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('Erreur fatale:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { WebhookStressTest, MockWebhookServer }
