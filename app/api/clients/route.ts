/**
 * Pro CRM - Manual client management
 *
 * GET    -> derives unique client list from bookings (no legacy table needed)
 * POST   -> inserts into legacy `clients` table (pro's private CRM entries)
 * DELETE -> hard-deletes from legacy `clients` table
 *
 * NOTE: The `clients` table is legacy infrastructure, distinct from
 * `client_profiles` (Clerk-authenticated clients). If the table does not
 * exist in Supabase, POST/DELETE will return a graceful error.
 */
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('client_id, client_name, client_email, scheduled_at, status, pro_name')
    .eq('pro_id', userId)
    .or('client_email.not.is.null,client_id.not.is.null')
    .order('scheduled_at', { ascending: false })

  logger.info('[clients] GET userId:', userId)
  logger.info('[clients] bookings found:', bookings?.length ?? 0, bookingsError ? `erreur: ${bookingsError.message}` : 'ok')
  if (bookings?.[0]) logger.info('[clients] first booking:', JSON.stringify(bookings[0]))

  if (!bookings || bookings.length === 0) return NextResponse.json([])

  // Aggregate by client_email (fallback: client_id) for deduplication across bookings
  const map = new Map<string, { name: string; email: string; last_booking: string; total_bookings: number }>()
  for (const b of bookings) {
    const key = b.client_email || b.client_id
    if (!key) continue
    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        name: b.client_name || b.pro_name || 'Client',
        email: b.client_email || (b.client_id?.includes('@') ? b.client_id : ''),
        last_booking: b.scheduled_at,
        total_bookings: 1,
      })
    } else {
      existing.total_bookings++
      if (b.scheduled_at > existing.last_booking) {
        existing.last_booking = b.scheduled_at
      }
      if (!existing.name || existing.name === 'Client') {
        existing.name = b.client_name || b.pro_name || existing.name
      }
    }
  }

  const clients = Array.from(map.entries()).map(([user_id, data]) => ({
    user_id,
    name: data.name,
    email: data.email,
    last_booking: data.last_booking,
    total_bookings: data.total_bookings,
  }))
  logger.info('[clients] GET résultat:', clients.length, 'clients uniques')

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { name, email, phone } = await request.json()
    if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('clients')
      .insert({ user_id: userId, name, email, phone })
      .select()
      .single()

    if (error) {
      logger.error('[CRM] POST /api/clients insert failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    logger.error('[CRM] POST /api/clients unexpected error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { id } = await request.json()
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', userId)
    if (error) {
      logger.error('[CRM] DELETE /api/clients failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[CRM] DELETE /api/clients unexpected error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}