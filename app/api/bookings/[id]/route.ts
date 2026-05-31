import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkBookingConflict, isValidSlotTime } from '@/lib/booking-conflict'
import { toUiStatus, toDbStatus } from '@/lib/booking-status'
import { logger } from '@/lib/logger'
import { sendBookingConfirmation } from '@/lib/emails'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const supabase = createServerSupabaseClient()

    // Récupérer le profil pour savoir si c'est un pro ou un client
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    const isPro = !!profile

    // Construire la requête selon le rôle
    let bookingQuery = supabase
      .from('bookings')
      .select(`
        id, client_id, pro_id, pro_name, service_name,
        scheduled_at, duration_minutes, price, deposit_amount,
        payment_status, payment_method, status, notes,
        cancellation_reason, created_at, source_channel,
        amount_paid, stripe_receipt_url, stripe_payment_intent_id,
        stripe_checkout_session_id, refunded_at, refund_amount
      `)
      .eq('id', id)

    // Si pro: filtrer par pro_id, si client: par client_id (email comme user_id temporaire)
    if (isPro) {
      bookingQuery = bookingQuery.eq('pro_id', userId)
    }
    // Note: pour les clients, on vérifie le client_id après coup car client_id peut être null
    // et le vrai user_id du client est souvent son email ou son clerk_id

    const { data: booking, error } = await bookingQuery.maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!booking) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    // Vérifier que le client a accès à ce booking (si pas pro)
    if (!isPro && booking.client_id && booking.client_id !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    let clientProfile: { user_id?: string; name?: string; phone?: string } | null = null
    if (booking.client_id) {
      const { data } = await supabase
        .from('client_profiles')
        .select('user_id, name, phone')
        .eq('user_id', booking.client_id)
        .maybeSingle()
      clientProfile = data
    }

    const clientName = clientProfile?.name || booking.pro_name || 'Client'

    return NextResponse.json({
      id: booking.id,
      title: booking.service_name || `RDV avec ${clientName}`,
      service_name: booking.service_name || 'Rendez-vous',
      scheduled_at: booking.scheduled_at,
      pro_name: booking.pro_name,
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
      // Champs Stripe Connect
      amount_paid: booking.amount_paid || 0,
      stripe_receipt_url: booking.stripe_receipt_url,
      stripe_payment_intent_id: booking.stripe_payment_intent_id,
      stripe_checkout_session_id: booking.stripe_checkout_session_id,
      refunded_at: booking.refunded_at,
      refund_amount: booking.refund_amount || 0,
    })
  } catch (err) {
    logger.error('[Bookings API] GET by ID exception:', err)
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

    // When rescheduling, validate time and check for conflicts
    if (date !== undefined) {
      const normalizedDate = new Date(date).toISOString()
      if (!isValidSlotTime(normalizedDate)) {
        return NextResponse.json(
          { error: 'L\'heure doit être un multiple de 5 minutes (ex : 9h00, 9h15, 9h30…)' },
          { status: 400 }
        )
      }
      const durationToCheck = duration ?? 60
      const conflict = await checkBookingConflict(supabase, userId, normalizedDate, durationToCheck, id)
      if (conflict) {
        return NextResponse.json(
          { error: 'Ce créneau est déjà occupé.' },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, unknown> = {}
    if (date !== undefined) updates.scheduled_at = new Date(date).toISOString()
    if (duration !== undefined) updates.duration_minutes = duration
    if (notes !== undefined) updates.notes = notes
    if (cancellation_reason !== undefined) updates.cancellation_reason = cancellation_reason
    if (status !== undefined) {
      updates.status = toDbStatus(status)
    }
    updates.updated_at = new Date().toISOString()

    // Fetch booking before update to get client info for email
    let bookingBeforeUpdate: { client_email?: string | null; client_name?: string | null; pro_name?: string | null; scheduled_at?: string | null; service_name?: string | null } | null = null
    if (status === 'confirmed') {
      const { data: existing } = await supabase
        .from('bookings')
        .select('client_email, client_name, pro_name, scheduled_at, service_name')
        .eq('id', id)
        .eq('pro_id', userId)
        .maybeSingle()
      bookingBeforeUpdate = existing
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .eq('pro_id', userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send confirmation email to client when pro confirms
    if (status === 'confirmed' && bookingBeforeUpdate?.client_email) {
      try {
        await sendBookingConfirmation({
          clientEmail: bookingBeforeUpdate.client_email,
          clientName: bookingBeforeUpdate.client_name || 'Client',
          professionalName: bookingBeforeUpdate.pro_name || 'Professionnel',
          date: bookingBeforeUpdate.scheduled_at || data.scheduled_at,
        })
        logger.info('[Bookings PATCH] Email confirmation envoyé à', bookingBeforeUpdate.client_email)
      } catch (emailErr) {
        logger.error('[Bookings PATCH] Erreur email confirmation:', emailErr)
      }
    }

    revalidatePath('/dashboard', 'layout')

    return NextResponse.json({
      id: data.id,
      title: data.service_name,
      date: data.scheduled_at,
      duration: data.duration_minutes || 60,
      status: toUiStatus(data.status),
      notes: data.notes,
      price: Number(data.price) || 0,
    })
  } catch (err) {
    logger.error('[Bookings API] PATCH exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const supabase = createServerSupabaseClient()

    // Soft-delete: never hard-delete bookings — mark as cancelled instead
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('pro_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/calendar', 'page')

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[Bookings API] DELETE exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
