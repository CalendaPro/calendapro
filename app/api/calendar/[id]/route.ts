import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkBookingConflict, isValidSlotTime } from '@/lib/booking-conflict'
import { revalidatePath } from 'next/cache'
import { toDbStatus, toUiStatus } from '@/lib/booking-status'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { date, duration, status, notes, cancellation_reason } = body as {
    date?: string
    duration?: number
    status?: string
    notes?: string
    cancellation_reason?: string
  }

  const supabase = createServerSupabaseClient()

  if (date !== undefined) {
    const normalizedDate = new Date(date).toISOString()
    if (!isValidSlotTime(normalizedDate)) {
      return NextResponse.json(
        { error: "L'heure doit etre un multiple de 5 minutes" },
        { status: 400 }
      )
    }
    const conflict = await checkBookingConflict(
      supabase, userId, normalizedDate, duration ?? 60, id
    )
    if (conflict) {
      return NextResponse.json({ error: 'Ce creneau est deja occupe.' }, { status: 409 })
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (date !== undefined) updates.scheduled_at = new Date(date).toISOString()
  if (duration !== undefined) updates.duration_minutes = duration
  if (notes !== undefined) updates.notes = notes
  if (cancellation_reason !== undefined) updates.cancellation_reason = cancellation_reason
  if (status !== undefined) {
    updates.status = toDbStatus(status)
    if (status === 'completed' || status === 'no_show') {
      updates.completed_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .eq('pro_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/dashboard', 'layout')

  return NextResponse.json({
    id: data.id,
    title: data.service_name,
    date: data.scheduled_at,
    duration: data.duration_minutes ?? 60,
    status: toUiStatus(data.status),
    price: Number(data.price) || 0,
    notes: data.notes,
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { id } = await params
  const supabase = createServerSupabaseClient()

  // Soft delete : on annule, on ne supprime pas
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('pro_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/dashboard', 'layout')
  return NextResponse.json({ success: true })
}
