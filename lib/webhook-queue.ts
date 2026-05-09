// ═══════════════════════════════════════════════════════════════════════════════
// Webhook Queue Manager — Retry automatique avec backoff exponentiel
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerSupabaseClient } from './supabase-server'
import { logger } from './logger'

interface WebhookRetryEntry {
  id: string
  stripe_event_id: string
  event_type: string
  event_data: Record<string, unknown>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempt_count: number
  max_attempts: number
  next_attempt_at: string | null
  last_error: string | null
  stripe_signature: string | null
}

/**
 * Ajoute un webhook à la queue de retry
 * Appelé quand le webhook handler échoue
 */
export async function enqueueWebhookRetry(params: {
  stripeEventId: string
  eventType: string
  eventData: Record<string, unknown>
  stripeSignature: string
  error: string
  errorDetails?: Record<string, unknown>
}): Promise<void> {
  const supabase = createServerSupabaseClient()

  // Calculer le premier retry dans 1 minute
  const nextAttemptAt = new Date(Date.now() + 60 * 1000).toISOString()

  await supabase.from('webhook_retry_queue').upsert({
    stripe_event_id: params.stripeEventId,
    event_type: params.eventType,
    event_data: params.eventData,
    stripe_signature: params.stripeSignature,
    status: 'pending',
    attempt_count: 1,
    max_attempts: 5,
    next_attempt_at: nextAttemptAt,
    last_error: params.error,
    error_details: params.errorDetails || null,
  }, {
    onConflict: 'stripe_event_id',
    ignoreDuplicates: false, // Update si déjà existe
  })
}

/**
 * Récupère les webhooks en attente de traitement
 */
export async function getPendingWebhooks(batchSize = 10): Promise<WebhookRetryEntry[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .rpc('get_pending_webhooks', { batch_size: batchSize })

  if (error) {
    logger.error('[WebhookQueue] Erreur récupération pending:', error)
    return []
  }

  return (data || []) as WebhookRetryEntry[]
}

/**
 * Marque un webhook comme en cours de traitement
 */
export async function markWebhookProcessing(id: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  await supabase
    .from('webhook_retry_queue')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}

/**
 * Marque un webhook comme complété avec succès
 */
export async function markWebhookCompleted(id: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  await supabase
    .from('webhook_retry_queue')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', id)
}

/**
 * Planifie une nouvelle tentative après échec
 * Utilise le backoff exponentiel
 */
export async function scheduleRetry(
  id: string,
  attemptCount: number,
  error: string,
  errorDetails?: Record<string, unknown>
): Promise<void> {
  const supabase = createServerSupabaseClient()

  const maxAttempts = 5

  if (attemptCount >= maxAttempts) {
    // Trop de tentatives — marquer comme failed
    await supabase
      .from('webhook_retry_queue')
      .update({
        status: 'failed',
        attempt_count: attemptCount,
        last_error: error,
        error_details: errorDetails || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    logger.error(`[WebhookQueue] Webhook ${id} abandonné après ${maxAttempts} tentatives`)
    return
  }

  // Backoff exponentiel: 1min, 2min, 4min, 8min, 15min
  const delays = [60, 120, 240, 480, 900] // en secondes
  const delaySeconds = delays[Math.min(attemptCount - 1, delays.length - 1)]
  const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString()

  await supabase
    .from('webhook_retry_queue')
    .update({
      status: 'pending',
      attempt_count: attemptCount,
      next_attempt_at: nextAttemptAt,
      last_error: error,
      error_details: errorDetails || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  logger.info(`[WebhookQueue] Retry ${id} programmé dans ${delaySeconds}s (tentative ${attemptCount + 1}/${maxAttempts})`)
}

/**
 * Supprime les vieilles entrées complétées (maintenance)
 */
export async function cleanupOldCompletedEntries(daysToKeep = 7): Promise<number> {
  const supabase = createServerSupabaseClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const { data, error } = await supabase
    .from('webhook_retry_queue')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('updated_at', cutoffDate.toISOString())
    .select('id')

  if (error) {
    logger.error('[WebhookQueue] Erreur cleanup:', error)
    return 0
  }

  const count = data?.length || 0
  logger.info(`[WebhookQueue] ${count} vieilles entrées nettoyées`)
  return count
}

/**
 * Récupère les statistiques de la queue
 */
export async function getQueueStats(): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
}> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('webhook_retry_queue')
    .select('status')

  if (error || !data) {
    return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
  }

  const stats = {
    pending: data.filter(r => r.status === 'pending').length,
    processing: data.filter(r => r.status === 'processing').length,
    completed: data.filter(r => r.status === 'completed').length,
    failed: data.filter(r => r.status === 'failed').length,
    total: data.length,
  }

  return stats
}
