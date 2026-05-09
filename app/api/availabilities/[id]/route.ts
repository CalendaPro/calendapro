import { NextResponse } from 'next/server'
import { getAvailableSlots, getAvailableSlotsTS } from '@/lib/availability'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/availabilities/[id]?date=YYYY-MM-DD&duration=60&interval=30
 *
 * Returns available slots for a professional on a given date.
 * Public endpoint — no auth required (clients need to see availability).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proId } = await params
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const duration = Number(searchParams.get('duration')) || 60
  const interval = Number(searchParams.get('interval')) || 30

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Paramètre date requis au format YYYY-MM-DD' },
      { status: 400 }
    )
  }

  // Reject dates more than 90 days in the future
  const requestedDate = new Date(date)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 90)
  if (requestedDate > maxDate) {
    return NextResponse.json(
      { error: 'Date trop éloignée (max 90 jours)' },
      { status: 400 }
    )
  }

  // Reject dates in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (requestedDate < today) {
    return NextResponse.json({ slots: [] })
  }

  try {
    // Try SQL RPC first, fallback to TypeScript implementation
    let slots
    try {
      slots = await getAvailableSlots({
        proId,
        date,
        durationMinutes: duration,
        slotInterval: interval,
      })
    } catch {
      logger.warn('[availabilities] RPC fallback to TS implementation')
      slots = await getAvailableSlotsTS({
        proId,
        date,
        durationMinutes: duration,
        slotInterval: interval,
      })
    }

    return NextResponse.json({
      pro_id: proId,
      date,
      duration_minutes: duration,
      slot_count: slots.length,
      slots,
    })
  } catch (err) {
    logger.error('[availabilities] Error:', err)
    return NextResponse.json(
      { error: 'Erreur lors du calcul de disponibilité' },
      { status: 500 }
    )
  }
}
