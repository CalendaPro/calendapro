import { NextResponse } from 'next/server'
import { getActiveDiscounts } from '@/lib/pulse/pricing'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Public endpoint — no auth required
// Used by the booking page to show discounted slots
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const proId = searchParams.get('pro_id')

  if (!proId) {
    return NextResponse.json(
      { error: 'pro_id requis' },
      { status: 400 }
    )
  }

  try {
    const discounts = await getActiveDiscounts(proId)
    return NextResponse.json({ discounts })
  } catch (e) {
    logger.error('[API:Public:PulseDiscounts] error:', e)
    return NextResponse.json(
      { error: 'Erreur récupération promotions' },
      { status: 500 }
    )
  }
}
