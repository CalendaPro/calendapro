import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'
import { createBookingAndNotify } from '@/lib/booking-pipeline'
import { sendPaymentConfirmationWithReceipt } from '@/lib/emails'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionId, username } = await request.json()

    if (!sessionId || !username) {
      return NextResponse.json(
        { error: 'sessionId et username requis' },
        { status: 400 }
      )
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non confirmé' },
        { status: 400 }
      )
    }

    // Vérifier que c'est bien une session de booking
    if (session.metadata?.type !== 'booking_deposit') {
      return NextResponse.json(
        { error: 'Type de session invalide' },
        { status: 400 }
      )
    }

    const clientName = session.metadata?.clientName
    const clientEmail = session.metadata?.clientEmail || ''
    const date = session.metadata?.date
    const serviceName = session.metadata?.serviceName || ''

    if (!clientName || !date) {
      return NextResponse.json(
        { error: 'Métadonnées de réservation incomplètes' },
        { status: 400 }
      )
    }

    // Idempotency: check if webhook already created a booking at this exact slot
    const proId = session.metadata?.proId
    const supabase = createServerSupabaseClient()
    if (proId && date) {
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('pro_id', proId)
        .eq('scheduled_at', date)
        .in('status', ['upcoming', 'pending', 'confirmed'])
        .maybeSingle()

      if (existingBooking) {
        // Webhook already created this booking — return success
        return NextResponse.json({ success: true, appointment: existingBooking })
      }
    }

    // Créer le rendez-vous et envoyer les notifications
    const baseNotes = (session.metadata?.notes || '').trim()
    const paymentLine = session.metadata?.paymentLabel
      ? `Paiement en ligne : ${session.metadata.paymentLabel}`
      : ''
    const mergedNotes = [baseNotes, paymentLine].filter(Boolean).join('\n\n')

    let result
    try {
      result = await createBookingAndNotify({
        username,
        clientName,
        clientEmail,
        clientPhone: session.metadata?.clientPhone || '',
        date,
        notes: mergedNotes,
        payment_completed: true,
        source_channel: session.metadata?.sourceChannel || undefined,
      })
    } catch (bookingErr) {
      const msg = bookingErr instanceof Error ? bookingErr.message : ''
      // SLOT_CONFLICT = webhook already created the booking via create_booking_safe
      if (msg.includes('SLOT_CONFLICT') || msg.includes('conflit')) {
        return NextResponse.json({ success: true, appointment: null })
      }
      throw bookingErr
    }

 logger.info(` Rendez-vous créé via verify-booking pour ${username}`)

    // Sauvegarder les infos Stripe et créer la transaction client
    const bookingId = (result.appointment as { id?: string })?.id
    if (bookingId) {
      const piId = session.payment_intent as string
      const pi = piId
        ? await stripe.paymentIntents.retrieve(piId, { expand: ['charges.data'] })
        : null
      const receiptUrl = (pi as unknown as { charges?: { data: Array<{ receipt_url?: string }> } })?.charges?.data[0]?.receipt_url

      // Mettre à jour le booking avec les infos Stripe
      await supabase
        .from('bookings')
        .update({
          stripe_payment_intent_id: piId,
          stripe_checkout_session_id: session.id,
          stripe_receipt_url: receiptUrl,
          amount_paid: session.amount_total,
          payment_method: 'online',
          payment_status: 'paid',
        })
        .eq('id', bookingId)

      // Créer la transaction client
      // Utilise le client_id résolu par le pipeline (Clerk userId si trouvé, sinon email)
      const resolvedClientId = (result.appointment as { client_id?: string })?.client_id || clientEmail
      if (resolvedClientId && session.amount_total) {
        await supabase.from('client_transactions').insert({
          user_id: resolvedClientId,
          booking_id: bookingId,
          pro_id: proId || '',
          stripe_payment_intent_id: piId,
          stripe_checkout_session_id: session.id,
          amount: session.amount_total,
          currency: 'eur',
          status: 'succeeded',
          description: `Réservation avec ${username}`,
          receipt_url: receiptUrl,
        })
      }
    }

    // Invalider le cache pour forcer le rechargement des données
    revalidatePath('/dashboard', 'page')
    revalidatePath('/dashboard/appointments', 'page')
    revalidatePath('/dashboard/intelligence', 'page')
    revalidatePath(`/${username}`, 'page')

    // Envoyer l'email de confirmation de paiement avec reçu
    if (clientEmail && session.amount_total) {
      try {
        await sendPaymentConfirmationWithReceipt({
          clientEmail,
          clientName,
          professionalName: String((result.profile as Record<string, unknown>)?.full_name || 'Professionnel'),
          amount: session.amount_total,
          date,
          transactionId: session.id,
          service: serviceName,
        })
 logger.info(` Email de confirmation envoyé à ${clientEmail}`)
      } catch (emailErr) {
 logger.error(' Erreur envoi email confirmation:', emailErr)
        // On ne bloque pas pour l'email
      }
    }

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
    })
  } catch (err) {
    logger.error('verify-booking error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
