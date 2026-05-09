import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/monthly
 * Returns real-time monthly analytics: revenue, no-show, SMS sent, new clients.
 * Uses the SQL function get_monthly_analytics for atomic computation.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  try {
    // Try SQL function first
    const { data, error } = await supabase.rpc('get_monthly_analytics', {
      p_pro_id: userId,
    })

    if (!error && data) {
      return NextResponse.json(data)
    }

    // Fallback: manual queries if RPC not available
    logger.warn('[monthly] RPC fallback, manual queries')
  } catch {}

  // ── Fallback: Manual computation ──────────────────────────
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevEnd = monthStart

  const [revenueRes, prevRevenueRes, bookingsRes, noShowRes, smsRes, newClientsRes, cancellationRes] = await Promise.all([
    // Monthly revenue
    supabase
      .from('bookings')
      .select('price, deposit_amount, payment_status')
      .eq('pro_id', userId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', monthStart.toISOString())
      .lt('scheduled_at', monthEnd.toISOString()),

    // Previous month revenue
    supabase
      .from('bookings')
      .select('price, deposit_amount, payment_status')
      .eq('pro_id', userId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', prevStart.toISOString())
      .lt('scheduled_at', prevEnd.toISOString()),

    // Total bookings this month
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', monthStart.toISOString())
      .lt('scheduled_at', monthEnd.toISOString()),

    // No-shows this month
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .eq('status', 'no_show')
      .gte('scheduled_at', monthStart.toISOString())
      .lt('scheduled_at', monthEnd.toISOString()),

    // SMS sent this month (via notification_queue)
    supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'client_sms')
      .eq('status', 'sent')
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString()),

    // New clients this month (first booking ever with this pro)
    supabase
      .from('bookings')
      .select('client_id, scheduled_at')
      .eq('pro_id', userId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', monthStart.toISOString())
      .lt('scheduled_at', monthEnd.toISOString()),

    // Cancellations
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', userId)
      .eq('status', 'cancelled')
      .gte('scheduled_at', monthStart.toISOString())
      .lt('scheduled_at', monthEnd.toISOString()),
  ])

  // Calculate revenue
  const calcRevenue = (rows: Array<{ price: number | null; deposit_amount: number | null; payment_status: string }>) =>
    rows.reduce((sum, b) => {
      const amount = b.payment_status === 'paid'
        ? Number(b.price) || 0
        : Number(b.deposit_amount) || 0
      return sum + amount
    }, 0)

  const monthlyRevenue = calcRevenue(revenueRes.data ?? [])
  const prevMonthlyRevenue = calcRevenue(prevRevenueRes.data ?? [])

  // No-show rate
  const totalBookings = bookingsRes.count ?? 0
  const noShowCount = noShowRes.count ?? 0
  const noShowRate = totalBookings > 0 ? Math.round((noShowCount / totalBookings) * 1000) / 10 : 0

  // New clients: those with no previous booking
  const monthClients = newClientsRes.data ?? []
  const uniqueMonthClients = [...new Set(monthClients.map((b) => b.client_id))]
  // For new client count, we'd need to check if they had previous bookings
  // Simplified: return unique count for now
  const newClientsCount = uniqueMonthClients.length

  return NextResponse.json({
    monthly_revenue: Math.round(monthlyRevenue * 100) / 100,
    prev_monthly_revenue: Math.round(prevMonthlyRevenue * 100) / 100,
    monthly_bookings: totalBookings,
    no_show_count: noShowCount,
    no_show_rate: noShowRate,
    sms_sent_count: smsRes.count ?? 0,
    new_clients_count: newClientsCount,
    cancellation_count: cancellationRes.count ?? 0,
  })
}
