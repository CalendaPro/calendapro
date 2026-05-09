import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Public — returns scarcity indicators for marketplace cards
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const proIds = searchParams.get('ids')?.split(',').filter(Boolean)

  if (!proIds?.length) {
    return NextResponse.json({ stats: {} })
  }

  const { data, error } = await supabase
    .from('pro_scarcity_stats')
    .select('*')
    .in('pro_id', proIds)

  if (error) {
    logger.error('[ProScarcity] Error:', error.message)
    return NextResponse.json({ stats: {} })
  }

  const stats: Record<string, {
    views_24h: number
    views_7d: number
    last_booked_at: string | null
    waitlist_count: number
    total_bookings: number
  }> = {}

  for (const row of data ?? []) {
    stats[row.pro_id] = {
      views_24h: row.views_24h ?? 0,
      views_7d: row.views_7d ?? 0,
      last_booked_at: row.last_booked_at,
      waitlist_count: row.waitlist_count ?? 0,
      total_bookings: row.total_bookings ?? 0,
    }
  }

  return NextResponse.json({ stats })
}
