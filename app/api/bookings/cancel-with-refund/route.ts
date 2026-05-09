import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { sendRefundNotificationToClient } from '@/lib/emails'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/cancel-with-refund
 * 
 * Annule un RDV et déclenche automatiquement un remboursement Stripe si:
 * - Le pro annule le RDV
 * - Le RDV a été payé en ligne (stripe_payment_intent_id existe)
 * - Le montant payé est > 0
 */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { booking_id, reason, cancelled_by } = body

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Récupérer le booking avec toutes les infos de paiement
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      stripe_payment_intent_id,
      stripe_checkout_session_id,
      amount_paid,
      payment_status,
      payment_method,
      client_email,
      client_name,
      pro_id,
      service_name,
      scheduled_at
    `)
    .eq('id', booking_id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Rendez-vous non trouvé' }, { status: 404 })
  }

  // Vérifier les permissions
  const isPro = booking.pro_id === userId
  let isClient = booking.client_id === userId

  // Si pas encore trouvé, vérifier par email Clerk (client anonyme)
  if (!isClient && !isPro) {
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      const userEmail = user.emailAddresses[0]?.emailAddress
      if (userEmail && booking.client_id === userEmail) {
        isClient = true
      }
    } catch {}
  }

  if (!isPro && !isClient) {
    return NextResponse.json({ error: 'Non autorisé à annuler ce rendez-vous' }, { status: 403 })
  }

  // Si client, vérifier le délai de 24h
  if (isClient) {
    const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      return NextResponse.json({
        error: 'Annulation impossible à moins de 24h du rendez-vous',
        hours_remaining: hoursUntil,
      }, { status: 403 })
    }
  }

  // Si déjà annulé
  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Rendez-vous déjà annulé' }, { status: 400 })
  }

  let stripeRefundResult: { refundId?: string; amount?: number; status?: string } | null = null
  let walletCreditResult: { credited: boolean; amount: number } = { credited: false, amount: 0 }

  // ═══════════════════════════════════════════════════════════════════════════
  // CAS 1: Pro annule un RDV payé en ligne → Remboursement Stripe automatique
  // ═══════════════════════════════════════════════════════════════════════════
  if (isPro && 
      booking.payment_status === 'paid' && 
      booking.stripe_payment_intent_id && 
      booking.amount_paid > 0) {
    
    try {
      // Récupérer le PaymentIntent Stripe
      const pi = await stripe.paymentIntents.retrieve(
        booking.stripe_payment_intent_id, 
        { expand: ['charges.data', 'transfer'] }
      )

      if (pi.status === 'succeeded') {
        const charges = (pi as unknown as { charges?: { data: Array<{ id: string; refunded: boolean; disputed: boolean }> } }).charges
        const charge = charges?.data?.[0]
        const chargeId = charge?.id
        
        // Vérifier que le paiement est refundable (pas déjà remboursé, pas en litige)
        if (chargeId && charge?.refunded === false && charge?.disputed === false) {
          // Vérifier s'il existe déjà un remboursement pour ce charge
          const existingRefunds = await stripe.refunds.list({ charge: chargeId, limit: 1 })
          if (existingRefunds.data.length > 0) {
 logger.info(` Remboursement déjà existant pour le charge ${chargeId}`)
          } else {
            // Options de remboursement
            const refundOptions: Stripe.RefundCreateParams = {
              charge: chargeId,
              amount: booking.amount_paid,
              reason: 'requested_by_customer',
              metadata: {
                booking_id: booking_id,
                cancelled_by: 'pro',
                reason: reason || 'Annulation par le professionnel',
              },
            }

            // Si c'est un paiement Connect, reverse le transfer
            const hasTransfer = !!(pi as unknown as { transfer?: string }).transfer
            if (hasTransfer) {
              refundOptions.reverse_transfer = true
              refundOptions.refund_application_fee = true
            }

            // Créer le remboursement Stripe
            const refund = await stripe.refunds.create(refundOptions)

            stripeRefundResult = {
              refundId: refund.id,
              amount: booking.amount_paid,
              status: refund.status as string,
            }

 logger.info(` Remboursement Stripe créé: ${refund.id} pour booking ${booking_id}`)
          }

          // Mettre à jour la transaction client si un remboursement a été créé
          if (stripeRefundResult) {
            await supabase
              .from('client_transactions')
              .update({
                status: 'refunded',
                refunded_amount: booking.amount_paid,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_payment_intent_id', booking.stripe_payment_intent_id)
          }
        }
      }
    } catch (stripeErr: unknown) {
 logger.error(' Erreur remboursement Stripe:', stripeErr)
      // On continue avec l'annulation même si le remboursement échoue
      // Le pro sera notifié et pourra gérer le remboursement manuellement
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CAS 2: Client annule ou paiement wallet → Crédit wallet (RPC existante)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isClient || booking.payment_method === 'wallet' || !stripeRefundResult) {
    const { data: cancelResult, error: cancelError } = await supabase.rpc(
      'cancel_booking_with_wallet_credit',
      {
        p_booking_id: booking_id,
        p_cancelled_by: cancelled_by || (isPro ? 'pro' : 'client'),
        p_canceller_id: userId,
        p_reason: reason || null,
      }
    )

    if (cancelError) {
      return NextResponse.json({ error: cancelError.message }, { status: 500 })
    }

    const result = cancelResult as { success: boolean; error?: string; refund_amount?: number; wallet_credited?: boolean }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    walletCreditResult = {
      credited: result.wallet_credited || false,
      amount: result.refund_amount || 0,
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Mettre à jour le booking avec le statut final
  // ═══════════════════════════════════════════════════════════════════════════
  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    cancellation_reason: reason || (isPro ? 'Annulation par le professionnel' : 'Annulation par le client'),
    cancelled_at: new Date().toISOString(),
    cancelled_by: isPro ? 'pro' : 'client',
  }

  if (stripeRefundResult) {
    updateData.payment_status = 'refunded'
    updateData.refund_amount = stripeRefundResult.amount
    updateData.refunded_at = new Date().toISOString()
    updateData.stripe_refund_id = stripeRefundResult.refundId
  } else if (walletCreditResult.credited) {
    updateData.payment_status = 'refunded'
    updateData.refund_amount = walletCreditResult.amount
    updateData.refunded_at = new Date().toISOString()
  }

  await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', booking_id)

  // ═══════════════════════════════════════════════════════════════════════════
  // Envoyer l'email de notification au client
  // ═══════════════════════════════════════════════════════════════════════════
  if (booking.client_email) {
    try {
      if (stripeRefundResult && stripeRefundResult.amount) {
        // Email de remboursement Stripe
        await sendRefundNotificationToClient({
          clientEmail: booking.client_email,
          clientName: booking.client_name || 'Client',
          professionalName: booking.pro_name || 'Professionnel',
          serviceName: booking.service_name,
          amount: stripeRefundResult.amount,
          date: booking.scheduled_at,
          isPartial: false,
        })
      } else if (walletCreditResult.credited && walletCreditResult.amount > 0) {
        // Email de crédit wallet (conservé de l'ancienne implémentation)
        // Note: l'email est déjà envoyé par la RPC ou le code précédent
      }
    } catch (emailErr) {
 logger.error(' Erreur envoi email:', emailErr)
      // Ne pas bloquer l'annulation si l'email échoue
    }
  }

  return NextResponse.json({
    success: true,
    booking_id,
    status: 'cancelled',
    stripe_refund: stripeRefundResult,
    wallet_credited: walletCreditResult.credited,
    refund_amount: stripeRefundResult?.amount || walletCreditResult.amount,
    message: stripeRefundResult 
      ? `Rendez-vous annulé et remboursement Stripe de ${(stripeRefundResult.amount! / 100).toFixed(2)}€ initié`
      : walletCreditResult.credited
        ? 'Rendez-vous annulé et crédit porte-monnaie effectué'
        : 'Rendez-vous annulé',
  })
}
