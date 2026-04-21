import { SupabaseClient } from '@supabase/supabase-js'

type BookingRow = {
  scheduled_at: string
  duration_minutes: number | null
}

/**
 * Returns true if the proposed slot overlaps with any existing non-cancelled
 * booking for the given pro.
 *
 * @param excludeBookingId  Pass the current booking id when checking a reschedule
 *                          so the booking doesn't conflict with itself.
 */
export async function checkBookingConflict(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  proId: string,
  scheduledAt: string,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<boolean> {
  const newStart = new Date(scheduledAt)
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000)

  // Fetch bookings that could possibly overlap.
  // The query window covers [newStart - 8h, newEnd) which is wide enough for any
  // realistic service duration (max 8 h).
  const windowStart = new Date(newStart.getTime() - 8 * 3600000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('bookings')
    .select('id, scheduled_at, duration_minutes')
    .eq('pro_id', proId)
    .neq('status', 'cancelled')
    .lt('scheduled_at', newEnd.toISOString())
    .gte('scheduled_at', windowStart)

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId)
  }

  const { data } = await query

  return (data ?? []).some((b: BookingRow) => {
    const bStart = new Date(b.scheduled_at)
    const bEnd = new Date(bStart.getTime() + (b.duration_minutes ?? 60) * 60000)
    // Standard interval overlap: [bStart, bEnd) ∩ [newStart, newEnd) ≠ ∅
    return bStart < newEnd && bEnd > newStart
  })
}

/**
 * Returns true if the scheduled_at timestamp uses minutes that are a
 * multiple of 5 (e.g. :00, :05, :15, :30 …).
 */
export function isValidSlotTime(scheduledAt: string): boolean {
  return new Date(scheduledAt).getMinutes() % 5 === 0
}
