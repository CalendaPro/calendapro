import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { toUiStatus, toDbStatus } from '@/lib/booking-status'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Helper pour récupérer le pro_id depuis le user_id Clerk
async function getProId(supabase: ReturnType<typeof createServerSupabaseClient>, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return profile?.id || userId
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const supabase = createServerSupabaseClient()
    const proId = await getProId(supabase, userId)

    // Récupérer le booking sans jointure problématique
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        pro_id,
        pro_name,
        service_name,
        scheduled_at,
        duration_minutes,
        price,
        deposit_amount,
        payment_status,
        payment_method,
        status,
        notes,
        cancellation_reason,
        created_at,
        source_channel
      `)
      .eq('id', id)
      .eq('pro_id', proId)
      .maybeSingle()

    if (error) {
      logger.error('[Calendar API] GET by ID error:', error)
      return NextResponse.json({ error: 'Erreur de base de données', details: error.message }, { status: 500 })
    }
    if (!booking) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    // Récupérer le client séparément
    let clientProfile: { user_id?: string; name?: string; phone?: string } | null = null
    if (booking.client_id) {
      const { data: clientData } = await supabase
        .from('client_profiles')
        .select('user_id, name, phone')
        .eq('user_id', booking.client_id)
        .maybeSingle()
      clientProfile = clientData
    }

    // Mapper au format attendu par le frontend
    const clientName = clientProfile?.name || booking.pro_name || 'Client'

    return NextResponse.json({
      id: booking.id,
      title: booking.service_name || `RDV avec ${clientName}`,
      client_name: clientName,
      client_id: booking.client_id,
      date: booking.scheduled_at,
      duration: booking.duration_minutes || 60,
      status: toUiStatus(booking.status),
      notes: booking.notes,
      cancellation_reason: booking.cancellation_reason,
      price: Number(booking.price) || 0,
      deposit_amount: Number(booking.deposit_amount) || 0,
      payment_status: booking.payment_status || 'pending',
      payment_method: booking.payment_method,
      source: booking.source_channel,
      created_at: booking.created_at,
      client: clientProfile,
    })
  } catch (err) {
    logger.error('[Calendar API] GET by ID exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { date, duration, status, notes, cancellation_reason } = body as { 
      date?: string
      duration?: number
      status?: string
      notes?: string 
      cancellation_reason?: string
    }

    if (date === undefined && duration === undefined && status === undefined && notes === undefined && cancellation_reason === undefined) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const proId = await getProId(supabase, userId)
    
    const updates: Record<string, unknown> = {}
    if (date !== undefined) updates.scheduled_at = new Date(date).toISOString() // Format ISO garanti
    if (duration !== undefined) updates.duration_minutes = duration
    if (notes !== undefined) updates.notes = notes
    if (cancellation_reason !== undefined) updates.cancellation_reason = cancellation_reason
    if (status !== undefined) {
      updates.status = toDbStatus(status)
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .eq('pro_id', proId) // Sécurité : vérifie l'appartenance
      .select()
      .single()

    if (error) {
      logger.error('[Calendar API] PATCH error:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour', details: error.message }, { status: 500 })
    }
    
    // Mapper la réponse au format attendu
    return NextResponse.json({
      id: data.id,
      title: data.service_name,
      date: data.scheduled_at,
      duration: data.duration_minutes,
      status: toUiStatus(data.status),
      notes: data.notes,
      price: Number(data.price) || 0,
    })
  } catch (err) {
    logger.error('[Calendar API] PATCH exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
