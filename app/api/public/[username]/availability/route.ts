import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_START_HOUR = 9   // 09:00 (fallback si pas de schedule)
const DEFAULT_END_HOUR   = 19  // 19:00
const SLOT_INTERVAL      = 30  // créneaux toutes les 30 min

function formatSlot(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function toMinutes(isoOrTime: string): number {
  const match = isoOrTime.match(/T?(\d{2}):(\d{2})/)
  if (!match) return 0
  return parseInt(match[1]) * 60 + parseInt(match[2])
}

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') // YYYY-MM-DD
  const durationParam = searchParams.get('duration')
  const durationMinutes = durationParam ? Math.max(15, parseInt(durationParam, 10) || 60) : 60

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Paramètre date requis (YYYY-MM-DD)' }, { status: 400 })
  }

  // ── 1. Get pro profile ──────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, schedule')
    .eq('username', username)
    .eq('is_published', true)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Professionnel introuvable' }, { status: 404 })
  }

  const proId = profile.id

  // ── 2. Get available slots via lib/availability ─────────────
  // getAvailableSlots reads the pro's schedule (JSONB), existing bookings,
  // and blocked slots — returns only the free TimeSlot[] entries.
  let availableSlotsSet: Set<string> | null = null

  if (profile.schedule) {
    try {
      const freeSlots = await getAvailableSlots({
        proId,
        date,
        durationMinutes,
        slotInterval: SLOT_INTERVAL,
      })
      // Build a set of "HH:MM" strings from the free ISO start times
      availableSlotsSet = new Set(
        freeSlots.map((s) => {
          const m = s.start.match(/T(\d{2}:\d{2})/)
          return m ? m[1] : ''
        }).filter(Boolean)
      )
    } catch (err) {
      logger.error('[availability route] getAvailableSlots error:', err)
      // Fall through to legacy path
    }
  }

  // ── 3. Legacy path: schedule not set → use existing bookings + default hours
  if (availableSlotsSet === null) {
    const dayStart = `${date}T00:00:00`
    const dayEnd   = `${date}T23:59:59`

    const { data: bookings } = await supabase
      .from('bookings')
      .select('scheduled_at, duration_minutes')
      .eq('pro_id', proId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .neq('status', 'cancelled')

    // Build occupied minute-ranges
    const occupied: Array<{ start: number; end: number }> = []
    for (const b of (bookings ?? [])) {
      const start = toMinutes(b.scheduled_at as string)
      const dur = typeof b.duration_minutes === 'number' ? b.duration_minutes : durationMinutes
      occupied.push({ start, end: start + dur })
    }

    // Generate candidate slots and check conflicts
    const legacyFreeSlots = new Set<string>()
    for (let m = DEFAULT_START_HOUR * 60; m + durationMinutes <= DEFAULT_END_HOUR * 60; m += SLOT_INTERVAL) {
      const slotEnd = m + durationMinutes
      const busy = occupied.some(o => m < o.end && slotEnd > o.start)
      if (!busy) {
        legacyFreeSlots.add(formatSlot(Math.floor(m / 60), m % 60))
      }
    }
    availableSlotsSet = legacyFreeSlots
  }

  // ── 4. Build final response — determine working hours window ─
  type DaySchedule = { start: string; end: string; closed: boolean }
  const dayMap: Record<number, string> = {
    0: 'dimanche', 1: 'lundi', 2: 'mardi', 3: 'mercredi',
    4: 'jeudi', 5: 'vendredi', 6: 'samedi',
  }
  const dayName = dayMap[new Date(date + 'T12:00:00').getDay()]
  const dayConfig = profile.schedule
    ? (profile.schedule as Record<string, DaySchedule>)[dayName]
    : null

  const windowStartMin = dayConfig && !dayConfig.closed
    ? toMinutes(dayConfig.start)
    : DEFAULT_START_HOUR * 60
  const windowEndMin = dayConfig && !dayConfig.closed
    ? toMinutes(dayConfig.end)
    : DEFAULT_END_HOUR * 60

  // If the day is closed per the pro's schedule, return empty
  if (dayConfig?.closed) {
    return NextResponse.json({ date, pro_username: username, slots: [], closed: true })
  }

  // Generate all candidate slots in the window
  const slots: Array<{ time: string; available: boolean }> = []
  for (let m = windowStartMin; m + durationMinutes <= windowEndMin; m += SLOT_INTERVAL) {
    const time = formatSlot(Math.floor(m / 60), m % 60)
    slots.push({ time, available: availableSlotsSet.has(time) })
  }

  return NextResponse.json({
    date,
    pro_username: username,
    slots,
    duration: durationMinutes,
  })
}
