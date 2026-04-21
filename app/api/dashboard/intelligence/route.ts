import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get('days')) || 90

  const supabase = createServerSupabaseClient()
  const now = new Date()

  // Fenetre dynamique pour les calculs historiques (parametre days)
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - days)

  // 7 prochains jours pour la prediction
  const sevenDaysLater = new Date(now)
  sevenDaysLater.setDate(now.getDate() + 7)

  const [historicalRes, upcomingRes, cancelledRes] = await Promise.all([
    // Bookings completes et payes (periode dynamique)
    supabase
      .from('bookings')
      .select('id, service_name, price, deposit_amount, payment_status, status, client_id, scheduled_at, duration_minutes')
      .eq('pro_id', userId)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', now.toISOString())
      .in('status', ['completed', 'upcoming', 'no_show', 'cancelled']),

    // RDV a venir 7 prochains jours (pour prediction)
    supabase
      .from('bookings')
      .select('id, service_name, price, deposit_amount, scheduled_at')
      .eq('pro_id', userId)
      .gt('scheduled_at', now.toISOString())
      .lte('scheduled_at', sevenDaysLater.toISOString())
      .in('status', ['upcoming', 'pending']),

    // Annulations et no-shows (CA perdu)
    supabase
      .from('bookings')
      .select('id, price, deposit_amount, status, scheduled_at')
      .eq('pro_id', userId)
      .gte('scheduled_at', startDate.toISOString())
      .in('status', ['cancelled', 'no_show']),
  ])

  const historical = historicalRes.data ?? []
  const upcoming = upcomingRes.data ?? []
  const cancelled = cancelledRes.data ?? []

  // --- CALCUL 1 : Panier moyen par client ---
  const clientSpend: Record<string, { total: number; count: number }> = {}
  for (const b of historical) {
    if (b.status === 'cancelled' || b.status === 'no_show') continue
    const amount = b.payment_status === 'paid'
      ? Number(b.price) || 0
      : Number(b.deposit_amount) || 0
    if (amount === 0 || !b.client_id) continue
    if (!clientSpend[b.client_id]) clientSpend[b.client_id] = { total: 0, count: 0 }
    clientSpend[b.client_id].total += amount
    clientSpend[b.client_id].count += 1
  }
  const clientValues = Object.values(clientSpend)
  const avgBasket =
    clientValues.length > 0
      ? clientValues.reduce((s, c) => s + c.total / c.count, 0) / clientValues.length
      : 0
  const uniqueClientCount = clientValues.length

  // --- CALCUL 2 : CA perdu (annulations + no-shows) ---
  const lostRevenue = cancelled.reduce((sum, b) => {
    // Si un acompte a ete conserve, on ne compte que le reste non percu
    const fullPrice = Number(b.price) || 0
    const depositKept = b.status === 'cancelled' ? 0 : Number(b.deposit_amount) || 0
    return sum + Math.max(0, fullPrice - depositKept)
  }, 0)

  const cancelledCount = cancelled.filter((b) => b.status === 'cancelled').length
  const noShowCount = cancelled.filter((b) => b.status === 'no_show').length

  // --- CALCUL 3 : Top 3 services les plus rentables ---
  const serviceStats: Record<
    string,
    { name: string; totalRevenue: number; bookingCount: number; avgPrice: number }
  > = {}

  for (const b of historical) {
    if (b.status === 'cancelled' || b.status === 'no_show') continue
    const svc = b.service_name || 'Service sans nom'
    const amount =
      b.payment_status === 'paid' ? Number(b.price) || 0 : Number(b.deposit_amount) || 0
    if (!serviceStats[svc]) {
      serviceStats[svc] = { name: svc, totalRevenue: 0, bookingCount: 0, avgPrice: 0 }
    }
    serviceStats[svc].totalRevenue += amount
    serviceStats[svc].bookingCount += 1
  }

  const topServices = Object.values(serviceStats)
    .map((s) => ({ ...s, avgPrice: s.bookingCount > 0 ? s.totalRevenue / s.bookingCount : 0 }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3)

  // --- CALCUL 4 : Prediction CA 7 prochains jours ---
  // Base : RDV confirmes * leur prix (ou depot)
  const confirmedRevenue = upcoming.reduce((sum, b) => {
    return sum + (Number(b.price) || 0)
  }, 0)

  // Taux de completion historique (sur periode)
  const completedBookings = historical.filter((b) => b.status === 'completed')
  const totalNonCancelled = historical.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'no_show'
  )
  const completionRate =
    totalNonCancelled.length > 0
      ? completedBookings.length / totalNonCancelled.length
      : 0.92 // defaut 92%

  const predictedRevenue = confirmedRevenue * completionRate

  // Breakdown par jour pour la prediction
  const predictionByDay: { date: string; label: string; bookingCount: number; expectedRevenue: number }[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const dayStr = d.toLocaleDateString('fr-CA') // YYYY-MM-DD local
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

    const dayBookings = upcoming.filter((b) => {
      const bDate = new Date(b.scheduled_at).toLocaleDateString('fr-CA')
      return bDate === dayStr
    })

    predictionByDay.push({
      date: dayStr,
      label: dayLabel,
      bookingCount: dayBookings.length,
      expectedRevenue:
        dayBookings.reduce((s, b) => s + (Number(b.price) || 0), 0) * completionRate,
    })
  }

  // --- CALCUL 5 : Taux de confirmation reel ---
  const totalBookingsPeriod = historical.length
  const confirmedBookingsPeriod = historical.filter(
    (b) => b.status === 'completed' || b.status === 'upcoming'
  ).length
  const confirmationRate =
    totalBookingsPeriod > 0 ? (confirmedBookingsPeriod / totalBookingsPeriod) * 100 : 0

  // --- CALCUL 6 : Taux no-show reel ---
  const noShowRate =
    totalBookingsPeriod > 0 ? (noShowCount / totalBookingsPeriod) * 100 : 0

  // --- CALCUL 6b : Analyse des créneaux horaires populaires ---
  const slotAnalysis: Record<string, number> = {}
  for (const b of historical) {
    if (b.status === 'cancelled' || b.status === 'no_show') continue
    const hour = new Date(b.scheduled_at).getHours()
    const slot = `${hour}h`
    slotAnalysis[slot] = (slotAnalysis[slot] ?? 0) + 1
  }

  const topSlots = Object.entries(slotAnalysis)
    .map(([slot, count]) => ({ slot, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // --- CALCUL 7 : Données période précédente (comparaison) ---
  const prevStart = new Date(startDate)
  prevStart.setDate(prevStart.getDate() - days)
  const prevEnd = new Date(startDate)

  const { data: prevHistorical } = await supabase
    .from('bookings')
    .select('id, status, price, deposit_amount, payment_status')
    .eq('pro_id', userId)
    .gte('scheduled_at', prevStart.toISOString())
    .lte('scheduled_at', prevEnd.toISOString())
    .in('status', ['completed', 'upcoming', 'cancelled', 'no_show'])

  // Calcule les métriques précédentes
  const prevTotal = (prevHistorical ?? []).length
  const prevCompleted = (prevHistorical ?? []).filter(
    b => b.status === 'completed' || b.status === 'upcoming'
  ).length
  const prevConfirmRate = prevTotal > 0
    ? Math.round((prevCompleted / prevTotal) * 100)
    : 0

  return NextResponse.json({
    // Panier moyen
    avgBasket: Math.round(avgBasket * 100) / 100,
    uniqueClientCount,

    // CA perdu
    lostRevenue: Math.round(lostRevenue * 100) / 100,
    cancelledCount,
    noShowCount,

    // Top services
    topServices,

    // Prediction
    predictedRevenue: Math.round(predictedRevenue * 100) / 100,
    confirmedUpcomingRevenue: confirmedRevenue,
    predictionByDay,
    completionRate: Math.round(completionRate * 100),

    // Performance reelle
    confirmationRate: Math.round(confirmationRate * 10) / 10,
    noShowRate: Math.round(noShowRate * 10) / 10,
    totalBookings90d: totalBookingsPeriod,

    // Comparaison période précédente
    confirmationRatePrev: prevConfirmRate,
    totalBookingsPrev: prevTotal,

    // Top créneaux horaires
    topSlots,
  })
}
