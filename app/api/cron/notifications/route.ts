import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  sendBookingNotification,
  sendBookingConfirmation,
  sendBookingSMS,
} from '@/lib/emails'
import { consumeCredit } from '@/lib/sms-credits'
import { getUserPlan } from '@/lib/subscription'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface QueueRow {
  id: string
  booking_id: string
  type: string
  recipient: string
  payload: Record<string, string>
  retry_count: number
  max_retries: number
}

export async function GET(request: Request) {
  // Sécurité : vérifier le secret Vercel Cron
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    console.error('[Cron] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  // Récupérer les notifications éligibles :
  // - status 'pending' ou 'failed'
  // - retry_count < max_retries (filtré par PostgREST)
  // - next_retry_at NULL (premier essai) ou dans le passé
  const { data: pendingNotifs, error: fetchErr } = await supabase
    .from('notification_queue')
    .select('*')
    .in('status', ['pending', 'failed'])
    .filter('retry_count', 'lt', 3)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(50)

  if (fetchErr) {
    console.error('[Cron:Notifs] Fetch error:', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  const rows = (pendingNotifs ?? []) as QueueRow[]

  if (rows.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0 })
  }

  let sent = 0
  let failed = 0

  for (const notif of rows) {
    try {
      await processNotification(supabase, notif)

      await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', notif.id)

      sent++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const newCount = (notif.retry_count ?? 0) + 1
      const maxR = notif.max_retries ?? 3
      const isFinal = newCount >= maxR

      // Backoff exponentiel : 2^n minutes (2min, 4min, 8min...)
      const nextRetry = isFinal
        ? null
        : new Date(Date.now() + Math.pow(2, newCount) * 60 * 1000).toISOString()

      await supabase
        .from('notification_queue')
        .update({
          status: isFinal ? 'failed' : 'pending',
          retry_count: newCount,
          last_error: errMsg,
          next_retry_at: nextRetry,
        })
        .eq('id', notif.id)

      console.error(`[Cron:Notifs] ${notif.type} → ${notif.recipient} : ${errMsg}`)
      failed++
    }
  }

  console.log(`[Cron:Notifs] Done: ${sent} sent, ${failed} failed`)
  return NextResponse.json({ processed: rows.length, sent, failed })
}

async function processNotification(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  notif: QueueRow
): Promise<void> {
  const { type, recipient, payload } = notif

  switch (type) {
    case 'pro_email':
      await sendBookingNotification({
        professionalEmail: recipient,
        professionalName:  payload.professionalName ?? 'Professionnel',
        clientName:        payload.clientName ?? 'Client',
        clientEmail:       payload.clientEmail ?? '',
        date:              payload.date ?? '',
        notes:             payload.notes,
      })
      break

    case 'client_email':
      await sendBookingConfirmation({
        clientEmail:       recipient,
        clientName:        payload.clientName ?? 'Client',
        professionalName:  payload.professionalName ?? 'Professionnel',
        date:              payload.date ?? '',
      })
      break

    case 'client_sms': {
      // Récupérer le pro_id pour vérifier le plan
      const { data: qRow } = await supabase
        .from('notification_queue')
        .select('booking_id')
        .eq('id', notif.id)
        .single()

      if (!qRow?.booking_id) throw new Error('booking_id manquant')

      const { data: booking } = await supabase
        .from('bookings')
        .select('pro_id')
        .eq('id', qRow.booking_id)
        .single()

      if (!booking?.pro_id) throw new Error('pro_id manquant sur le booking')

      const plan = await getUserPlan(booking.pro_id)
      if (plan !== 'premium' && plan !== 'infinity') {
        // Plan free : marquer comme 'skipped' (pas une erreur)
        await supabase
          .from('notification_queue')
          .update({ status: 'skipped' })
          .eq('id', notif.id)
        return
      }

      const credited = await consumeCredit(booking.pro_id)
      if (!credited) throw new Error('Crédits SMS insuffisants')

      await sendBookingSMS({
        to:               recipient,
        professionalName: payload.professionalName ?? 'Professionnel',
        date:             payload.date ?? '',
      })
      break
    }

    default:
      throw new Error(`Type de notification inconnu: ${type}`)
  }
}
