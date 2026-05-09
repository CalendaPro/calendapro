import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar/google/status
 * Returns current Google Calendar connection status for the authenticated pro.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('provider_email, sync_enabled, last_synced_at, watch_expiration, created_at')
    .eq('pro_id', userId)
    .eq('provider', 'google')
    .maybeSingle()

  if (!conn) {
    return NextResponse.json({ connected: false })
  }

  // Get recent sync logs
  const { data: logs } = await supabase
    .from('sync_logs')
    .select('status, events_synced, error_message, started_at')
    .eq('pro_id', userId)
    .eq('provider', 'google')
    .order('started_at', { ascending: false })
    .limit(5)

  // Count blocked slots from Google
  const { count: blockedCount } = await supabase
    .from('blocked_slots')
    .select('id', { count: 'exact', head: true })
    .eq('pro_id', userId)
    .eq('source', 'google')

  return NextResponse.json({
    connected: true,
    provider_email: conn.provider_email,
    sync_enabled: conn.sync_enabled,
    last_synced_at: conn.last_synced_at,
    watch_active: conn.watch_expiration ? new Date(conn.watch_expiration) > new Date() : false,
    watch_expires_at: conn.watch_expiration,
    blocked_events_count: blockedCount ?? 0,
    recent_syncs: logs ?? [],
  })
}
