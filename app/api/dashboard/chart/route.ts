import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const now = new Date()

  const weekStart = new Date(now)
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  weekStart.setDate(now.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)

  const { data: weekBookings } = await supabase
    .from('bookings')
    .select('scheduled_at, price, deposit_amount, payment_status, status')
    .eq('pro_id', userId)
    .gte('scheduled_at', weekStart.toISOString())
    .neq('status', 'cancelled')

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const chartData = days.map((dayLabel, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dayStr = d.toLocaleDateString('fr-CA') // format YYYY-MM-DD local

    const dayBookings = (weekBookings ?? []).filter(b => {
      const bDate = new Date(b.scheduled_at).toLocaleDateString('fr-CA')
      return bDate === dayStr
    })

    const revenue = dayBookings.reduce((sum, b) => {
      if (b.payment_status === 'paid') return sum + (Number(b.price) || 0)
      if (b.deposit_amount && Number(b.deposit_amount) > 0) {
        return sum + Number(b.deposit_amount)
      }
      return sum
    }, 0)

    return { day: dayLabel, revenue, rdv: dayBookings.length }
  })

  return NextResponse.json(chartData)
}
