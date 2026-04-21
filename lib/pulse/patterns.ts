import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ReminderCandidate, ClientPattern } from './types'

// ── Trigger pattern analysis for all pros (or one) ──────────
export async function analyzePatterns(proId?: string): Promise<number> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.rpc('pulse_analyze_patterns', {
    target_pro_id: proId ?? null,
  })

  if (error) {
    console.error('[Pulse:Patterns] Analysis failed:', error.message)
    throw new Error(`Pattern analysis failed: ${error.message}`)
  }

  return (data as number) ?? 0
}

// ── Get clients who should receive a reminder ───────────────
export async function getReminderCandidates(
  lookaheadDays = 7
): Promise<ReminderCandidate[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.rpc('pulse_get_reminder_candidates', {
    lookahead_days: lookaheadDays,
  })

  if (error) {
    console.error('[Pulse:Patterns] Candidate fetch failed:', error.message)
    throw new Error(`Candidate fetch failed: ${error.message}`)
  }

  return (data as ReminderCandidate[]) ?? []
}

// ── Mark a reminder as sent ─────────────────────────────────
export async function markReminderSent(
  patternId: string,
  channel: 'email' | 'sms',
  messagePreview: string,
  proId: string,
  clientId: string
): Promise<void> {
  const supabase = createServerSupabaseClient()

  const now = new Date().toISOString()

  const [patternUpdate, logInsert] = await Promise.all([
    supabase
      .from('pulse_client_patterns')
      .update({ reminder_sent_at: now })
      .eq('id', patternId),
    supabase.from('pulse_reminder_log').insert({
      pro_id: proId,
      client_id: clientId,
      pattern_id: patternId,
      channel,
      message_preview: messagePreview.slice(0, 500),
      status: 'sent',
    }),
  ])

  if (patternUpdate.error) {
    console.error('[Pulse:Patterns] Mark sent failed:', patternUpdate.error.message)
  }
  if (logInsert.error) {
    console.error('[Pulse:Patterns] Log insert failed:', logInsert.error.message)
  }
}

// ── Get all patterns for a specific pro ─────────────────────
export async function getPatternsByPro(proId: string): Promise<ClientPattern[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_client_patterns')
    .select('*')
    .eq('pro_id', proId)
    .order('confidence_score', { ascending: false })

  if (error) {
    throw new Error(`Patterns fetch failed: ${error.message}`)
  }

  return (data as ClientPattern[]) ?? []
}

// ── Get reminder log for a pro ──────────────────────────────
export async function getReminderLog(
  proId: string,
  limit = 50
) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_reminder_log')
    .select('*')
    .eq('pro_id', proId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Reminder log fetch failed: ${error.message}`)
  }

  return data ?? []
}

// ── Generate personalized reminder message ──────────────────
export function generateReminderMessage(candidate: ReminderCandidate): {
  subject: string
  body: string
} {
  const clientFirst = candidate.client_name?.split(' ')[0] ?? 'Bonjour'
  const proName = candidate.pro_full_name ?? 'votre professionnel'
  const interval = candidate.avg_interval_days
  const lastVisit = candidate.last_booking_at
    ? new Date(candidate.last_booking_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      })
    : 'un moment'

  const frequencyLabel =
    interval <= 14
      ? 'toutes les deux semaines'
      : interval <= 35
        ? 'chaque mois'
        : interval <= 50
          ? 'toutes les six semaines'
          : `tous les ${Math.round(interval / 30)} mois`

  const service = candidate.preferred_service
    ? ` pour votre ${candidate.preferred_service}`
    : ''

  const subject = `${clientFirst}, c'est bientôt le moment de reprendre RDV !`

  const body =
    `${clientFirst},\n\n` +
    `On a remarqué que vous passez habituellement ${frequencyLabel} chez ${proName}${service}. ` +
    `Votre dernière visite date du ${lastVisit} — il est peut-être temps de réserver votre prochain créneau !\n\n` +
    `👉 Réservez en un clic : ${process.env.NEXT_PUBLIC_APP_URL}/${candidate.pro_username}\n\n` +
    `À très bientôt,\nL'équipe CalendaPro`

  return { subject, body }
}
