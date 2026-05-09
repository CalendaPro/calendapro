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

  // Get unique clients from bookings - sélectionner UNIQUEMENT les champs nécessaires
  // Pas d'email, téléphone ou autres données personnelles sensibles
  const { data: bookings } = await supabase
    .from('bookings')
    .select('client_id, pro_name, client_name, scheduled_at, status')
    .eq('pro_id', userId)
    .not('client_id', 'is', null)
    .order('created_at', { ascending: false })

  if (!bookings) return NextResponse.json([])

  // Deduplicate by client_id - ne retourner que les champs publics/nécessaires
  const seen = new Set<string>()
  const clients = bookings
    .filter(b => b.client_id && !seen.has(b.client_id) && seen.add(b.client_id))
    .map(b => ({ 
      user_id: b.client_id, 
      name: b.client_name || b.pro_name || 'Client',
      last_booking: b.scheduled_at,
      status: b.status
    }))

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