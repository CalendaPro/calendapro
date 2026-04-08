import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { addCredits, resetCredits } from '@/lib/sms-credits'
import { createBookingAndNotify } from '@/lib/booking-pipeline'
import Stripe from 'stripe'

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
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) return 'premium'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_INFINITY_PRICE_ID) return 'infinity'
  return 'free'
}

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
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Webhook invalide' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

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

          if (!username || !clientName || !date) {
            console.error('booking_deposit webhook: metadata manquante', session.metadata)
            break
          }

          try {
            const baseNotes = (session.metadata?.notes || '').trim()
            const paymentLine = session.metadata?.paymentLabel
              ? `Paiement en ligne : ${session.metadata.paymentLabel}`
              : ''
            const mergedNotes = [baseNotes, paymentLine].filter(Boolean).join('\n\n')

            await createBookingAndNotify({
              username,
              clientName,
              clientEmail: session.metadata?.clientEmail || '',
              clientPhone: session.metadata?.clientPhone || '',
              date,
              notes: mergedNotes,
            })
            console.log(`✅ booking_deposit cree pour ${username}`)
          } catch (error) {
            console.error('❌ booking_deposit webhook:', error)
          }
          break
        }

        // Achat de crédits SMS à la carte
        if (type === 'sms_credits') {
          const credits = parseInt(session.metadata?.credits ?? '0', 10)
          if (userId && credits > 0) {
            await addCredits(userId, credits)
            console.log(`✅ ${credits} crédits SMS ajoutés pour ${userId}`)
          } else {
            console.error('sms_credits webhook: userId ou credits manquant', { userId, credits, meta: session.metadata })
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
            console.error('❌ Supabase upsert error:', error)
          } else {
            console.log(`✅ Subscription ${plan} saved pour ${userId}`)
          }

          // ✅ Reset (pas add) — évite l'accumulation si le webhook est rejoué
          if (plan === 'premium' || plan === 'infinity') {
            const initialCredits = PLAN_INITIAL_CREDITS[plan as 'premium' | 'infinity']
            await resetCredits(userId, initialCredits)
            console.log(`✅ ${initialCredits} crédits SMS initialisés pour ${userId}`)
          }
        }
      } catch (err) {
        console.error('❌ checkout.session.completed:', err)
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

      // ✅ On ignore la première invoice — déjà gérée par checkout.session.completed
      if (invoice.billing_reason === 'subscription_create') break

      if (subscriptionId) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id, plan')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (sub && (sub.plan === 'premium' || sub.plan === 'infinity')) {
          const monthlyCredits = PLAN_INITIAL_CREDITS[sub.plan as 'premium' | 'infinity']
          // ✅ RESET et non ADD — renouvellement remet à zéro, pas cumul
          await resetCredits(sub.user_id, monthlyCredits)
          console.log(`✅ Renouvellement: ${monthlyCredits} crédits reset pour ${sub.user_id}`)
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

      console.log(`✅ Subscription annulée: ${subscription.id}`)
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

      console.log(`✅ Subscription mise à jour: ${plan} — ${subscription.id}`)
      break
    }

    default:
      console.log(`ℹ️ Webhook ignoré: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}