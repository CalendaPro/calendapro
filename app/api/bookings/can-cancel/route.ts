import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/bookings/can-cancel?booking_id=xxx - Vérifier si le client peut annuler
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const booking_id = searchParams.get('booking_id')

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Utiliser la fonction RPC pour vérifier
  const { data: result, error } = await supabase.rpc(
    'can_client_cancel_booking',
    {
      p_booking_id: booking_id,
      p_client_id: userId,
    }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(result)
}
