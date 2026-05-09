import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { stopGoogleWatch } from '@/lib/google-calendar'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/calendar/google/disconnect
 * Disconnects Google Calendar: stops watch, removes tokens & blocked slots.
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  // Stop Google watch notifications
  try {
    await stopGoogleWatch(userId)
  } catch (err) {
    logger.warn('[google-disconnect] Stop watch failed (non-blocking):', err)
  }

  // Delete connection
  await supabase
    .from('calendar_connections')
    .delete()
    .eq('pro_id', userId)
    .eq('provider', 'google')

  // Clean up blocked slots from Google
  await supabase
    .from('blocked_slots')
    .delete()
    .eq('pro_id', userId)
    .eq('source', 'google')

  return NextResponse.json({ success: true })
}
