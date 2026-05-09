import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get first day of current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Count SMS notifications sent this month
    const { count, error } = await supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'client_sms')
      .eq('status', 'sent')
      .gte('created_at', firstDayOfMonth)

    if (error) {
      logger.error('[API:Public:SMS-Stats] Error:', error)
      return NextResponse.json(
        { count: 0, error: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    logger.error('[API:Public:SMS-Stats] Unexpected error:', error)
    return NextResponse.json(
      { count: 0, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
