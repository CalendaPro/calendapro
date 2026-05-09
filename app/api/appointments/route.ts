import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'
import { toUiStatus } from '@/lib/booking-status'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Schema validation pour POST /api/appointments
const createAppointmentSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Trop long'),
  date: z.string().datetime({ message: 'Date invalide' }),
  duration: z.number().int().min(5).max(480).default(60),
  notes: z.string().max(2000).optional(),
  client_id: z.string().optional(),
  client_name: z.string().max(100).optional(),
})

// Schema validation pour DELETE /api/appointments
const deleteAppointmentSchema = z.object({
  id: z.string().uuid('ID invalide'),
})

// NOTE: userId IS pro_id directement (confirmé par architecture)
// Pas besoin de getProId() — la colonne profiles.id == Clerk userId

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabase = createServerSupabaseClient()
    // userId IS pro_id directement (profiles.id == Clerk userId)

    // Lire depuis bookings
    const { data: bookings, error } = await supabase
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
        created_at,
        source_channel
      `)
      .eq('pro_id', userId)
      .order('scheduled_at', { ascending: true })

    if (error) {
      logger.error('[Calendar API] GET error:', error)
      return NextResponse.json({ error: 'Erreur de base de données', details: error.message }, { status: 500 })
    }

    // Récupérer les noms des clients séparément
    const clientIds = [...new Set((bookings || []).map(b => b.client_id).filter(Boolean))]
    let clientNames: Record<string, string> = {}
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('client_profiles')
        .select('user_id, name')
        .in('user_id', clientIds)
      clientNames = Object.fromEntries((clients || []).map(c => [c.user_id, c.name]))
    }

    // Mapper les données au format attendu par le frontend (ISO dates)
    const mappedData = (bookings || []).map(booking => {
      const clientName = clientNames[booking.client_id] || booking.pro_name || 'Client'

      return {
        id: booking.id,
        title: booking.service_name || `RDV avec ${clientName}`,
        client_name: clientName,
        client_id: booking.client_id,
        date: booking.scheduled_at, // Déjà au format ISO depuis Supabase
        duration: booking.duration_minutes || 60,
        status: toUiStatus(booking.status),
        notes: booking.notes,
        price: Number(booking.price) || 0,
        deposit_amount: Number(booking.deposit_amount) || 0,
        payment_status: booking.payment_status || 'pending',
        payment_method: booking.payment_method,
        source: booking.source_channel,
        created_at: booking.created_at,
      }
    })

    return NextResponse.json(mappedData)
  } catch (err) {
    logger.error('[Calendar API] GET exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    
 // Validation Zod des entrées
    const parseResult = createAppointmentSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: parseResult.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
      }, { status: 400 })
    }
    
    const { title, date, duration, notes, client_id, client_name } = parseResult.data

 // Validation anti-passé : empêcher la création de RDV dans le passé
    const appointmentDate = new Date(date)
    const now = new Date()
    if (appointmentDate < now) {
      return NextResponse.json(
        { error: 'Impossible de créer un rendez-vous dans le passé' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    // userId IS pro_id directement

 // Vérification de la limite selon le plan (mensuel)
    const plan = await getUserPlan(userId)
    const { data: limitCheck, error: limitError } = await supabase.rpc('can_create_booking', {
      p_pro_id: userId,
      p_plan: plan
    })
    
    if (limitError) {
      logger.error('[Appointments] Error checking plan limit:', limitError)
      return NextResponse.json({ error: 'Erreur de vérification des limites' }, { status: 500 })
    }
    
    if (limitCheck && !(limitCheck as { can_create: boolean }).can_create) {
      const limitInfo = limitCheck as { 
        can_create: boolean
        used: number
        limit: number
        reset_at: string 
        message: string
      }
      return NextResponse.json({ 
        error: limitInfo.message || 'Limite atteinte pour le plan Starter',
        details: {
          used: limitInfo.used,
          limit: limitInfo.limit,
          resetAt: limitInfo.reset_at,
          upgrade: true
        }
      }, { status: 403 })
    }

    // Si client_id fourni, récupérer le nom du client
    let finalClientId = client_id || userId
    let finalProName = client_name || title
    
    if (client_id) {
      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('name')
        .eq('user_id', client_id)
        .maybeSingle()
      if (clientProfile?.name) {
        finalProName = clientProfile.name
      }
    }

    // Création via RPC atomique create_booking_safe
    const { data, error } = await supabase.rpc('create_booking_safe', {
      p_pro_id:         userId,
      p_client_id:      finalClientId,
      p_client_id_type: finalClientId.startsWith('user_')
        ? 'clerk_uid'
        : finalClientId.includes('@')
        ? 'email'
        : 'temp',
      p_service_name:   title,
      p_scheduled_at:   new Date(date).toISOString(),
      p_duration_mins:  duration || 60,
      p_price:          null,
      p_deposit_amount: null,
      p_notes:          notes || null,
      p_source_channel: 'pro_dashboard',
      p_pro_name:       finalProName,
      p_pro_username:   '',
      p_payment_status: 'pending',
      p_stripe_session: null,
    })

    if (error) {
      if (error.message?.includes('SLOT_CONFLICT') || (error as { code?: string }).code === 'P0001') {
        return NextResponse.json(
          { error: 'Ce créneau est déjà occupé.' },
          { status: 409 }
        )
      }
      logger.error('[Calendar API] POST error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création', details: error.message },
        { status: 500 }
      )
    }
    
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
    logger.error('[Calendar API] POST exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    
    // Validation Zod des entrées
    const parseResult = deleteAppointmentSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: parseResult.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
      }, { status: 400 })
    }
    
    const { id } = parseResult.data

    const supabase = createServerSupabaseClient()
    // userId IS pro_id directement

    // Sécurité + Soft Delete : marquer comme cancelled, pas de hard delete
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Supprimé par le pro',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('pro_id', userId)

    if (error) {
      logger.error('[Calendar API] DELETE (soft) error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, status: 'cancelled' })
  } catch (err) {
    logger.error('[Calendar API] DELETE exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}