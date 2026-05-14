import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendReminderEmail, sendReminderSMS } from '@/lib/emails'
import { clerkClient } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called by Vercel cron every hour: 0 * * * *
// Handles both T-24h and T-2h reminder windows in a single pass.
export async function GET(request: Request) {
  // Validate cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  const clerk = await clerkClient()

  // ── T-24h window ──────────────────────────────────────────
  const window24Start = new Date(now.getTime() + 23 * 3600 * 1000)
  const window24End   = new Date(now.getTime() + 25 * 3600 * 1000)

  const { data: bookings24h, error: err24 } = await supabase
    .from('bookings')
    .select('id, client_id, client_email, client_name, pro_username, pro_name, service_name, scheduled_at, price')
    .eq('status', 'upcoming')
    .eq('reminder_sent_24h', false)
    .gte('scheduled_at', window24Start.toISOString())
    .lt('scheduled_at', window24End.toISOString())

  if (err24) {
    logger.error('reminders/check: 24h query error', err24)
    return NextResponse.json({ error: err24.message }, { status: 500 })
  }

  // ── T-2h window ───────────────────────────────────────────
  const window2Start = new Date(now.getTime() + 1 * 3600 * 1000)  // now + 1h
  const window2End   = new Date(now.getTime() + 3 * 3600 * 1000)  // now + 3h

  const { data: bookings2h, error: err2 } = await supabase
    .from('bookings')
    .select('id, client_id, client_email, client_name, pro_username, pro_name, service_name, scheduled_at, price')
    .eq('status', 'upcoming')
    .eq('reminder_sent_2h', false)
    .gte('scheduled_at', window2Start.toISOString())
    .lt('scheduled_at', window2End.toISOString())

  if (err2) {
    logger.error('reminders/check: 2h query error', err2)
    return NextResponse.json({ error: err2.message }, { status: 500 })
  }

  let processed24 = 0
  let processed2 = 0

  // ── Process T-24h reminders ───────────────────────────────
  for (const booking of (bookings24h ?? [])) {
    try {
      const { data: settings } = await supabase
        .from('reminder_settings')
        .select('email_24h, sms_24h, sms_phone')
        .eq('client_id', booking.client_id)
        .maybeSingle()

      const email24h = settings?.email_24h ?? true
      const sms24h   = settings?.sms_24h ?? false
      const smsPhone = settings?.sms_phone ?? null

      if (email24h) {
        let clientEmail: string | null = null
        let clientName = 'Client'
        // Use stored client_email if available (anonymous bookings)
        if (booking.client_email) {
          clientEmail = booking.client_email
          clientName = booking.client_name || 'Client'
        } else if (booking.client_id?.includes('@')) {
          // client_id is an email for anonymous bookings
          clientEmail = booking.client_id
          clientName = booking.client_name || 'Client'
        } else {
          try {
            const user = await clerk.users.getUser(booking.client_id)
            clientEmail = user.emailAddresses[0]?.emailAddress ?? null
            clientName  = user.fullName ?? user.firstName ?? 'Client'
          } catch {
            logger.warn(`reminders/check: Clerk user not found ${booking.client_id}`)
          }
        }

        if (clientEmail) {
          await sendReminderEmail({
            clientEmail,
            clientName,
            professionalName: booking.pro_name ?? booking.pro_username,
            serviceName: booking.service_name ?? undefined,
            date: booking.scheduled_at,
            proUsername: booking.pro_username,
          })
        } else {
          // No email available — skip marking as sent so we can retry next run
          logger.warn(`reminders/check: No email for booking ${booking.id}, skipping`)
          processed24++
          continue
        }
      }

      if (sms24h && smsPhone) {
        await sendReminderSMS({
          to: smsPhone,
          professionalName: booking.pro_name ?? booking.pro_username,
          date: booking.scheduled_at,
        })
      }

      await supabase
        .from('bookings')
        .update({ reminder_sent_24h: true })
        .eq('id', booking.id)

      processed24++
    } catch (err) {
      logger.error(`reminders/check: 24h error for booking ${booking.id}`, err)
    }
  }

  // ── Process T-2h reminders ────────────────────────────────
  for (const booking of (bookings2h ?? [])) {
    try {
      const { data: settings } = await supabase
        .from('reminder_settings')
        .select('sms_2h, sms_phone')
        .eq('client_id', booking.client_id)
        .maybeSingle()

      const sms2h    = settings?.sms_2h ?? true
      const smsPhone = settings?.sms_phone ?? null

      if (sms2h && smsPhone) {
        await sendReminderSMS({
          to: smsPhone,
          professionalName: booking.pro_name ?? booking.pro_username,
          date: booking.scheduled_at,
        })
      }

      // Also send a short email reminder at T-2h
      let clientEmail: string | null = null
      let clientName = 'Client'
      if (booking.client_email) {
        clientEmail = booking.client_email
        clientName = booking.client_name || 'Client'
      } else if (booking.client_id?.includes('@')) {
        clientEmail = booking.client_id
        clientName = booking.client_name || 'Client'
      } else {
        try {
          const user = await clerk.users.getUser(booking.client_id)
          clientEmail = user.emailAddresses[0]?.emailAddress ?? null
          clientName  = user.fullName ?? user.firstName ?? 'Client'
        } catch {}
      }

      if (clientEmail) {
        await sendReminderEmail({
          clientEmail,
          clientName,
          professionalName: booking.pro_name ?? booking.pro_username,
          serviceName: booking.service_name ?? undefined,
          date: booking.scheduled_at,
          proUsername: booking.pro_username,
        })
      }

      await supabase
        .from('bookings')
        .update({ reminder_sent_2h: true })
        .eq('id', booking.id)

      processed2++
    } catch (err) {
      logger.error(`reminders/check: 2h error for booking ${booking.id}`, err)
    }
  }

 logger.info(` reminders/check: 24h=${processed24}, 2h=${processed2}`)
  return NextResponse.json({
    processed_24h: processed24,
    total_24h: (bookings24h ?? []).length,
    processed_2h: processed2,
    total_2h: (bookings2h ?? []).length,
  })
}
