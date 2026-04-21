import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Desactivé en production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const [proBookings, calendarBookings] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, status, scheduled_at, pro_id')
      .eq('pro_id', userId)
      .limit(10),
    supabase
      .from('bookings')
      .select('id, status, scheduled_at')
      .eq('pro_id', userId)
      .order('scheduled_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    userId,
    proBookingsCount: proBookings.data?.length ?? 0,
    sampleBookings: proBookings.data?.slice(0, 3),
    calendarSample: calendarBookings.data?.slice(0, 3),
    dataSource: 'bookings table only',
    appointmentsTableUsed: false,
    status: 'SYNC_OK',
  })
}
