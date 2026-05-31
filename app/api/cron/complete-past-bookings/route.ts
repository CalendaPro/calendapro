import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, scheduled_at, duration_minutes')
    .in('status', ['upcoming', 'confirmed'])
    .lt('scheduled_at', now)

  if (error) {
    logger.error('[cron/complete-past-bookings] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ completed: 0 })
  }

  const pastIds = bookings
    .filter(b => {
      const endTime = new Date(b.scheduled_at).getTime() + (b.duration_minutes || 60) * 60_000
      return endTime < Date.now()
    })
    .map(b => b.id)

  if (pastIds.length === 0) {
    return NextResponse.json({ completed: 0 })
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .in('id', pastIds)

  if (updateError) {
    logger.error('[cron/complete-past-bookings] Update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  logger.info(`[cron/complete-past-bookings] Marked ${pastIds.length} bookings as completed`)
  return NextResponse.json({ completed: pastIds.length })
}
