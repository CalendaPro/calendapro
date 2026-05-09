import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { refreshConnectStatus } from '@/lib/stripe-connect'
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
  const rateLimit = checkRateLimit(`connect-status:${userId}:${clientIp}`, stripeRateLimits.connect)
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

  try {
    const status = await refreshConnectStatus(userId)
    return NextResponse.json(status)
  } catch (err) {
    logger.error('[Connect Status]', err)
    return NextResponse.json(
      { connected: false, charges_enabled: false, payouts_enabled: false, onboarding_complete: false },
      { status: 200 }
    )
  }
}
