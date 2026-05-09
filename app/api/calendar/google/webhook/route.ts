import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { syncGoogleCalendar } from '@/lib/google-calendar'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

/**
 * POST /api/calendar/google/webhook
 * Receives push notifications from Google Calendar when events change.
 * Google sends X-Goog-Channel-ID and X-Goog-Resource-ID headers.
 */
export async function POST(request: Request) {
  const channelId = request.headers.get('x-goog-channel-id')
  const resourceId = request.headers.get('x-goog-resource-id')
  const resourceState = request.headers.get('x-goog-resource-state')

  // Validate the webhook has required headers
  if (!channelId || !resourceId) {
    return NextResponse.json({ error: 'Missing Google headers' }, { status: 400 })
  }

  // Ignore sync/exists notifications (initial setup confirmation)
  if (resourceState === 'sync') {
    return NextResponse.json({ received: true })
  }

  const supabase = createServerSupabaseClient()

  // Find the calendar connection by channel ID
  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('pro_id, sync_enabled')
    .eq('watch_channel_id', channelId)
    .eq('provider', 'google')
    .single()

  if (!conn) {
    logger.warn(`[google-webhook] Unknown channel: ${channelId}`)
    return NextResponse.json({ error: 'Unknown channel' }, { status: 404 })
  }

  if (!conn.sync_enabled) {
    return NextResponse.json({ skipped: true, reason: 'sync_disabled' })
  }

  // Trigger a re-sync in background
  try {
    const result = await syncGoogleCalendar(conn.pro_id)
    logger.info(`[google-webhook] Synced ${result.synced} events for pro ${conn.pro_id}`)
    return NextResponse.json({ received: true, synced: result.synced })
  } catch (err) {
    logger.error(`[google-webhook] Sync error for pro ${conn.pro_id}:`, err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
