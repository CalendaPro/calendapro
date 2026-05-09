import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit, stripeRateLimits } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  // Rate limiting: max 30 req/minute per user for transaction queries
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`connect-tx:${userId}:${clientIp}`, { maxRequests: 30, windowMs: 60 * 1000 })
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

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = (page - 1) * limit

  const supabase = createServerSupabaseClient()

  const { data: transactions, error, count } = await supabase
    .from('connect_transactions')
    .select('*', { count: 'exact' })
    .eq('pro_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.error('[Connect Transactions]', error)
    return NextResponse.json({ error: 'Erreur recuperation transactions' }, { status: 500 })
  }

  return NextResponse.json({
    transactions: transactions || [],
    total: count || 0,
    page,
    limit,
  })
}
