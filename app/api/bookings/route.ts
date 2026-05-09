import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { normalizeBookingPaymentSettings } from '@/lib/booking-payment-settings'
import { getUserPlan } from '@/lib/subscription'
import { cookies } from 'next/headers'
import { parseSourceCookie } from '@/lib/tracking/detect'
import { isValidSlotTime } from '@/lib/booking-conflict'
import { checkPersistentRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Rate limiting persistant via Supabase (Fix #12) - remplace le Map en mémoire
async function checkRateLimit(key: string, maxPerMinute = 20): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result = await checkPersistentRateLimit(key, {
    maxRequests: maxPerMinute,
    windowMs: 60 * 1000, // 1 minute
  })
  return { allowed: result.allowed, retryAfter: result.retryAfter }
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // upcoming | completed | cancelled | all
  const isPro = searchParams.get('pro') === 'true'

  const supabase = createServerSupabaseClient()

  if (isPro) {
    // Récupère les bookings du pro (pro_id = Clerk user ID dans ce schéma)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('pro_id', userId)
      .order('scheduled_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Récupérer l'email Clerk du user connecté pour matcher les réservations anonymes
  let clerkEmail: string | null = null
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    clerkEmail = clerkUser.emailAddresses[0]?.emailAddress ?? null
  } catch {}

  // Construire les filtres : client_id = userId OU client_id = email
  const filters = [userId]
  if (clerkEmail) filters.push(clerkEmail)

  let query = supabase
    .from('bookings')
    .select('*')
    .in('client_id', filters)
    .order('scheduled_at', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Rate limiting persistant : max 20 creations par minute par utilisateur (Fix #12)
  const rateLimit = await checkRateLimit(`booking_create_${userId}`, 20)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: 'Trop de requetes. Veuillez patienter.',
        retryAfter: rateLimit.retryAfter 
      },
      { 
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter ?? 60) }
      }
    )
  }

  const body = await request.json()
  const {
    pro_id, pro_username, pro_name, service_name, service_id,
    scheduled_at, duration_minutes, price, notes, payment_completed,
    utm_source, utm_medium, utm_campaign,
    // Pro dashboard manual booking fields
    title, date, duration, client_id, client_name,
  } = body
  
  // Récupérer la source de tracking depuis les cookies
  const cookieStore = await cookies()
  const sourceCookie = cookieStore.get('calendapro_source')?.value
  const trackingData = sourceCookie ? parseSourceCookie(sourceCookie) : null
  
  // Priorité: UTM params from body > cookie > default 'direct'
  const sourceChannel = utm_source || trackingData?.source || 'direct'

  // Mode création manuelle par le pro (champs simplifiés depuis le dashboard)
  if (title !== undefined || date !== undefined) {
    if (!title || !date) {
      return NextResponse.json({ error: 'title et date requis pour la création pro' }, { status: 400 })
    }
    const supabase = createServerSupabaseClient()

    // Validation heure : les minutes doivent être un multiple de 5
    const normalizedDate = new Date(date).toISOString()
    if (!isValidSlotTime(normalizedDate)) {
      return NextResponse.json(
        { error: 'L\'heure doit être un multiple de 5 minutes (ex : 9h00, 9h15, 9h30…)' },
        { status: 400 }
      )
    }

    // Vérifier les limites du plan avec la nouvelle fonction mensuelle
    const plan = await getUserPlan(userId)
    const { data: limitCheck, error: limitError } = await supabase.rpc('can_create_booking', {
      p_pro_id: userId,
      p_plan: plan
    })
    
    if (limitError) {
      logger.error('[Bookings] Error checking plan limit:', limitError)
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

    // Création via RPC atomique create_booking_safe
    const { data, error: insertError } = await supabase.rpc('create_booking_safe', {
      p_pro_id:         userId,
      p_client_id:      client_id || userId,
      p_client_id_type: client_id
        ? (client_id.startsWith('user_') ? 'clerk_uid' : 'email')
        : 'clerk_uid',
      p_service_name:   title,
      p_scheduled_at:   normalizedDate,
      p_duration_mins:  duration ?? 60,
      p_price:          null,
      p_deposit_amount: null,
      p_notes:          notes ?? null,
      p_source_channel: 'pro_dashboard',
      p_pro_name:       client_name || null,
      p_pro_username:   '',
      p_payment_status: 'pending',
      p_stripe_session: null,
    })

    if (insertError) {
      if (insertError.message?.includes('SLOT_CONFLICT') || (insertError as { code?: string }).code === 'P0001') {
        return NextResponse.json({ error: 'Ce créneau est déjà occupé.' }, { status: 409 })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/calendar', 'page')

    return NextResponse.json({
      id: data.id,
      title: data.service_name,
      date: data.scheduled_at,
      duration: data.duration_minutes || 60,
      status: 'confirmed',
      price: Number(data.price) || 0,
    }, { status: 201 })
  }

  if (!pro_id || !pro_username || !scheduled_at) {
    return NextResponse.json({ error: 'Champs requis manquants (pro_id, pro_username, scheduled_at)' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Validation heure : les minutes doivent être un multiple de 5
  if (!isValidSlotTime(scheduled_at)) {
    return NextResponse.json(
      { error: 'L\'heure doit être un multiple de 5 minutes (ex : 9h00, 9h15, 9h30…)' },
      { status: 400 }
    )
  }

  // Vérifier si le pro a activé le paiement obligatoire
  const { data: proProfile } = await supabase
    .from('profiles')
    .select('online_payment_enabled, deposit_required, deposit_type, deposit_value, allow_full_online_payment')
    .eq('id', pro_id)
    .single()

  if (proProfile) {
    const settings = normalizeBookingPaymentSettings(proProfile)
    const paymentRequired = settings.online_payment_enabled && settings.deposit_required
    
    // Si paiement obligatoire et pas de confirmation de paiement, refuser
    if (paymentRequired && !payment_completed) {
      return NextResponse.json({ 
        error: 'Paiement requis. Ce professionnel exige un acompte pour les réservations.' 
      }, { status: 403 })
    }
  }

  // Création via RPC atomique create_booking_safe (pas besoin d'anti-collision séparé)
  const { data, error } = await supabase.rpc('create_booking_safe', {
    p_pro_id:         pro_id,
    p_client_id:      userId,
    p_client_id_type: userId.startsWith('user_') ? 'clerk_uid' : 'email',
    p_service_name:   service_name || 'Rendez-vous',
    p_scheduled_at:   scheduled_at,
    p_duration_mins:  duration_minutes ?? 60,
    p_price:          price ?? null,
    p_deposit_amount: null,
    p_notes:          notes ?? null,
    p_source_channel: sourceChannel,
    p_pro_name:       pro_name || null,
    p_pro_username:   pro_username,
    p_payment_status: payment_completed ? 'paid' : 'pending',
    p_stripe_session: null,
  })

  if (error) {
    if (error.message?.includes('SLOT_CONFLICT') || (error as { code?: string }).code === 'P0001') {
      return NextResponse.json({ error: 'Ce créneau est déjà occupé.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Increment marketplace referral counter if booking originated from public marketplace
  if (sourceChannel && sourceChannel.includes('marketplace')) {
    await supabase.rpc('increment_marketplace_referral', { pro_id }).then(null, () => {})
  }

  revalidatePath('/dashboard/calendar', 'page')
  revalidatePath('/dashboard', 'layout')

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id et status requis' }, { status: 400 })

  const validStatuses = ['upcoming', 'pending', 'completed', 'cancelled', 'no_show']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .eq('client_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
