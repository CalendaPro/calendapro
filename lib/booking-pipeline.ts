import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendBookingConfirmation, sendBookingNotification, sendBookingSMS } from '@/lib/emails'
import { consumeCredit } from '@/lib/sms-credits'
import { getUserPlan } from '@/lib/subscription'
import { normalizeBookingPaymentSettings } from '@/lib/booking-payment-settings'
import { normalizePhoneE164 } from '@/lib/phone-validation'

export type BookingPayload = {
  username: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  serviceName?: string
  date: string
  duration?: number
  notes?: string
  payment_completed?: boolean
  source_channel?: string
}

export type NotificationStatus = {
  proEmail: boolean
  clientEmail: boolean
  sms: boolean
}

export type BookingResult =
  | { ok: true; bookingId: string; notificationStatus: NotificationStatus }
  | { ok: false; error: 'payment_required' | 'slot_unavailable' | 'pro_not_found' | 'client_error' | 'db_error'; message: string }

export async function createBookingAndNotify(input: BookingPayload): Promise<{ appointment: Record<string, unknown>; userId: string; profile: Record<string, unknown>; notificationResults: NotificationStatus }> {
  const supabase = createServerSupabaseClient()
  const { username, clientName, clientEmail, clientPhone, serviceName, date, duration, notes, payment_completed, source_channel } = input

  // Sanitizer le username (minuscules, alphanumérique + _ -)
  const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '')
  console.log(`[booking-pipeline] 🔍 Recherche du pro: ${sanitizedUsername}`)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email_contact, online_payment_enabled, deposit_required, deposit_type, deposit_value, allow_full_online_payment')
    .eq('username', sanitizedUsername)
    .maybeSingle()

  if (profileError) {
    console.error(`[booking-pipeline] ❌ Erreur Supabase pour ${username}:`, profileError)
    throw new Error(`Erreur base de données: ${profileError.message}`)
  }

  if (!profile) {
    console.error(`[booking-pipeline] ❌ Profil introuvable: ${username}`)
    throw new Error(`Professionnel introuvable: ${username}`)
  }

  console.log(`[booking-pipeline] ✅ Profil trouvé: ${profile.full_name} (${profile.id})`)

  // Vérifier si paiement obligatoire (toujours vérifié, sans possibilité de bypass)
  const settings = normalizeBookingPaymentSettings(profile)
  const paymentRequired = settings.online_payment_enabled && settings.deposit_required
  
  if (paymentRequired && !payment_completed) {
    throw new Error('Paiement requis. Ce professionnel exige un acompte pour les réservations.')
  }

  const userId = profile.id

  // Récupérer l'email du pro depuis Clerk ET depuis le profil
  let professionalEmail: string | undefined
  let clerkError: Error | null = null
  
  try {
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    })
    if (clerkResponse.ok) {
      const clerkUser = await clerkResponse.json()
      professionalEmail = clerkUser.email_addresses?.[0]?.email_address as string | undefined
    } else {
      clerkError = new Error(`Clerk API error: ${clerkResponse.status}`)
    }
  } catch (err) {
    clerkError = err instanceof Error ? err : new Error('Erreur Clerk inconnue')
  }
  
  // Fallback sur l'email de contact du profil si Clerk échoue
  if (!professionalEmail && profile.email_contact) {
    professionalEmail = profile.email_contact
    console.log(`📧 Using profile email_contact for ${username}`)
  }
  
  if (!professionalEmail) {
    console.error(`❌ No email found for pro ${username}`, clerkError?.message)
  }

  // Générer un ID client temporaire (clerk-style) basé sur l'email ou un random
  // Note: dans le flux marketplace, le client n'est pas connecté donc on n'a pas son vrai user_id Clerk
  // On utilise l'email comme identifiant unique temporaire
  const clientId = clientEmail || `temp_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.local`

  // Résoudre l'identifiant client avec typage explicite
  let resolvedClientId = clientId
  let resolvedClientIdType: 'clerk_uid' | 'email' | 'temp' = 'temp'

  if (clientEmail && !clientEmail.startsWith('temp_')) {
    resolvedClientId = clientEmail
    resolvedClientIdType = 'email'

    // Tentative de résolution vers Clerk userId (best-effort, non-bloquant)
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const clerk = await clerkClient()
      const users = await clerk.users.getUserList({
        emailAddress: [clientEmail],
        limit: 1,
      })
      if (users.data.length > 0) {
        resolvedClientId = users.data[0].id
        resolvedClientIdType = 'clerk_uid'
        console.log(`[Pipeline] Resolved ${clientEmail} → ${resolvedClientId}`)
      }
      // Si Clerk ne connaît pas l'email : email reste comme identifiant (OK)
      // Ce n'est PAS une erreur — le client peut réserver sans compte
    } catch (err) {
      // Clerk API indisponible : on continue avec l'email (graceful degradation)
      // Le booking sera créé, la résolution se fera lors de la prochaine
      // connexion du client via /api/bookings GET (multi-filtre existant)
      console.warn('[Pipeline] Clerk resolution failed (non-blocking):', err)
    }
  } else if (clientEmail?.startsWith('temp_') || !clientEmail) {
    resolvedClientId = clientId || `temp_${Date.now()}`
    resolvedClientIdType = 'temp'
  }

  // Log pour debugging
  console.log(`[Pipeline] Client ID resolved: type=${resolvedClientIdType}, id=${resolvedClientId.substring(0, 20)}...`)

  // Vérifier ou créer le client_profile si on a un email
  if (clientEmail) {
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('user_id')
      .eq('user_id', clientEmail) // On utilise l'email comme user_id temporaire
      .maybeSingle()
    
    if (!existingProfile) {
      // Créer un profil client minimal
      const { error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: clientEmail, // Temporaire - sera remplacé quand le client s'inscrira
          name: clientName,
          phone: clientPhone || null,
        })
      
      if (profileError) {
        console.log(`[booking-pipeline] ⚠️ Impossible de créer client_profile (non bloquant):`, profileError)
      } else {
        console.log(`[booking-pipeline] ✅ Client_profile créé pour: ${clientEmail}`)
      }
    }
  }

  const bookingStatus = 'upcoming'

  // L'insert via create_booking_safe est ATOMIQUE :
  // la vérification de conflit et l'insert sont une seule opération DB.
  // La contrainte d'exclusion PostgreSQL garantit l'absence de race condition.
  // checkBookingConflict() n'est plus nécessaire ici.

  const { data: appointment, error: appointmentError } = await supabase
    .rpc('create_booking_safe', {
      p_pro_id:         userId,
      p_client_id:      resolvedClientId,
      p_client_id_type: resolvedClientIdType,
      p_service_name:   serviceName || `RDV avec ${clientName}`,
      p_scheduled_at:   date,
      p_duration_mins:  duration || 60,
      p_price:          null,
      p_deposit_amount: null,
      p_notes:          notes || null,
      p_source_channel: source_channel || 'direct',
      p_pro_name:       clientName || null,
      p_pro_username:   sanitizedUsername,
      p_payment_status: payment_completed ? 'paid' : 'pending',
      p_stripe_session: null,
    })

  if (appointmentError) {
    if (
      appointmentError.message?.includes('SLOT_CONFLICT') ||
      (appointmentError as { code?: string }).code === 'P0001'
    ) {
      throw new Error('Ce créneau est déjà réservé. Veuillez choisir un autre horaire.')
    }
    throw new Error(`Erreur création booking: ${appointmentError.message}`)
  }

  if (!appointment) {
    throw new Error('Booking créé mais données non retournées — vérifier la DB.')
  }

  // Increment marketplace referral counter if booking originated from public marketplace
  if (source_channel && source_channel.includes('marketplace')) {
    await supabase.rpc('increment_marketplace_referral', { pro_id: userId }).then(null, () => {})
  }

  const notificationResults = { proEmail: false, clientEmail: false, sms: false }

  // Enqueue les notifications en base (non-bloquant). Un cron les traitera.
  // On tente aussi l'envoi immédiat — si ça échoue, la queue réessaiera.
  const bookingId = (appointment as Record<string, unknown>).id as string

  const notifRows: Array<{
    booking_id: string
    type: string
    recipient: string
    payload: Record<string, unknown>
  }> = []

  if (professionalEmail) {
    notifRows.push({
      booking_id: bookingId,
      type: 'pro_email',
      recipient: professionalEmail,
      payload: {
        professionalName: profile.full_name ?? 'Professionnel',
        clientName,
        clientEmail: clientEmail || '',
        date,
        notes,
      },
    })
  } else {
    console.error(`⚠️ Pas d'email pro pour ${username} - notification ignorée`)
  }

  if (clientEmail) {
    notifRows.push({
      booking_id: bookingId,
      type: 'client_email',
      recipient: clientEmail,
      payload: {
        clientName,
        professionalName: profile.full_name ?? 'Professionnel',
        date,
      },
    })
  }

  const normalizedPhone = normalizePhoneE164(clientPhone)
  if (normalizedPhone) {
    notifRows.push({
      booking_id: bookingId,
      type: 'client_sms',
      recipient: normalizedPhone,
      payload: {
        professionalName: profile.full_name ?? 'Professionnel',
        date,
      },
    })
  } else if (clientPhone) {
    console.warn('[Pipeline] Invalid phone format, SMS skipped:', clientPhone)
  }

  if (notifRows.length > 0) {
    // INSERT en queue SYNCHRONE et BLOQUANT.
    // Si la queue échoue, on log mais on ne bloque pas la réponse client.
    // Le booking est déjà créé — les notifications seront perdues uniquement
    // si la queue est indisponible, ce qui est acceptable vs bloquer la résa.
    const { error: queueError } = await supabase
      .from('notification_queue')
      .insert(notifRows)

    if (queueError) {
      // Log critique — monitorer en production
      console.error('[CRITICAL] notification_queue insert failed:', {
        bookingId,
        error: queueError.message,
        notifCount: notifRows.length,
      })
      // Ne pas throw — le booking est créé, on ne veut pas le rollback
      // Le pro recevra une notification retardée via monitoring manuel
    }
  }

  // Tentative d'envoi immédiat (best-effort, non-bloquant)
  void (async () => {
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
        notificationResults.proEmail = true
        await supabase.from('notification_queue')
          .update({ status: 'sent' })
          .eq('booking_id', bookingId)
          .eq('type', 'pro_email')
      }
    } catch (err) {
      console.error(`❌ Email pro immédiat échoué (sera retenté par la queue):`, err)
    }

    try {
      if (clientEmail) {
        await sendBookingConfirmation({
          clientEmail,
          clientName,
          professionalName: profile.full_name ?? 'Professionnel',
          date,
        })
        notificationResults.clientEmail = true
        await supabase.from('notification_queue')
          .update({ status: 'sent' })
          .eq('booking_id', bookingId)
          .eq('type', 'client_email')
      }
    } catch (err) {
      console.error(`❌ Email client immédiat échoué (sera retenté par la queue):`, err)
    }

    try {
      const plan = await getUserPlan(userId)
      if (normalizedPhone && (plan === 'premium' || plan === 'infinity')) {
        const credited = await consumeCredit(userId)
        if (credited) {
          await sendBookingSMS({
            to: normalizedPhone,
            professionalName: profile.full_name ?? 'Professionnel',
            date,
          })
          notificationResults.sms = true
          await supabase.from('notification_queue')
            .update({ status: 'sent' })
            .eq('booking_id', bookingId)
            .eq('type', 'client_sms')
        } else {
          await supabase.from('notification_queue')
            .update({ status: 'skipped' })
            .eq('booking_id', bookingId)
            .eq('type', 'client_sms')
        }
      }
    } catch (err) {
      console.error('❌ SMS immédiat échoué (sera retenté par la queue):', err)
    }
  })()

  console.log(`📊 Booking créé pour ${username} (status=${bookingStatus}):`, notificationResults)

  return { appointment: appointment as Record<string, unknown>, userId, profile: profile as Record<string, unknown>, notificationResults }
}
