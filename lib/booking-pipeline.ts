import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendBookingConfirmation, sendBookingNotification, sendBookingSMS } from '@/lib/emails'
import { consumeCredit } from '@/lib/sms-credits'
import { getUserPlan } from '@/lib/subscription'

export type BookingPayload = {
  username: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  date: string
  notes?: string
}

export async function createBookingAndNotify(input: BookingPayload) {
  const supabase = createServerSupabaseClient()
  const { username, clientName, clientEmail, clientPhone, date, notes } = input

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    throw new Error('Professionnel introuvable')
  }

  const userId = profile.id

  const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
  })
  if (!clerkResponse.ok) {
    throw new Error('Erreur récupération professionnel')
  }
  const clerkUser = await clerkResponse.json()
  const professionalEmail = clerkUser.email_addresses?.[0]?.email_address as string | undefined

  let clientId: string | null = null
  if (clientEmail) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('email', clientEmail)
      .single()

    if (existingClient?.id) {
      clientId = existingClient.id
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone || null,
        })
        .select()
        .single()
      if (clientError) {
        throw new Error('Erreur création client')
      }
      clientId = newClient?.id ?? null
    }
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      client_id: clientId,
      title: `RDV avec ${clientName}`,
      date,
      notes,
      status: 'pending',
    })
    .select()
    .single()

  if (appointmentError) {
    throw new Error(appointmentError.message)
  }

  try {
    if (professionalEmail) {
      await sendBookingNotification({
        professionalEmail,
        professionalName: profile.full_name ?? 'Professionnel',
        clientName,
        clientEmail: clientEmail || 'Non renseigné',
        date,
        notes,
      })
    }
    if (clientEmail) {
      await sendBookingConfirmation({
        clientEmail,
        clientName,
        professionalName: profile.full_name ?? 'Professionnel',
        date,
      })
    }
    const plan = await getUserPlan(userId)
    if (clientPhone && (plan === 'premium' || plan === 'infinity')) {
      const credited = await consumeCredit(userId)
      if (credited) {
        await sendBookingSMS({
          to: clientPhone,
          professionalName: profile.full_name ?? 'Professionnel',
          date,
        })
      }
    }
  } catch (error) {
    console.error('Erreur notification booking:', error)
  }

  return { appointment, userId, profile }
}
