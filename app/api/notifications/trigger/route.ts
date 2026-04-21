import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendReminderEmail, sendReviewRequestEmail, sendBookingConfirmation, sendReminderSMS } from '@/lib/emails'
import { clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type TriggerType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'reminder_24h'
  | 'review_request'
  | 'pro_update'
  | 'favorite_pro_available'

interface TriggerBody {
  _secret: string
  type: TriggerType
  user_id: string
  data: Record<string, unknown>
}

async function getClerkUser(userId: string) {
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    return {
      email: user.emailAddresses[0]?.emailAddress ?? null,
      name: user.fullName ?? user.firstName ?? 'Client',
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as TriggerBody

  if (body._secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { type, user_id, data } = body
  if (!type || !user_id) {
    return NextResponse.json({ error: 'type et user_id requis' }, { status: 400 })
  }

  const results: string[] = []

  // ── 1. Insert in-app notification ────────────────────────
  const notifMap: Record<TriggerType, { title: string; message: string }> = {
    booking_confirmed:       { title: '✅ Réservation confirmée', message: `Votre RDV avec ${data.pro_name ?? 'le pro'} est confirmé.` },
    booking_cancelled:       { title: '❌ Réservation annulée',  message: `Votre RDV avec ${data.pro_name ?? 'le pro'} a été annulé.` },
    reminder_24h:            { title: '⏰ Rappel RDV demain',     message: `N'oubliez pas votre RDV avec ${data.pro_name ?? 'le pro'}.` },
    review_request:          { title: '⭐ Donnez votre avis',     message: `Comment s'est passé votre RDV avec ${data.pro_name ?? 'le pro'} ?` },
    pro_update:              { title: '🔔 Mise à jour pro',       message: `${data.pro_name ?? 'Un pro'} a mis à jour ses disponibilités.` },
    favorite_pro_available:  { title: '💜 Nouveau créneau dispo', message: `${data.pro_name ?? 'Un de vos favoris'} a de nouvelles disponibilités !` },
  }

  const notif = notifMap[type]
  if (notif) {
    await supabase.from('notifications').insert({
      user_id,
      type,
      title: notif.title,
      message: notif.message,
      action_url: (data.action_url as string) ?? null,
    })
    results.push('in-app')
  }

  // ── 2. Email ──────────────────────────────────────────────
  const userInfo = await getClerkUser(user_id)
  if (userInfo?.email) {
    try {
      if (type === 'booking_confirmed') {
        await sendBookingConfirmation({
          clientEmail: userInfo.email,
          clientName: userInfo.name,
          professionalName: (data.pro_name as string) ?? '',
          date: (data.scheduled_at as string) ?? '',
        })
        results.push('email:booking_confirmed')
      } else if (type === 'reminder_24h') {
        await sendReminderEmail({
          clientEmail: userInfo.email,
          clientName: userInfo.name,
          professionalName: (data.pro_name as string) ?? '',
          serviceName: (data.service_name as string) ?? undefined,
          date: (data.scheduled_at as string) ?? '',
          proUsername: (data.pro_username as string) ?? '',
        })
        results.push('email:reminder_24h')
      } else if (type === 'review_request') {
        await sendReviewRequestEmail({
          clientEmail: userInfo.email,
          clientName: userInfo.name,
          professionalName: (data.pro_name as string) ?? '',
          serviceName: (data.service_name as string) ?? undefined,
          bookingId: (data.booking_id as string) ?? '',
          proId: (data.pro_id as string) ?? '',
        })
        results.push('email:review_request')
      }
    } catch (err) {
      console.error(`trigger: email error for ${type}`, err)
    }
  }

  // ── 3. SMS (if booking_confirmed or reminder_24h) ─────────
  if (type === 'booking_confirmed' || type === 'reminder_24h') {
    const { data: reminderSettings } = await supabase
      .from('reminder_settings')
      .select('sms_24h, sms_phone')
      .eq('client_id', user_id)
      .maybeSingle()

    if (reminderSettings?.sms_24h && reminderSettings.sms_phone) {
      try {
        await sendReminderSMS({
          to: reminderSettings.sms_phone,
          professionalName: (data.pro_name as string) ?? '',
          date: (data.scheduled_at as string) ?? '',
        })
        results.push('sms')
      } catch (err) {
        console.error(`trigger: sms error for ${type}`, err)
      }
    }
  }

  return NextResponse.json({ success: true, results })
}
