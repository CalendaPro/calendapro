import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // RDV aujourd'hui
  const { count: todayCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())

  // Total clients
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // RDV ce mois
  const { count: monthCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', firstDayOfMonth.toISOString())

  // RDV en attente
  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending')

  return NextResponse.json({
    todayAppointments: todayCount ?? 0,
    totalClients: clientsCount ?? 0,
    monthAppointments: monthCount ?? 0,
    pendingAppointments: pendingCount ?? 0,
  })
}