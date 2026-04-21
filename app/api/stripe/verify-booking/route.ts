import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'
import { createBookingAndNotify } from '@/lib/booking-pipeline'
import { sendPaymentConfirmationWithReceipt } from '@/lib/emails'
import Stripe from 'stripe'

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

    // Créer le rendez-vous et envoyer les notifications
    const baseNotes = (session.metadata?.notes || '').trim()
    const paymentLine = session.metadata?.paymentLabel
      ? `Paiement en ligne : ${session.metadata.paymentLabel}`
      : ''
    const mergedNotes = [baseNotes, paymentLine].filter(Boolean).join('\n\n')

    const result = await createBookingAndNotify({
      username,
      clientName,
      clientEmail,
      clientPhone: session.metadata?.clientPhone || '',
      date,
      notes: mergedNotes,
      payment_completed: true, // Paiement déjà vérifié par Stripe
    })

    console.log(`✅ Rendez-vous créé via verify-booking pour ${username}`)

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
        console.log(`✅ Email de confirmation envoyé à ${clientEmail}`)
      } catch (emailErr) {
        console.error('❌ Erreur envoi email confirmation:', emailErr)
        if (emailErr instanceof Error) {
          console.error('Détails:', emailErr.message, emailErr.stack)
        }
        // On ne bloque pas pour l'email
      }
    }

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
    })
  } catch (err) {
    console.error('verify-booking error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
