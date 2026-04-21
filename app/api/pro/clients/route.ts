import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabase = createServerSupabaseClient()

    // Récupérer les client_profiles qui ont des bookings avec ce pro
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('client_id')
      .eq('pro_id', userId)

    if (bookingsError) {
      console.error('[Pro Clients API] Error fetching bookings:', bookingsError)
      return NextResponse.json({ error: 'Erreur de base de données' }, { status: 500 })
    }

    const clientIds = [...new Set((bookings || []).map(b => b.client_id).filter(Boolean))]

    if (clientIds.length === 0) {
      return NextResponse.json([])
    }

    // Récupérer les profils clients
    const { data: clients, error: clientsError } = await supabase
      .from('client_profiles')
      .select('user_id, first_name, last_name, phone, email, avatar_url')
      .in('user_id', clientIds)
      .order('first_name', { ascending: true })

    if (clientsError) {
      console.error('[Pro Clients API] Error fetching clients:', clientsError)
      return NextResponse.json({ error: 'Erreur de base de données' }, { status: 500 })
    }

    // Map to include computed name
    const clientsWithName = (clients || []).map(c => ({
      user_id: c.user_id,
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Client',
      phone: c.phone,
      email: c.email,
      avatar_url: c.avatar_url,
    }))

    return NextResponse.json(clientsWithName)
  } catch (err) {
    console.error('[Pro Clients API] Exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
