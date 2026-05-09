// ═══════════════════════════════════════════════════════════════════════════════
// Email Queue Manager — Retry automatique pour emails critiques (Fix #7)
// Modèle: lib/webhook-queue.ts
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerSupabaseClient } from './supabase-server'
import { logger } from './logger'

export type EmailType = 
  | 'booking_confirmation'
  | 'payment_confirmation'
  | 'reminder'
  | 'review_request'
  | 'refund_notification'
  | 'payout_notification'
  | 'payment_failed'
  | 'welcome_pro'
  | 'onboarding_reminder'
  | 'page_live'
  | 'first_booking'

interface EmailPayload {
  to: string
  subject: string
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string
    encoding?: string
  }>
  // Champs spécifiques selon le type
  [key: string]: unknown
}

interface EmailQueueEntry {
  id: string
  email_type: EmailType
  payload: EmailPayload
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempt_count: number
  max_attempts: number
  next_attempt_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  priority: number // 1 = haute, 2 = normale, 3 = basse
}

/**
 * Ajoute un email à la queue de retry
 * Appelé quand l'envoi synchrone échoue ou pour les emails programmés
 */
export async function enqueueEmail(params: {
  emailType: EmailType
  payload: EmailPayload
  priority?: number
  maxAttempts?: number
  delayMs?: number
}): Promise<string> {
  const supabase = createServerSupabaseClient()
  
  const nextAttemptAt = params.delayMs 
    ? new Date(Date.now() + params.delayMs).toISOString()
    : new Date().toISOString()

  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      email_type: params.emailType,
      payload: params.payload,
      status: 'pending',
      attempt_count: 0,
      max_attempts: params.maxAttempts ?? 5,
      next_attempt_at: nextAttemptAt,
      priority: params.priority ?? 2,
    })
    .select('id')
    .single()

  if (error) {
    logger.error('[EmailQueue] Erreur insertion:', error)
    throw new Error(`Impossible d''ajouter l''email à la queue: ${error.message}`)
  }

  logger.info(`[EmailQueue] Email ${params.emailType} ajouté (id: ${data.id})`)
  return data.id
}

/**
 * Récupère les emails en attente de traitement
 * Trié par priorité puis date de création
 */
export async function getPendingEmails(batchSize = 10): Promise<EmailQueueEntry[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (error) {
    logger.error('[EmailQueue] Erreur récupération pending:', error)
    return []
  }

  return (data || []) as EmailQueueEntry[]
}

/**
 * Marque un email comme en cours de traitement
 */
export async function markEmailProcessing(id: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  await supabase
    .from('email_queue')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}

/**
 * Marque un email comme envoyé avec succès
 */
export async function markEmailCompleted(id: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  await supabase
    .from('email_queue')
    .update({
      status: 'completed',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}

/**
 * Planifie une nouvelle tentative après échec
 * Utilise le backoff exponentiel
 */
export async function scheduleEmailRetry(
  id: string,
  attemptCount: number,
  error: string
): Promise<void> {
  const supabase = createServerSupabaseClient()

  const { data: entry } = await supabase
    .from('email_queue')
    .select('max_attempts')
    .eq('id', id)
    .single()

  const maxAttempts = entry?.max_attempts ?? 5

  if (attemptCount >= maxAttempts) {
    // Trop de tentatives — marquer comme failed
    await supabase
      .from('email_queue')
      .update({
        status: 'failed',
        attempt_count: attemptCount,
        last_error: error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    logger.error(`[EmailQueue] Email ${id} abandonné après ${maxAttempts} tentatives: ${error}`)
    return
  }

  // Backoff exponentiel: 2min, 4min, 8min, 15min, 30min
  const delays = [120, 240, 480, 900, 1800] // en secondes
  const delaySeconds = delays[Math.min(attemptCount - 1, delays.length - 1)]
  const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString()

  await supabase
    .from('email_queue')
    .update({
      status: 'pending',
      attempt_count: attemptCount,
      next_attempt_at: nextAttemptAt,
      last_error: error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  logger.info(`[EmailQueue] Retry ${id} programmé dans ${delaySeconds}s (tentative ${attemptCount + 1}/${maxAttempts})`)
}

/**
 * Supprime les vieilles entrées complétées (maintenance)
 */
export async function cleanupOldEmails(daysToKeep = 7): Promise<number> {
  const supabase = createServerSupabaseClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const { data, error } = await supabase
    .from('email_queue')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('updated_at', cutoffDate.toISOString())
    .select('id')

  if (error) {
    logger.error('[EmailQueue] Erreur cleanup:', error)
    return 0
  }

  const count = data?.length || 0
  logger.info(`[EmailQueue] ${count} vieux emails nettoyés`)
  return count
}

/**
 * Récupère les statistiques de la queue
 */
export async function getEmailQueueStats(): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
}> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('email_queue')
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

/**
 * Wrapper pour envoyer un email avec fallback vers la queue
 * Usage: Au lieu d'appeler resend.emails.send directement, utiliser cette fonction
 */
export async function sendEmailWithQueueFallback(
  emailType: EmailType,
  payload: EmailPayload,
  sendFunction: () => Promise<void>
): Promise<void> {
  try {
    await sendFunction()
    logger.info(`[EmailQueue] Email ${emailType} envoyé directement à ${payload.to}`)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(`[EmailQueue] Échec envoi direct ${emailType}:`, errorMsg)
    
    // Ajouter à la queue pour retry
    await enqueueEmail({
      emailType,
      payload,
      priority: 1, // Haute priorité car échec immédiat
    })
  }
}
