import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { getProConnectId } from '@/lib/stripe-connect'
import { checkRateLimit, stripeRateLimits } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  // Rate limiting: max 20 req/minute per user
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`connect-balance:${userId}:${clientIp}`, stripeRateLimits.connect)
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

  const connectId = await getProConnectId(userId)
  if (!connectId) {
    return NextResponse.json({
      available: 0,
      pending: 0,
      currency: 'eur',
      connect_configured: false,
    })
  }

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectId,
    })

    const available = balance.available
      .filter(b => b.currency === 'eur')
      .reduce((sum, b) => sum + b.amount, 0)

    const pending = balance.pending
      .filter(b => b.currency === 'eur')
      .reduce((sum, b) => sum + b.amount, 0)

    return NextResponse.json({
      available,
      pending,
      currency: 'eur',
      connect_configured: true,
    })
  } catch (err) {
    logger.error('[Connect Balance]', err)
    return NextResponse.json({ error: 'Erreur recuperation solde' }, { status: 500 })
  }
}
