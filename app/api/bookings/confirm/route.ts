import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { booking_id } = await req.json()

  if (!booking_id) {
    return NextResponse.json({ error: 'ID de réservation requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // userId IS the pro_id in bookings table (profiles.id = Clerk userId)
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', booking_id)
    .eq('pro_id', userId)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
  }

  if (!['upcoming', 'pending'].includes(booking.status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  // Mettre à jour le statut en "upcoming" (confirmé)
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      status: 'upcoming',
      updated_at: new Date().toISOString()
    })
    .eq('id', booking_id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    booking: data?.[0],
    message: 'Rendez-vous confirmé avec succès'
  })
}
