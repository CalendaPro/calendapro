import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const supabase = createServerSupabaseClient()

  const [todayRes, clientsRes, monthRes, pendingRes] = await Promise.all([
    // RDV aujourd'hui (table bookings, colonne scheduled_at, filtre pro_id)
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString()),

    // Total clients uniques (distinct client_id dans bookings)
    supabase
      .from('bookings')
      .select('client_id')
      .eq('pro_id', userId)
      .neq('status', 'cancelled'),

    // RDV ce mois
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', firstDayOfMonth.toISOString()),

    // RDV en attente
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .eq('status', 'pending'),
  ])

  // Count distinct clients
  const uniqueClients = new Set((clientsRes.data ?? []).map((b) => b.client_id))

  return NextResponse.json({
    todayAppointments: todayRes.count ?? 0,
    totalClients: uniqueClients.size,
    monthAppointments: monthRes.count ?? 0,
    pendingAppointments: pendingRes.count ?? 0,
  })
}