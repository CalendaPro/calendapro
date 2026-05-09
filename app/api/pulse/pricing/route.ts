import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { userHasPlan } from '@/lib/subscription'
import {
  getPricingRule,
  upsertPricingRule,
  getActiveDiscounts,
  getPricingStats,
} from '@/lib/pulse/pricing'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const REQUIRED_PLAN = 'infinity' as const

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const hasAccess = await userHasPlan(userId, REQUIRED_PLAN)
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Plan Infinity requis', upgrade: true },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')

    if (view === 'discounts') {
      const discounts = await getActiveDiscounts(userId)
      return NextResponse.json({ discounts })
    }

    if (view === 'stats') {
      const stats = await getPricingStats(userId)
      return NextResponse.json({ stats })
    }

    // Default: return pricing rule
    const rule = await getPricingRule(userId)
    return NextResponse.json({ rule })
  } catch (e) {
    logger.error('[API:Pulse:Pricing] GET error:', e)
    return NextResponse.json(
      { error: 'Erreur récupération tarification' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const body = await request.json()

    const rule = await upsertPricingRule(userId, {
      enabled: body.enabled ?? false,
      discount_percent: body.discount_percent ?? 15,
      hours_before_threshold: body.hours_before_threshold ?? 24,
      min_price_floor: body.min_price_floor ?? 0,
      applicable_days: body.applicable_days ?? [1, 2, 3, 4, 5],
      applicable_hours_start: body.applicable_hours_start ?? '09:00',
      applicable_hours_end: body.applicable_hours_end ?? '18:00',
    })

    return NextResponse.json({ rule })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue'
    const status = message.includes('plan Infinity') ? 403 : 500
    return NextResponse.json({ error: message, upgrade: status === 403 }, { status })
  }
}
