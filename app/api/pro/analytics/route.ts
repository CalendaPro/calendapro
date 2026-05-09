import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const plan = await getUserPlan(userId)
  if (plan === 'free') {
    return NextResponse.json({ error: 'Plan Premium requis', upgrade: true }, { status: 403 })
  }

  const url = new URL(req.url)
  const weekOffset = parseInt(url.searchParams.get('week') ?? '0', 10)

  const supabase = createServerSupabaseClient()

  // Date range: current week + offset
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(weekStart.getDate() - 7)

  const [bookingsRes, prevBookingsRes, clientsRes, revenueRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, scheduled_at, price, status, client_id, payment_status, deposit_amount, payment_method')
      .eq('pro_id', userId)
      .gte('scheduled_at', weekStart.toISOString())
      .lt('scheduled_at', weekEnd.toISOString()),
    supabase
      .from('bookings')
      .select('id, scheduled_at, price, status, payment_status, deposit_amount')
      .eq('pro_id', userId)
      .gte('scheduled_at', prevWeekStart.toISOString())
      .lt('scheduled_at', weekStart.toISOString()),
    plan === 'infinity'
      ? supabase
          .from('bookings')
          .select('client_id, scheduled_at, status')
          .eq('pro_id', userId)
          .order('scheduled_at', { ascending: false })
          .limit(200)
      : Promise.resolve({ data: null }),
    // CalendaPay: Revenus réels via RPC
    supabase.rpc('calculate_pro_revenue', {
      p_pro_id: userId,
      p_start_date: weekStart.toISOString(),
      p_end_date: weekEnd.toISOString(),
    }),
  ])

  const bookings = bookingsRes.data ?? []
  const prevBookings = prevBookingsRes.data ?? []

  // CalendaPay: Revenus réels incluant acomptes et paiements
  const revenueData = revenueRes.data ?? {
    total_revenue: 0,
    deposit_revenue: 0,
    stripe_payments: 0,
    wallet_payments: 0,
    refunded_amount: 0,
    net_revenue: 0,
  }

  // Revenue this week (net avec acomptes)
  const ACTIVE_STATUSES = ['upcoming', 'completed']
  const baseRevenue = bookings
    .filter(b => ACTIVE_STATUSES.includes(b.status))
    .reduce((s, b) => s + (b.price ?? 0), 0)

  // Vrai CA: base + acomptes payés
  const weekRevenue = Math.round(revenueData.net_revenue ?? baseRevenue)

  // Stats CalendaPay
  const depositRevenue = Math.round(revenueData.deposit_revenue ?? 0)
  const stripePayments = Math.round(revenueData.stripe_payments ?? 0)
  const walletPayments = Math.round(revenueData.wallet_payments ?? 0)
  const refundedAmount = Math.round(revenueData.refunded_amount ?? 0)

  // Semaine précédente pour comparaison
  const prevRevenue = prevBookings
    .filter(b => ACTIVE_STATUSES.includes(b.status))
    .reduce((s, b) => s + (b.price ?? 0), 0)

  const revenueGrowth = prevRevenue > 0
    ? Math.round(((weekRevenue - prevRevenue) / prevRevenue) * 100)
    : 0

  // Confirmation rate (upcoming = booked but not yet confirmed; completed = done)
  const confirmed = bookings.filter(b => ACTIVE_STATUSES.includes(b.status)).length
  const confirmRate = bookings.length > 0 ? Math.round((confirmed / bookings.length) * 100) : 0

  // Build heatmap: day x hour occupation
  const HOURS = [9, 10, 11, 12, 14, 15, 16, 17, 18]
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
  const heatmap: { hour: number; day: string; booked: boolean }[] = []

  for (const hour of HOURS) {
    for (let d = 0; d < 5; d++) {
      const dayDate = new Date(weekStart)
      dayDate.setDate(weekStart.getDate() + d)
      const booked = bookings.some(b => {
        if (!b.scheduled_at || !ACTIVE_STATUSES.includes(b.status)) return false
        const dt = new Date(b.scheduled_at)
        return (
          dt.toISOString().split('T')[0] === dayDate.toISOString().split('T')[0] &&
          dt.getHours() === hour
        )
      })
      heatmap.push({ hour, day: DAYS[d], booked })
    }
  }

  // Lost revenue: unbooked slots at avg service price
  const avgPrice = confirmed > 0 ? weekRevenue / confirmed : 60
  const emptySlots = heatmap.filter(c => !c.booked).length
  const lostRevenue = Math.round(emptySlots * avgPrice * 0.3)

  // Client radar (infinity only)
  let clientRadar: {
    client_id: string
    visits: number
    lastVisit: string | null
    atRisk: boolean
  }[] = []

  if (plan === 'infinity' && clientsRes.data) {
    const byClient: Record<string, { visits: number; dates: string[] }> = {}
    for (const b of clientsRes.data) {
      if (!b.client_id) continue
      if (!byClient[b.client_id]) byClient[b.client_id] = { visits: 0, dates: [] }
      byClient[b.client_id].visits++
      if (b.scheduled_at) byClient[b.client_id].dates.push(b.scheduled_at)
    }
    const now = Date.now()
    clientRadar = Object.entries(byClient)
      .map(([id, d]) => {
        const sorted = d.dates.sort().reverse()
        const lastVisit = sorted[0] ?? null
        const daysSince = lastVisit
          ? Math.floor((now - new Date(lastVisit).getTime()) / 86400000)
          : 9999
        return {
          client_id: id,
          visits: d.visits,
          lastVisit,
          atRisk: daysSince > 45,
        }
      })
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10)
  }

  return NextResponse.json({
    weekRevenue,
    revenueGrowth,
    confirmRate,
    totalBookings: bookings.length,
    heatmap,
    lostRevenue,
    emptySlots,
    clientRadar,
    weekStart: weekStart.toISOString(),
    // CalendaPay metrics
    calendapay: {
      depositRevenue,
      stripePayments,
      walletPayments,
      refundedAmount,
      paidBookings: bookings.filter(b => b.payment_status === 'paid').length,
      pendingPayments: bookings.filter(b => b.payment_status === 'pending').length,
    },
  })
}
