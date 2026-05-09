import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit, stripeRateLimits } from '@/lib/rate-limit'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/stripe/refund — Initier un remboursement
// ═══════════════════════════════════════════════════════════════════════════════
// Supporte:
// - Client qui demande remboursement de son RDV (avec vérification éligibilité)
// - Pro qui rembourse un client
//
// Body: { bookingId: string, reason?: string, amount?: number }
// - Si amount non spécifié → remboursement total
// - Si amount spécifié → remboursement partiel (pro uniquement)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Rate limiting: max 5 req/minute/user
    const rateLimit = checkRateLimit(`refund:${userId}`, stripeRateLimits.refund)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans une minute.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      )
    }

    const body = await request.json()
    const { bookingId, reason = '', amount } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requis' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. Récupérer le booking et vérifier les droits
    // ═══════════════════════════════════════════════════════════════════════════
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, pro_id, client_id, client_name, client_email, stripe_payment_intent_id, amount_paid, status, scheduled_at, refunded_at, refund_amount, notes')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VÉRIFICATION CRITIQUE: L'utilisateur est-il autorisé à demander ce remboursement?
    // ═══════════════════════════════════════════════════════════════════════════
    const isPro = booking.pro_id === userId

    // Pour le client, on vérifie qu'il est bien le client qui a fait la réservation
    // Le client_id peut être un clerk userId (commence par 'user_') ou un email
    let isClient = false
    if (booking.client_id) {
      isClient = booking.client_id === userId

      // Si pas match direct, vérifier si c'est un email match
      if (!isClient && booking.client_id.includes('@')) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server')
          const client = await clerkClient()
          const clerkUser = await client.users.getUser(userId)
          const userEmail = clerkUser.emailAddresses[0]?.emailAddress
          isClient = userEmail === booking.client_id
        } catch {
          // Si erreur Clerk, on reste sur isClient = false
        }
      }
    }

    if (!isPro && !isClient) {
      return NextResponse.json(
        { error: 'Non autorisé - Vous ne pouvez pas rembourser une réservation qui ne vous appartient pas' },
        { status: 403 }
      )
    }
    
    // Vérifier si le booking a été payé en ligne
    if (!booking.stripe_payment_intent_id || booking.amount_paid <= 0) {
      return NextResponse.json({ error: 'Cette réservation n\'a pas de paiement en ligne à rembourser' }, { status: 400 })
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. Règles métier — Éligibilité au remboursement
    // ═══════════════════════════════════════════════════════════════════════════
    const now = new Date()
    const appointmentDate = booking.scheduled_at ? new Date(booking.scheduled_at) : null
    const hoursBeforeAppointment = appointmentDate
      ? Math.floor((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      : 0

    // Vérifier si déjà totalement remboursé
    if (booking.refunded_at && booking.refund_amount >= booking.amount_paid) {
      return NextResponse.json({ error: 'Cette réservation est déjà entièrement remboursée' }, { status: 400 })
    }

    // Client: doit annuler avant X heures (ex: 24h)
    if (!isPro && hoursBeforeAppointment < 24) {
      return NextResponse.json(
        { error: 'Les remboursements ne sont possibles que pour les annulations faites au moins 24h avant le rendez-vous' },
        { status: 400 }
      )
    }

    // Si remboursement partiel demandé, vérifier que c'est un pro
    const requestedAmount = amount ? Math.round(amount * 100) : booking.amount_paid // en centimes
    if (requestedAmount !== booking.amount_paid && !isPro) {
      return NextResponse.json(
        { error: 'Seul le professionnel peut effectuer des remboursements partiels' },
        { status: 403 }
      )
    }

    // Vérifier qu'on ne rembourse pas plus que le montant payé
    const alreadyRefunded = booking.refund_amount || 0
    const remainingAmount = booking.amount_paid - alreadyRefunded
    if (requestedAmount > remainingAmount) {
      return NextResponse.json(
        { error: `Montant demandé (${requestedAmount / 100}€) supérieur au montant remboursable (${remainingAmount / 100}€)` },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. Récupérer le PaymentIntent Stripe et vérifier s'il a un Connect transfer
    // ═══════════════════════════════════════════════════════════════════════════
    const piId = booking.stripe_payment_intent_id
    let pi: Stripe.PaymentIntent | null = null
    try {
      pi = await stripe.paymentIntents.retrieve(piId, { expand: ['charges.data', 'transfer'] })
    } catch (stripeErr) {
      return NextResponse.json(
        { error: 'Impossible de retrouver le paiement Stripe' },
        { status: 500 }
      )
    }

    if (!pi || pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Paiement non trouvé ou non complété' }, { status: 400 })
    }

    const hasTransfer = !!(pi as unknown as { transfer?: string }).transfer

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. Créer la demande de remboursement en DB
    // ═══════════════════════════════════════════════════════════════════════════
    const { data: refundRequest, error: refundReqError } = await supabase
      .from('refund_requests')
      .insert({
        booking_id: bookingId,
        requested_by: isPro ? 'pro' : 'client',
        user_id: userId,
        reason: reason,
        amount_requested: requestedAmount,
        status: 'pending',
      })
      .select()
      .single()

    if (refundReqError) {
      logger.error('Erreur création refund_request:', refundReqError)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la demande' }, { status: 500 })
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. Exécuter le remboursement Stripe
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      const chargeId = (pi as unknown as { charges?: { data: Array<{ id?: string }> } })?.charges?.data[0]?.id
      if (!chargeId) {
        throw new Error('Charge ID non trouvé')
      }

      // Options de remboursement Stripe
      const refundOptions: Stripe.RefundCreateParams = {
        charge: chargeId,
        amount: requestedAmount,
        reason: 'requested_by_customer',
        metadata: {
          booking_id: bookingId,
          requested_by: isPro ? 'pro' : 'client',
          user_id: userId,
          refund_request_id: refundRequest.id,
        },
      }

      // Si c'est un paiement Connect, reverse le transfer
      if (hasTransfer) {
        refundOptions.reverse_transfer = true
        refundOptions.refund_application_fee = true
      }

      const refund = await stripe.refunds.create(refundOptions)

      // ═══════════════════════════════════════════════════════════════════════════
      // 6. Mettre à jour les enregistrements en DB
      // ═══════════════════════════════════════════════════════════════════════════
      const isFullRefund = requestedAmount >= booking.amount_paid

      // Mettre à jour le booking
      await supabase
        .from('bookings')
        .update({
          status: isFullRefund ? 'cancelled' : booking.status,
          payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
          refund_amount: alreadyRefunded + requestedAmount,
          refunded_at: new Date().toISOString(),
 notes: `${booking.notes || ''}\n\n Remboursement ${isFullRefund ? 'total' : 'partiel'} de ${(requestedAmount / 100).toFixed(2)}€ effectué le ${new Date().toLocaleDateString('fr-FR')} par ${isPro ? 'le professionnel' : 'le client'}${reason ? ` (motif: ${reason})` : ''}`.trim(),
        })
        .eq('id', bookingId)

      // Mettre à jour la demande de remboursement
      await supabase
        .from('refund_requests')
        .update({
          status: 'processed',
          amount_refunded: requestedAmount,
          stripe_refund_id: refund.id,
          processed_at: new Date().toISOString(),
          processed_by: isPro ? userId : null,
        })
        .eq('id', refundRequest.id)

      // Mettre à jour la transaction client
      await supabase
        .from('client_transactions')
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded',
          refunded_amount: alreadyRefunded + requestedAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', piId)

 logger.info(` Remboursement ${refund.id} créé pour booking ${bookingId}`)

      return NextResponse.json({
        success: true,
        refundId: refund.id,
        amountRefunded: requestedAmount,
        currency: refund.currency,
        status: refund.status,
        isFullRefund,
      })

    } catch (stripeErr: unknown) {
      // Échec du remboursement Stripe → mettre à jour le statut en DB
      await supabase
        .from('refund_requests')
        .update({
          status: 'failed',
          admin_notes: stripeErr instanceof Error ? stripeErr.message : 'Erreur Stripe inconnue',
        })
        .eq('id', refundRequest.id)

      logger.error('Erreur remboursement Stripe:', stripeErr)

      return NextResponse.json(
        { error: 'Le remboursement a échoué. Veuillez réessayer ou contacter le support.' },
        { status: 500 }
      )
    }

  } catch (err: unknown) {
    logger.error('Erreur API refund:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
