import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ensureProfile } from '@/lib/auth/ensure-profile'
import { stripe } from '@/lib/stripe'

/**
 * GET /api/auth/sync
 *
 * Point de synchronisation post-inscription Clerk.
 * Vérifie/crée le profil utilisateur et gère la logique de plan/paiement.
 *
 * Query params:
 *   - planId: 'starter' | 'premium' | 'infinity' (default: 'starter')
 *
 * Flow:
 *   1. Vérifie l'auth Clerk
 *   2. Vérifie/crée le profil dans Supabase
 *   3. Si planId != 'starter' → Crée session Stripe Checkout → redirect
 *   4. Sinon → redirect vers onboarding
 */
export async function GET(request: NextRequest) {
  console.log('🔄 AUTH SYNC STARTED')

  const { userId } = await auth()

  // 1. Pas connecté → retour sign-up
  if (!userId) {
    console.log('❌ No userId, redirecting to /sign-up')
    return NextResponse.redirect(new URL('/sign-up', request.url))
  }

  // 2. Récupérer les params
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get('planId') || 'starter'

  console.log('👤 userId:', userId)
  console.log('📦 planId:', planId)

  // 3. Vérifier/créer le profil (upsert idempotent, protège les plans payants)
  let profile: { email: string | null } | null = null
  try {
    profile = await ensureProfile(userId, { role: 'pro' })
    console.log('✅ ensureProfile OK pour', userId)
  } catch (err) {
    console.error('❌ ensureProfile failed in sync:', err)
    return NextResponse.redirect(new URL('/auth-error?error=profile_creation', request.url))
  }

  // 4. Gérer le flow selon le plan

  // Plan Starter → onboarding direct
  if (planId === 'starter') {
    console.log('🚀 Starter plan → redirecting to /onboarding')
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Plans Premium/Infinity → Stripe Checkout
  console.log('💳 Paid plan detected, creating Stripe session...')

  // Récupérer les price IDs depuis les variables d'env
  const priceIds: Record<string, string> = {
    premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
    infinity: process.env.STRIPE_INFINITY_PRICE_ID!,
  }

  const priceId = priceIds[planId]

  if (!priceId) {
    console.error('❌ Missing price ID for plan:', planId)
    const errorUrl = new URL('/auth-error', request.url)
    errorUrl.searchParams.set('error', 'invalid_plan')
    errorUrl.searchParams.set('planId', planId)
    return NextResponse.redirect(errorUrl)
  }

  try {
    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sync/callback?session_id={CHECKOUT_SESSION_ID}&planId=${planId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`,
      metadata: {
        userId,
        planId,
      },
      customer_email: profile?.email ?? undefined,
    })

    console.log('✅ Stripe session created:', session.id)

    // Redirect vers Stripe Checkout
    return NextResponse.redirect(session.url!)

  } catch (error) {
    console.error('❌ Stripe checkout error:', error)
    const errorUrl = new URL('/auth-error', request.url)
    errorUrl.searchParams.set('error', 'stripe')
    errorUrl.searchParams.set('planId', planId)
    return NextResponse.redirect(errorUrl)
  }
}
