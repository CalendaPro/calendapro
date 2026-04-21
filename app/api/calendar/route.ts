import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkBookingConflict, isValidSlotTime } from '@/lib/booking-conflict'
import { revalidatePath } from 'next/cache'
import { toUiStatus } from '@/lib/booking-status'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limit (remplacé par Upstash en production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxPerMinute = 10): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= maxPerMinute) return false
  entry.count++
  return true
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, service_name, scheduled_at, duration_minutes, status, price, notes, pro_name, client_id, cancellation_reason, payment_status, deposit_amount'
    )
    .eq('pro_id', userId)
    .order('scheduled_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (data ?? []).map((b) => ({
    id: b.id,
    title: b.service_name || 'Rendez-vous',
    date: b.scheduled_at,
    duration: b.duration_minutes ?? 60,
    status: toUiStatus(b.status),
    price: Number(b.price) || 0,
    deposit_amount: Number(b.deposit_amount) || 0,
    notes: b.notes,
    client_name: b.pro_name || null,
    client_id: b.client_id,
    cancellation_reason: b.cancellation_reason,
    payment_status: b.payment_status,
  }))

  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  // Rate limiting : max 20 creations par minute par utilisateur
  if (!checkRateLimit(`calendar_create_${userId}`, 20)) {
    return NextResponse.json(
      { error: 'Trop de requetes. Veuillez patienter.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { title, date, duration, notes, client_id, client_name } = body as {
    title?: string
    date?: string
    duration?: number
    notes?: string
    client_id?: string
    client_name?: string
  }

  if (!title || !date) {
    return NextResponse.json({ error: 'title et date requis' }, { status: 400 })
  }

  const normalizedDate = new Date(date).toISOString()

  if (!isValidSlotTime(normalizedDate)) {
    return NextResponse.json(
      { error: "L'heure doit etre un multiple de 5 minutes" },
      { status: 400 }
    )
  }

  const supabase = createServerSupabaseClient()
  const conflict = await checkBookingConflict(supabase, userId, normalizedDate, duration ?? 60)
  if (conflict) {
    return NextResponse.json({ error: 'Ce creneau est deja occupe.' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      pro_id: userId,
      client_id: client_id || null,
      pro_name: client_name || null,
      service_name: title,
      scheduled_at: normalizedDate,
      duration_minutes: duration ?? 60,
      status: 'upcoming',
      payment_status: 'pending',
      notes: notes ?? null,
      source_channel: 'pro_dashboard',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/dashboard', 'layout')

  return NextResponse.json({
    id: data.id,
    title: data.service_name,
    date: data.scheduled_at,
    duration: data.duration_minutes ?? 60,
    status: 'confirmed',
    price: Number(data.price) || 0,
  }, { status: 201 })
}
