import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from './logger'

export type TimeSlot = {
  start: string   // ISO 8601
  end: string     // ISO 8601
}

export type AvailabilityOptions = {
  proId: string
  date: string              // YYYY-MM-DD
  durationMinutes?: number  // default 60
  slotInterval?: number     // default 30
}

/**
 * Calculates available time slots for a professional on a given date.
 *
 * Crosses three data sources:
 * 1. Pro's schedule (opening hours from profiles.schedule JSONB)
 * 2. Existing bookings in the `bookings` table
 * 3. Blocked slots from external calendars (Google Calendar via blocked_slots)
 *
 * Uses TypeScript implementation - no DB function required.
 */
export async function getAvailableSlots(opts: AvailabilityOptions): Promise<TimeSlot[]> {
  const { proId, date, durationMinutes = 60, slotInterval = 30 } = opts
  const supabase = createServerSupabaseClient()

  // 1. Get pro schedule from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('schedule')
    .eq('id', proId)
    .maybeSingle()

  if (profileError) {
    logger.error('[availability] Error fetching profile:', profileError)
    return []
  }

  if (!profile?.schedule) {
    logger.info('[availability] No schedule found for pro:', proId)
    return []
  }

  // Map JS day (0=dimanche) to French day names
  const dayMap: Record<number, string> = {
    0: 'dimanche', 1: 'lundi', 2: 'mardi', 3: 'mercredi',
    4: 'jeudi', 5: 'vendredi', 6: 'samedi',
  }

  const dateObj = new Date(date + 'T00:00:00')
  const dayName = dayMap[dateObj.getDay()]
  
  type DaySchedule = { start: string; end: string; closed: boolean }
  const schedule = profile.schedule as Record<string, DaySchedule>
  const dayConfig = schedule[dayName]

  if (!dayConfig || dayConfig.closed) {
    return []
  }

  // 2. Get existing bookings for the day
  const dayStart = new Date(date + 'T00:00:00')
  const dayEnd = new Date(date + 'T23:59:59')

  const [bookingsRes, blockedRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('scheduled_at, duration_minutes')
      .eq('pro_id', proId)
      .neq('status', 'cancelled')
      .neq('status', 'no_show')
      .gte('scheduled_at', dayStart.toISOString())
      .lte('scheduled_at', dayEnd.toISOString()),
    supabase
      .from('blocked_slots')
      .select('start_at, end_at')
      .eq('pro_id', proId)
      .lte('start_at', dayEnd.toISOString())
      .gte('end_at', dayStart.toISOString()),
  ])

  const bookings = bookingsRes.data ?? []
  const blockedSlots = blockedRes.data ?? []

  // 3. Build occupied ranges
  type Range = { start: number; end: number }
  const occupied: Range[] = [
    ...bookings.map((b) => {
      const s = new Date(b.scheduled_at).getTime()
      return { start: s, end: s + (b.duration_minutes ?? 60) * 60000 }
    }),
    ...blockedSlots.map((bs) => ({
      start: new Date(bs.start_at).getTime(),
      end: new Date(bs.end_at).getTime(),
    })),
  ]

  // 4. Generate available slots
  const [openH, openM] = dayConfig.start.split(':').map(Number)
  const [closeH, closeM] = dayConfig.end.split(':').map(Number)

  const openTime = new Date(date + 'T00:00:00')
  openTime.setHours(openH, openM, 0, 0)

  const closeTime = new Date(date + 'T00:00:00')
  closeTime.setHours(closeH, closeM, 0, 0)

  const now = Date.now()
  const slots: TimeSlot[] = []

  let cursor = openTime.getTime()
  const slotDurationMs = durationMinutes * 60000
  const intervalMs = slotInterval * 60000

  while (cursor + slotDurationMs <= closeTime.getTime()) {
    const slotEnd = cursor + slotDurationMs

    // Skip if slot is in the past (with 1 minute buffer)
    if (cursor < now - 60000) {
      cursor += intervalMs
      continue
    }

    // Check overlap with occupied ranges
    const hasConflict = occupied.some(
      (occ) => cursor < occ.end && slotEnd > occ.start
    )

    if (!hasConflict) {
      slots.push({
        start: new Date(cursor).toISOString(),
        end: new Date(slotEnd).toISOString(),
      })
    }

    cursor += intervalMs
  }

  return slots
}

/**
 * Alias pour compatibilité. 
 * @deprecated Utilisez getAvailableSlots() directement.
 */
export async function getAvailableSlotsTS(opts: AvailabilityOptions): Promise<TimeSlot[]> {
  return getAvailableSlots(opts)
}
