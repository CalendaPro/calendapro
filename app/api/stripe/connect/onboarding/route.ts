import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit, stripeRateLimits } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  // Rate limiting: max 20 req/minute per user for Connect operations
  const rateLimit = checkRateLimit(`stripe-connect:${userId}`, stripeRateLimits.connect)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Trop de requetes. Veuillez reessayer dans une minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL manquant' }, { status: 500 })
  }

  const supabase = createServerSupabaseClient()

  // Check if the pro already has a Connect account
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, stripe_connect_id, email, full_name')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  let accountId = profile.stripe_connect_id

  // Create a new Connect account if none exists
  if (!accountId) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email: profile.email || undefined,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          calendapro_user_id: userId,
        },
      })

      accountId = account.id

      // Save the Connect ID to the profile
      await supabase
        .from('profiles')
        .update({
          stripe_connect_id: accountId,
          stripe_connect_created_at: new Date().toISOString(),
        })
        .eq('id', userId)
    } catch (err) {
      logger.error('[Connect] Erreur creation compte:', err)
      return NextResponse.json({ error: 'Erreur creation compte Stripe' }, { status: 500 })
    }
  }

  // Generate the account link for onboarding
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/settings?section=integrations&connect_refresh=true`,
      return_url: `${appUrl}/api/stripe/connect/return?account_id=${accountId}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    logger.error('[Connect] Erreur account_link:', err)
    return NextResponse.json({ error: 'Erreur generation lien onboarding' }, { status: 500 })
  }
}
