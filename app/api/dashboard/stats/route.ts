import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  // Dates en heure locale (pas UTC) pour éviter le décalage matin
  const now = new Date()

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // Lundi de la semaine courante
  const weekStart = new Date(now)
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // lundi
  weekStart.setDate(now.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)

  const [todayRes, weekRes, pendingRes, revenueRes] = await Promise.all([
    // RDV aujourd'hui (tous statuts sauf cancelled)
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .neq('status', 'cancelled'),

    // RDV cette semaine
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .gte('scheduled_at', weekStart.toISOString())
      .neq('status', 'cancelled'),

    // En attente de confirmation
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .eq('status', 'pending'),

    // Revenus semaine : prix, acomptes, statut pour calcul detaille
    supabase
      .from('bookings')
      .select('price, deposit_amount, payment_status, status')
      .eq('pro_id', userId)
      .gte('scheduled_at', weekStart.toISOString())
      .neq('status', 'cancelled'),
  ])

  const revenueBookings = revenueRes.data ?? []

  // CA encaisse = paiements confirms (paye en entier)
  const caEncaisse = revenueBookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0)

  // Acomptes percus = depots verses (paiement partiel, non encore complet)
  const caAcomptes = revenueBookings
    .filter((b) => b.payment_status !== 'paid' && Number(b.deposit_amount) > 0)
    .reduce((sum, b) => sum + Number(b.deposit_amount), 0)

  // CA previsionnel = prix des RDV confirmes non encore payes
  const caPrevisionnel = revenueBookings
    .filter((b) => b.payment_status === 'pending' && (b.status === 'upcoming' || b.status === 'pending'))
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0)

  // Pour l'affichage : encaisse + acomptes comme "reel"
  const weekRevenue = caEncaisse + caAcomptes
  const weekRevenuePrevision = weekRevenue + caPrevisionnel

  return NextResponse.json({
    todayCount: todayRes.count ?? 0,
    weekCount: weekRes.count ?? 0,
    pendingCount: pendingRes.count ?? 0,
    weekRevenue,
    weekRevenuePrevision,
    caEncaisse,
    caAcomptes,
    caPrevisionnel,
  })
}
