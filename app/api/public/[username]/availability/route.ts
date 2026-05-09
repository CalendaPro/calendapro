import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_START_HOUR = 9   // 09:00
const DEFAULT_END_HOUR   = 19  // 19:00
const SLOT_MINUTES       = 60  // 1 heure par défaut

function toMinutes(isoOrTime: string): number {
  // Handles ISO "2024-04-20T14:30:00" or "14:30"
  const match = isoOrTime.match(/T?(\d{2}):(\d{2})/)
  if (!match) return 0
  return parseInt(match[1]) * 60 + parseInt(match[2])
}

function formatSlot(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Paramètre date requis (YYYY-MM-DD)' }, { status: 400 })
  }

  // ── 1. Get pro profile ──────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .eq('username', username)
    .eq('is_published', true)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Professionnel introuvable' }, { status: 404 })
  }

  const proId = profile.id

  // ── 2. Get existing bookings for that date ──────────────────
  const dayStart = `${date}T00:00:00`
  const dayEnd   = `${date}T23:59:59`

  const { data: bookings } = await supabase
    .from('bookings')
    .select('scheduled_at, duration_minutes')
    .eq('pro_id', proId)
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)
    .neq('status', 'cancelled')

  // Build a set of occupied minute-ranges
  const occupied: Array<{ start: number; end: number }> = []
  if (bookings) {
    for (const b of bookings) {
      const start = toMinutes(b.scheduled_at as string)
      const dur = typeof b.duration_minutes === 'number' ? b.duration_minutes : SLOT_MINUTES
      occupied.push({ start, end: start + dur })
    }
  }

  // ── 3. Generate candidate slots ─────────────────────────────
  const slots: Array<{ time: string; available: boolean }> = []
  const totalMinutes = DEFAULT_END_HOUR * 60

  for (let m = DEFAULT_START_HOUR * 60; m < totalMinutes; m += SLOT_MINUTES) {
    const slotEnd = m + SLOT_MINUTES
    const busy = occupied.some(o => m < o.end && slotEnd > o.start)
    const hour = Math.floor(m / 60)
    const min  = m % 60
    slots.push({ time: formatSlot(hour, min), available: !busy })
  }

  return NextResponse.json({
    date,
    pro_username: username,
    slots,
  })
}
