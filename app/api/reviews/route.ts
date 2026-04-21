import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    pro_id?: string
    booking_id?: string
    rating?: number
    comment?: string
  }

  const { pro_id, booking_id, rating, comment } = body

  if (!pro_id || !rating) {
    return NextResponse.json({ error: 'pro_id et rating requis' }, { status: 400 })
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating doit être entre 1 et 5' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Si booking_id fourni : vérifier qu'il appartient bien au client et est complété
  if (booking_id) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', booking_id)
      .eq('client_id', userId)
      .maybeSingle()

    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Vous ne pouvez noter que des réservations terminées' },
        { status: 403 }
      )
    }

    // Un seul avis par réservation
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Vous avez déjà noté cette réservation' }, { status: 409 })
    }
  } else {
    // Sans booking_id : un seul avis par couple (client, pro)
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('client_id', userId)
      .eq('pro_id', pro_id)
      .is('booking_id', null)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Vous avez déjà noté ce professionnel' }, { status: 409 })
    }
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      client_id: userId,
      pro_id,
      booking_id: booking_id ?? null,
      rating,
      comment: comment?.trim() ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pro_id = searchParams.get('pro_id')

  if (!pro_id) {
    return NextResponse.json({ error: 'pro_id requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, client_id')
    .eq('pro_id', pro_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reviews = data ?? []
  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null

  return NextResponse.json({ reviews, average: avg, count: reviews.length })
}
