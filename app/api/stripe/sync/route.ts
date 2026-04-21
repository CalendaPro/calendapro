import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { resetCredits } from '@/lib/sms-credits'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

const PLAN_INITIAL_CREDITS: Record<string, number> = {
  premium: 30,
  infinity: 200,
}

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) return 'premium'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_INFINITY_PRICE_ID) return 'infinity'
  return 'free'
}

/**
 * POST /api/stripe/sync
 * Body: { sessionId: string }
 *
 * Retrieves the Stripe checkout session and upserts the subscription into Supabase.
 * Used as a fallback when the Stripe webhook hasn't fired (local dev without CLI).
 */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const sessionId = body?.sessionId as string | undefined

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'sessionId invalide' }, { status: 400 })
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })
  } catch {
    return NextResponse.json({ error: 'Session Stripe introuvable' }, { status: 404 })
  }

  // Security: session must belong to the authenticated user
  const metaUserId = session.metadata?.userId
  if (metaUserId !== userId) {
    return NextResponse.json({ error: 'Session non autorisée' }, { status: 403 })
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 })
  }

  const subscription = session.subscription as Stripe.Subscription | null
  if (!subscription) {
    return NextResponse.json({ error: 'Pas de subscription liée à cette session' }, { status: 400 })
  }

  const priceId = subscription.items.data[0]?.price?.id ?? ''
  const plan = getPlanFromPriceId(priceId)
  const rawSub = subscription as Stripe.Subscription & { current_period_end?: number | null }
  const periodEnd = rawSub.current_period_end
    ? new Date(rawSub.current_period_end * 1000).toISOString()
    : null

  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      status: 'active',
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('❌ sync upsert error:', error)
    return NextResponse.json({ error: 'Erreur Supabase', detail: error.message }, { status: 500 })
  }

  // Init SMS credits for new paid plans
  if (plan === 'premium' || plan === 'infinity') {
    await resetCredits(userId, PLAN_INITIAL_CREDITS[plan])
  }

  console.log(`✅ Plan synchronisé: ${plan} pour ${userId}`)
  return NextResponse.json({ ok: true, plan })
}
