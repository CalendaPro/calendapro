import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get pro profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const proId = profile.id

    // Get bookings from last 30 days with source tracking
    const { data: bookings } = await supabase
      .from('bookings')
      .select('price, deposit_amount, payment_status, payment_method, status, source_channel, created_at')
      .eq('pro_id', proId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .in('status', ['upcoming', 'completed', 'confirmed'])

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        marketplaceRevenue: 0,
        marketplacePercentage: 0,
        averageBasket: 0,
        basketBySource: [],
        emptySlotsLost: 0,
        emptySlotsValue: 0,
        period: 30,
        calendapay: {
          depositRevenue: 0,
          stripePayments: 0,
          walletPayments: 0,
          refundedAmount: 0,
          paidBookings: 0,
          pendingPayments: 0,
        },
      })
    }

    // Calculate total revenue (real CA) - including CalendaPay deposits
    const baseRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0)
    const depositRevenue = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.deposit_amount || 0), 0)
    const totalRevenue = baseRevenue + depositRevenue

    // CalendaPay metrics
    const stripePayments = bookings
      .filter(b => b.payment_status === 'paid' && (b.payment_method === 'stripe' || !b.payment_method))
      .reduce((sum, b) => sum + (b.deposit_amount || 0), 0)
    const walletPayments = bookings
      .filter(b => b.payment_status === 'paid' && b.payment_method === 'wallet')
      .reduce((sum, b) => sum + (b.deposit_amount || 0), 0)
    const refundedAmount = bookings
      .filter(b => b.payment_status === 'refunded')
      .reduce((sum, b) => sum + (b.deposit_amount || 0), 0)

    // Calculate marketplace revenue
    const marketplaceBookings = bookings.filter(
      b => b.source_channel === 'marketplace_internal' || b.source_channel === 'marketplace'
    )
    const marketplaceRevenue = marketplaceBookings.reduce((sum, b) => sum + (b.price || 0) + (b.deposit_amount || 0), 0)
    const marketplacePercentage = totalRevenue > 0
      ? Math.round((marketplaceRevenue / totalRevenue) * 100)
      : 0

    // Calculate average basket
    const averageBasket = totalRevenue / bookings.length

    // Calculate basket by source
    const sourceMap = new Map<string, { amount: number; count: number; clientSet: Set<string> }>()
    bookings.forEach(booking => {
      const source = booking.source_channel || 'direct'
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { amount: 0, count: 0, clientSet: new Set() })
      }
      const data = sourceMap.get(source)!
      data.amount += (booking.price || 0) + (booking.deposit_amount || 0)
      data.count += 1
    })

    const basketBySource = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source: formatSourceName(source),
      amount: Math.round(data.amount / data.count),
      clientCount: data.count,
    })).sort((a, b) => b.amount - a.amount)

    // Calculate empty slots lost (estimate based on availability gaps)
    const { data: availability } = await supabase
      .from('availability_slots')
      .select('date, is_booked, price')
      .eq('pro_id', proId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lt('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())

    const emptySlots = availability?.filter(a => !a.is_booked) || []
    const emptySlotsLost = emptySlots.length
    const emptySlotsValue = emptySlots.reduce((sum, s) => sum + (s.price || 0), 0)

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      marketplaceRevenue: Math.round(marketplaceRevenue),
      marketplacePercentage,
      averageBasket: Math.round(averageBasket),
      basketBySource,
      emptySlotsLost,
      emptySlotsValue: Math.round(emptySlotsValue),
      period: 30,
      // CalendaPay metrics
      calendapay: {
        depositRevenue: Math.round(depositRevenue),
        stripePayments: Math.round(stripePayments),
        walletPayments: Math.round(walletPayments),
        refundedAmount: Math.round(refundedAmount),
        paidBookings: bookings.filter(b => b.payment_status === 'paid').length,
        pendingPayments: bookings.filter(b => b.payment_status === 'pending').length,
      },
    })
  } catch (error) {
    console.error('Error fetching financial metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatSourceName(source: string): string {
  const map: Record<string, string> = {
    'direct': 'Direct',
    'marketplace_internal': 'Marketplace',
    'marketplace': 'Marketplace',
    'instagram': 'Instagram',
    'tiktok': 'TikTok',
    'facebook': 'Facebook',
    'google': 'Google',
    'email': 'Email',
    'referral': 'Parrainage',
  }
  return map[source] || source.charAt(0).toUpperCase() + source.slice(1)
}
