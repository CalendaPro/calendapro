import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendReminderEmail, sendReminderSMS } from '@/lib/emails'
import { clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called by Vercel cron every hour: 0 * * * *
export async function GET(request: Request) {
  // Validate cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 23 * 3600 * 1000) // now + 23h
  const windowEnd   = new Date(now.getTime() + 25 * 3600 * 1000) // now + 25h

  // Find bookings in the 24h reminder window that haven't been reminded yet
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, client_id, pro_username, pro_name, service_name, scheduled_at, price')
    .eq('status', 'upcoming')
    .eq('reminder_sent_24h', false)
    .gte('scheduled_at', windowStart.toISOString())
    .lt('scheduled_at', windowEnd.toISOString())

  if (error) {
    console.error('reminders/check: query error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0
  const clerk = await clerkClient()

  for (const booking of bookings) {
    try {
      // Get client reminder settings
      const { data: settings } = await supabase
        .from('reminder_settings')
        .select('email_24h, sms_24h, sms_phone')
        .eq('client_id', booking.client_id)
        .maybeSingle()

      const email24h = settings?.email_24h ?? true
      const sms24h   = settings?.sms_24h ?? false
      const smsPhone = settings?.sms_phone ?? null

      if (email24h) {
        // Get client email from Clerk
        let clientEmail: string | null = null
        let clientName = 'Client'
        try {
          const user = await clerk.users.getUser(booking.client_id)
          clientEmail = user.emailAddresses[0]?.emailAddress ?? null
          clientName  = user.fullName ?? user.firstName ?? 'Client'
        } catch {
          console.warn(`reminders/check: Clerk user not found ${booking.client_id}`)
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
      }

      if (sms24h && smsPhone) {
        await sendReminderSMS({
          to: smsPhone,
          professionalName: booking.pro_name ?? booking.pro_username,
          date: booking.scheduled_at,
        })
      }

      // Mark reminder as sent
      await supabase
        .from('bookings')
        .update({ reminder_sent_24h: true })
        .eq('id', booking.id)

      processed++
    } catch (err) {
      console.error(`reminders/check: error for booking ${booking.id}`, err)
    }
  }

  console.log(`✅ reminders/check: ${processed}/${bookings.length} reminders sent`)
  return NextResponse.json({ processed, total: bookings.length })
}
