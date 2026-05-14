import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { addCredits, resetCredits } from '@/lib/sms-credits'
import { createBookingAndNotify } from '@/lib/booking-pipeline'
import { revalidatePath } from 'next/cache'
import {
  sendPaymentConfirmationWithReceipt,
  sendRefundNotificationToClient,
  sendPayoutNotificationToPro,
  sendPaymentFailedNotification,
} from '@/lib/emails'
import { checkBookingConflict } from '@/lib/booking-conflict'
import { logConnectTransaction, computePlatformFee } from '@/lib/stripe-connect'
import { getUserPlan, type Plan } from '@/lib/subscription'
import { enqueueWebhookRetry } from '@/lib/webhook-queue'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

const PLAN_INITIAL_CREDITS = {
  premium: 30,
  infinity: 200,
}

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const raw = subscription as Stripe.Subscription & { current_period_end?: number | null }
  return raw.current_period_end
    ? new Date(raw.current_period_end * 1000).toISOString()
    : null
}

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return 'premium'
  if (priceId === process.env.STRIPE_INFINITY_PRICE_ID) return 'infinity'
  return 'free'
}

// Events critiques qui nécessitent un retry en cas d'échec
const CRITICAL_EVENTS = [
  'checkout.session.completed',
  'invoice.paid',
  'charge.refunded',
  'payout.paid',
  'account.updated',
]

/**
 * Fonction interne de traitement des webhooks
 * Contient toute la logique métier
 */
async function processWebhookEvent(
  event: Stripe.Event,
  rawBody: string,
  signature: string
): Promise<Response> {
  const supabase = createServerSupabaseClient()

  // ═══════════════════════════════════════════════════════════════════════════════
  // IDEMPOTENCY: Vérifier si cet event a déjà été traité
  // ═══════════════════════════════════════════════════════════════════════════════
  const { data: existingEvent } = await supabase
    .from('webhook_events_log')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existingEvent) {
    logger.info(`[Webhook] Event ${event.id} déjà traité — ignoré`)
    return NextResponse.json({ received: true, idempotent: true })
  }

  // Logger l'event pour traçabilité
  await supabase.from('webhook_events_log').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    event_data: event as unknown as Record<string, unknown>,
    processed: false,
  })

  switch (event.type) {

    case 'checkout.session.completed': {
      try {
        let session = event.data.object as Stripe.Checkout.Session
        if (!session.metadata?.type && session.id) {
          session = await stripe.checkout.sessions.retrieve(session.id)
        }

        const userId = session.metadata?.userId
        const type = session.metadata?.type

        if (type === 'booking_deposit') {
          const username = session.metadata?.username
          const clientName = session.metadata?.clientName
          const date = session.metadata?.date
          const clientEmail = session.metadata?.clientEmail || ''
          const proName = session.metadata?.proName || username || 'Professionnel'
          const serviceName = session.metadata?.serviceName
          const proId = session.metadata?.proId
          const durationMinutes = session.metadata?.durationMinutes

          if (!username || !clientName || !date) {
            logger.error('booking_deposit webhook: metadata manquante', session.metadata)
            break
          }

          // Verification de conflit APRES paiement (critique: eviter double booking)
          if (proId && date) {
            const hasConflict = await checkBookingConflict(
              supabase,
              proId,
              date,
              Number(durationMinutes) || 60
            )

            if (hasConflict) {
              // Creneau deja pris - rembourser automatiquement
              logger.error(`[Webhook] Conflit detecte pour ${proId} a ${date}, remboursement auto`)
              try {
                const paymentIntent = session.payment_intent as string | null
                if (paymentIntent) {
                  // Connect-aware refund: reverse the transfer if funds were routed
                  const pi = await stripe.paymentIntents.retrieve(paymentIntent)
                  const hasTransfer = !!(pi as unknown as { transfer?: string }).transfer
                  await stripe.refunds.create({
                    payment_intent: paymentIntent,
                    reason: 'duplicate',
                    ...(hasTransfer ? { reverse_transfer: true, refund_application_fee: true } : {}),
                  })
                  logger.info(`[Webhook] Remboursement auto effectue pour session ${session.id}${hasTransfer ? ' (Connect reverse_transfer)' : ''}`)
                }
              } catch (refundError) {
                logger.error('[Webhook] Echec remboursement automatique:', refundError)
                // Stocker pour traitement manuel
                try {
                  await supabase.from('failed_refunds').insert({
                    stripe_session_id: session.id,
                    payment_intent: session.payment_intent as string | null,
                    reason: 'slot_conflict',
                    metadata: session.metadata || null,
                    created_at: new Date().toISOString(),
                  })
                } catch (e) { logger.error('[Webhook] Failed to log failed_refund:', e) }
              }
              // Ne PAS creer le booking en cas de conflit
              break
            }
          }

          try {
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
              source_channel: session.metadata?.sourceChannel || undefined,
            })
 logger.info(` booking_deposit cree pour ${username}`)

            // Récupérer l'ID du booking créé
            const bookingId = (result.appointment as { id?: string })?.id

            // Sauvegarder les infos Stripe dans le booking
            if (bookingId) {
              const piId = session.payment_intent as string
              const pi = piId
                ? await stripe.paymentIntents.retrieve(piId, { expand: ['charges.data'] })
                : null
              const receiptUrl = (pi as unknown as { charges?: { data: Array<{ receipt_url?: string }> } })?.charges?.data[0]?.receipt_url

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

              // Créer la transaction client pour l'historique
              if (clientEmail && session.amount_total) {
                await supabase.from('client_transactions').insert({
                  user_id: clientEmail, // email comme clé temporaire — sera réconcilié via client_email
                  client_email: clientEmail, // champ dédié pour lookup par email
                  booking_id: bookingId,
                  pro_id: proId || '',
                  stripe_payment_intent_id: piId,
                  stripe_checkout_session_id: session.id,
                  amount: session.amount_total,
                  currency: 'eur',
                  status: 'succeeded',
                  description: `Réservation avec ${proName}`,
                  receipt_url: receiptUrl,
                })
              }
            }

            // Log Connect transaction if applicable
            if (proId && session.amount_total) {
              const piId = session.payment_intent as string | null
              if (piId) {
                try {
                  const pi = await stripe.paymentIntents.retrieve(piId)
                  const hasTransfer = !!(pi as unknown as { transfer?: string }).transfer
                  if (hasTransfer) {
                    // Récupérer le plan du pro pour calculer la commission correcte
                    const proPlan: Plan = await getUserPlan(proId)
                    const fee = computePlatformFee(session.amount_total, proPlan)
                    await logConnectTransaction({
                      proId,
                      stripePaymentId: piId,
                      stripeTransferId: (pi as unknown as { transfer?: string }).transfer || undefined,
                      amount: session.amount_total,
                      platformFee: fee,
                      netAmount: session.amount_total - fee,
                      status: 'succeeded',
                      clientName: clientName,
                      clientEmail: clientEmail,
                      paymentType: session.metadata?.paymentKind || 'deposit',
                      plan: proPlan,
                    })
                    logger.info(`[Webhook] Connect transaction logged: plan=${proPlan}, fee=${fee / 100}€`)
                  }
                } catch (txErr) {
                  logger.error('[Webhook] Erreur log connect_transaction:', txErr)
                }
              }
            }

            // Send payment confirmation email with PDF receipt
            if (clientEmail && session.amount_total) {
              try {
                await sendPaymentConfirmationWithReceipt({
                  clientEmail,
                  clientName,
                  professionalName: proName,
                  amount: session.amount_total,
                  date,
                  transactionId: session.id,
                  service: serviceName,
                })
 logger.info(` Email avec recu envoye a ${clientEmail}`)
              } catch (emailError) {
 logger.error(' Erreur envoi email avec recu:', emailError)
              }
            }
          } catch (error) {
 logger.error(' booking_deposit webhook:', error)
            
            // ═══════════════════════════════════════════════════════════════════════════════
            // Fix #4: Améliorer le retry pour les erreurs de création booking
            // Si l'erreur est retryable, on la laisse remonter pour déclencher le retry automatique
            // ═══════════════════════════════════════════════════════════════════════════════
            const errorMsg = error instanceof Error ? error.message : String(error)
            const isRetryable = 
              errorMsg.includes('timeout') ||
              errorMsg.includes('network') ||
              errorMsg.includes('connection') ||
              errorMsg.includes('temporarily') ||
              errorMsg.includes('rate limit') ||
              errorMsg.includes('503') ||
              errorMsg.includes('502') ||
              errorMsg.includes('504')
            
            if (isRetryable) {
              logger.info(`[Webhook] Erreur retryable détectée: ${errorMsg}`)
              // L'erreur va remonter et déclencher le retry via le mécanisme de queue
              throw error
            }
            
            // Pour les erreurs non-retryable, logger pour investigation manuelle
            try {
              await supabase.from('webhook_failed_bookings').insert({
                stripe_session_id: session.id,
                payment_intent_id: session.payment_intent as string | null,
                error: errorMsg,
                metadata: session.metadata || null,
                created_at: new Date().toISOString(),
                retryable: false
              })
            } catch (logErr) {
              logger.error('[Webhook] Impossible de logger l\'erreur:', logErr)
            }
          }
          
          // Invalider le cache du dashboard pour forcer la synchronisation
          try {
            revalidatePath('/dashboard', 'layout')
            revalidatePath('/dashboard/appointments', 'layout')
            revalidatePath('/dashboard/calendar', 'layout')
            revalidatePath('/dashboard/payments-reservations', 'layout')
 logger.info(' Dashboard cache revalidated after booking creation')
          } catch (revError) {
 logger.error(' Failed to revalidate dashboard cache:', revError)
          }
          
          break
        }

        // Achat de crédits SMS à la carte
        if (type === 'sms_credits') {
          const credits = parseInt(session.metadata?.credits ?? '0', 10)
          if (userId && credits > 0) {
            await addCredits(userId, credits)
 logger.info(` ${credits} crédits SMS ajoutés pour ${userId}`)
          } else {
            logger.error('sms_credits webhook: userId ou credits manquant', { userId, credits, meta: session.metadata })
          }
          break
        }

        // Souscription à un plan
        const subscriptionId = session.subscription as string | null
        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0].price.id
          const plan = getPlanFromPriceId(priceId)
          const periodEnd = getPeriodEnd(subscription)

          const { error } = await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })

          if (error) {
 logger.error(' Supabase upsert error:', error)
          } else {
 logger.info(` Subscription ${plan} saved pour ${userId}`)
          }

 // Reset (pas add) — évite l'accumulation si le webhook est rejoué
          if (plan === 'premium' || plan === 'infinity') {
            const initialCredits = PLAN_INITIAL_CREDITS[plan as 'premium' | 'infinity']
            await resetCredits(userId, initialCredits)
 logger.info(` ${initialCredits} crédits SMS initialisés pour ${userId}`)
          }
        }
      } catch (err) {
 logger.error(' checkout.session.completed:', err)
        return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null
      }
      const subRef = invoice.subscription
      const subscriptionId = typeof subRef === 'string' ? subRef : subRef?.id

 // On ignore la première invoice — déjà gérée par checkout.session.completed
      if (invoice.billing_reason === 'subscription_create') break

      if (subscriptionId) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id, plan')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (sub && (sub.plan === 'premium' || sub.plan === 'infinity')) {
          const monthlyCredits = PLAN_INITIAL_CREDITS[sub.plan as 'premium' | 'infinity']
 // RESET et non ADD — renouvellement remet à zéro, pas cumul
          await resetCredits(sub.user_id, monthlyCredits)
 logger.info(` Renouvellement: ${monthlyCredits} crédits reset pour ${sub.user_id}`)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

 logger.info(` Subscription annulée: ${subscription.id}`)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0].price.id
      const plan = getPlanFromPriceId(priceId)
      const periodEnd = getPeriodEnd(subscription)

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status: subscription.status,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

 logger.info(` Subscription mise à jour: ${plan} — ${subscription.id}`)
      break
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHARGE REFUNDED — Remboursement effectué
    // ═══════════════════════════════════════════════════════════════════════════
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const piId = charge.payment_intent as string

      if (piId) {
        // Récupérer la transaction client pour avoir les détails
        const { data: clientTx } = await supabase
          .from('client_transactions')
          .select('user_id, booking_id, description, amount')
          .eq('stripe_payment_intent_id', piId)
          .maybeSingle()

        // Mettre à jour la transaction client
        await supabase.rpc('update_client_transaction_status', {
          p_stripe_pi_id: piId,
          p_status: charge.refunded ? 'refunded' : 'partially_refunded',
          p_refunded_amount: charge.amount_refunded,
        })

        // Mettre à jour le booking
        const { data: booking } = await supabase
          .from('bookings')
          .update({
            payment_status: charge.refunded ? 'refunded' : 'partially_refunded',
            refund_amount: charge.amount_refunded,
            refunded_at: charge.refunds?.data[0]?.created
              ? new Date(charge.refunds.data[0].created * 1000).toISOString()
              : new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', piId)
          .select('scheduled_at, client_name, client_email, service_name, pro_name')
          .maybeSingle()

        // Envoyer email de notification au client
        if (booking?.client_email && booking.client_name) {
          try {
            await sendRefundNotificationToClient({
              clientEmail: booking.client_email,
              clientName: booking.client_name,
              professionalName: booking.pro_name || 'Professionnel',
              serviceName: booking.service_name || undefined,
              amount: charge.amount_refunded,
              date: booking.scheduled_at,
              isPartial: !charge.refunded,
            })
 logger.info(` Email remboursement envoyé à ${booking.client_email}`)
          } catch (emailErr) {
 logger.error(' Erreur envoi email remboursement:', emailErr)
          }
        }

        logger.info(`[Webhook] Charge refunded: ${piId}, amount: ${charge.amount_refunded}`)
      }
      break
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAYOUT PAID — Virement vers compte bancaire du pro
    // ═══════════════════════════════════════════════════════════════════════════
    case 'payout.paid': {
      const payout = event.data.object as Stripe.Payout
      const connectAccountId = event.account // Connect account ID

      if (connectAccountId) {
        // Récupérer le pro depuis son Connect ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('stripe_connect_id', connectAccountId)
          .maybeSingle()

        if (profile) {
          // Enregistrer la notification
          await supabase.from('payout_notifications').insert({
            pro_id: profile.id,
            stripe_payout_id: payout.id,
            amount: payout.amount,
            currency: payout.currency,
            arrival_date: payout.arrival_date
              ? new Date(payout.arrival_date * 1000).toISOString().split('T')[0]
              : null,
            status: 'paid',
            bank_account_last4: (payout.destination as Stripe.BankAccount)?.last4 || null,
          })

          // Envoyer email "Virement reçu" au pro
          if (profile.email) {
            try {
              await sendPayoutNotificationToPro({
                proEmail: profile.email,
                proName: profile.email.split('@')[0], // Fallback name
                amount: payout.amount,
                periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                periodEnd: new Date().toISOString(),
                bankAccountLast4: (payout.destination as Stripe.BankAccount)?.last4,
              })
 logger.info(` Email virement envoyé à ${profile.email}`)
            } catch (emailErr) {
 logger.error(' Erreur envoi email virement:', emailErr)
            }
          }

          logger.info(`[Webhook] Payout paid: ${payout.id} pour pro ${profile.id}`)
        }
      }
      break
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCOUNT UPDATED — Mise à jour statut compte Connect
    // ═══════════════════════════════════════════════════════════════════════════
    case 'account.updated': {
      const account = event.data.object as Stripe.Account

      // Mettre à jour le statut dans profiles
      await supabase
        .from('profiles')
        .update({
          stripe_connect_charges: account.charges_enabled ?? false,
          stripe_connect_payouts: account.payouts_enabled ?? false,
          stripe_connect_onboarding: (account.charges_enabled && account.payouts_enabled),
        })
        .eq('stripe_connect_id', account.id)

      logger.info(`[Webhook] Account updated: ${account.id}, charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled}`)
      break
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAYMENT INTENT PAYMENT FAILED — Paiement échoué
    // ═══════════════════════════════════════════════════════════════════════════
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent

      // Mettre à jour la transaction client si elle existe
      await supabase
        .from('client_transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', pi.id)

      // Annuler le booking associé s'il existe et récupérer les infos pour l'email
      const { data: booking } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
 notes: ` Paiement échoué: ${pi.last_payment_error?.message || 'Carte refusée'}`,
        })
        .eq('stripe_payment_intent_id', pi.id)
        .select('client_name, client_email, service_name, pro_name, amount_paid')
        .maybeSingle()

      // Envoyer email échec paiement au client
      if (booking?.client_email && booking.client_name) {
        try {
          await sendPaymentFailedNotification({
            clientEmail: booking.client_email,
            clientName: booking.client_name,
            professionalName: booking.pro_name || 'Professionnel',
            serviceName: booking.service_name || undefined,
            amount: booking.amount_paid || 0,
            retryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/marketplace`,
          })
 logger.info(` Email échec paiement envoyé à ${booking.client_email}`)
        } catch (emailErr) {
 logger.error(' Erreur envoi email échec paiement:', emailErr)
        }
      }

      logger.info(`[Webhook] Payment failed: ${pi.id}, reason: ${pi.last_payment_error?.code}`)
      break
    }

    default:
 logger.info(`ℹ Webhook ignoré: ${event.type}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Marquer l'event comme traité
  // ═══════════════════════════════════════════════════════════════════════════════
  await supabase
    .from('webhook_events_log')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id)

  return NextResponse.json({ received: true })
}

/**
 * Handler principal avec gestion des erreurs et retry pour les événements critiques
 */
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    logger.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Webhook invalide' }, { status: 400 })
  }

  // Events critiques qui nécessitent un retry en cas d'échec
  const CRITICAL_EVENTS = [
    'checkout.session.completed',
    'invoice.paid',
    'charge.refunded',
    'payout.paid',
    'account.updated',
  ]

  try {
    // Traiter le webhook
    return await processWebhookEvent(event, body, signature)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[Webhook] Erreur traitement ${event.type}:`, errorMessage)

    // Pour les événements critiques, enregistrer pour retry
    if (CRITICAL_EVENTS.includes(event.type)) {
      try {
        await enqueueWebhookRetry({
          stripeEventId: event.id,
          eventType: event.type,
          eventData: event as unknown as Record<string, unknown>,
          stripeSignature: signature,
          error: errorMessage,
          errorDetails: error instanceof Error ? { stack: error.stack } : undefined,
        })
        logger.info(`[Webhook] Event ${event.id} enregistré pour retry`)
        // Retourner 200 pour éviter que Stripe ne retry automatiquement
        return NextResponse.json({ received: true, queued: true })
      } catch (queueError) {
        logger.error('[Webhook] Impossible d\'enregistrer le retry:', queueError)
      }
    }

    // Pour les non-critiques ou si le retry échoue, retourner 500
    return NextResponse.json(
      { error: 'Webhook handler error', type: event.type },
      { status: 500 }
    )
  }
}

// End of webhook handlers