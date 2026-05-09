import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { normalizeBookingPaymentSettings } from '@/lib/booking-payment-settings'
import { computePlatformFee } from '@/lib/stripe-connect'
import { getUserPlan, type Plan } from '@/lib/subscription'
import { checkRateLimit, stripeRateLimits } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const MIN_EUR = 0.5
const MAX_EUR = 50_000

function roundMoneyEur(eur: number) {
  return Math.round(eur * 100) / 100
}

export async function POST(request: Request) {
  // Rate limiting: max 10 req/minute par IP
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`checkout:${clientIp}`, stripeRateLimits.checkout)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer dans une minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    )
  }

  const body = await request.json()
  const {
    username,
    clientName,
    clientEmail,
    clientPhone,
    date,
    notes,
    estimatedServiceTotalEur,
    paymentChoice,
    source_channel,
    durationMinutes,
  } = body

  if (!username || !clientName || !date) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL manquant' }, { status: 500 })
  }

  const supabase = createServerSupabaseClient()
 logger.info(`[booking-checkout] Recherche du pro: ${username}`)
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, username, full_name, online_payment_enabled, deposit_required, deposit_type, deposit_value, allow_full_online_payment, stripe_connect_id, stripe_connect_charges, account_status, deleted_at'
    )
    .ilike('username', username)
    .maybeSingle()

  if (error) {
 logger.error(`[booking-checkout] Erreur Supabase:`, error)
    return NextResponse.json({ error: 'Erreur base de données', details: error.message }, { status: 500 })
  }
  
  if (!profile) {
 logger.error(`[booking-checkout] Profil introuvable: ${username}`)
    return NextResponse.json({ error: 'Professionnel introuvable' }, { status: 404 })
  }
  
  // Vérifier que le compte pro est actif
  const accountStatus = (profile as { account_status?: string }).account_status || 'active'
  const isDeleted = (profile as { deleted_at?: string | null }).deleted_at !== null
  
  if (accountStatus === 'deleted' || accountStatus === 'pending_deletion' || isDeleted) {
 logger.error(`[booking-checkout] Compte pro supprimé ou en suppression: ${username}`)
    return NextResponse.json({ 
      error: 'Ce professionnel n\'est plus disponible',
      code: 'PRO_ACCOUNT_DELETED'
    }, { status: 410 })
  }
  
  if (accountStatus === 'suspended') {
 logger.error(`[booking-checkout] Compte pro suspendu: ${username}`)
    return NextResponse.json({ 
      error: 'Ce compte est temporairement suspendu',
      code: 'PRO_ACCOUNT_SUSPENDED'
    }, { status: 403 })
  }
  
 logger.info(`[booking-checkout] Profil trouvé: ${profile.username}`)

  const s = normalizeBookingPaymentSettings(profile)

  if (!s.online_payment_enabled) {
    return NextResponse.json(
      { error: 'Paiement en ligne non proposé par ce professionnel' },
      { status: 403 }
    )
  }

  if (!s.deposit_required && !s.allow_full_online_payment) {
    return NextResponse.json(
      { error: 'Aucun montant à encaisser en ligne (configurez un acompte ou le paiement intégral).' },
      { status: 400 }
    )
  }

  let effectiveChoice: 'deposit' | 'full'

  if (!s.deposit_required && s.allow_full_online_payment) {
    effectiveChoice = 'full'
  } else if (s.deposit_required && !s.allow_full_online_payment) {
    effectiveChoice = 'deposit'
  } else {
    if (paymentChoice !== 'deposit' && paymentChoice !== 'full') {
      return NextResponse.json(
        { error: 'Choix de paiement requis : acompte ou paiement intégral' },
        { status: 400 }
      )
    }
    effectiveChoice = paymentChoice
  }

  let amountEur = 0

  if (effectiveChoice === 'full') {
    const total = Number(estimatedServiceTotalEur)
    if (!Number.isFinite(total) || total < MIN_EUR) {
      return NextResponse.json(
        { error: 'Montant estimé de la prestation requis (minimum 0,50 €)' },
        { status: 400 }
      )
    }
    amountEur = roundMoneyEur(Math.min(MAX_EUR, total))
  } else if (s.deposit_type === 'fixed') {
    amountEur = roundMoneyEur(s.deposit_value)
  } else {
    const total = Number(estimatedServiceTotalEur)
    if (!Number.isFinite(total) || total < MIN_EUR) {
      return NextResponse.json(
        { error: 'Montant estimé requis pour calculer l acompte (pourcentage)' },
        { status: 400 }
      )
    }
    const cap = roundMoneyEur(total * (s.deposit_value / 100))
    amountEur = roundMoneyEur(Math.min(MAX_EUR, cap))
  }

  if (amountEur < MIN_EUR) {
    return NextResponse.json(
      { error: 'Montant trop faible pour un paiement par carte (minimum 0,50 €)' },
      { status: 400 }
    )
  }

  const unitAmount = Math.round(amountEur * 100)
  const paymentLabel =
    effectiveChoice === 'full'
      ? `Paiement intégral ${amountEur.toFixed(2).replace('.', ',')} €`
      : s.deposit_type === 'percent'
        ? `Acompte ${s.deposit_value}% (${amountEur.toFixed(2).replace('.', ',')} €)`
        : `Acompte ${amountEur.toFixed(2).replace('.', ',')} €`

  const meta: Record<string, string> = {
    type: 'booking_deposit',
    username: String(username),
    clientName: String(clientName),
    clientEmail: String(clientEmail || ''),
    clientPhone: String(clientPhone || ''),
    date: String(date),
    notes: String(notes || ''),
    paymentKind: effectiveChoice,
    amountEur: String(amountEur),
    paymentLabel,
    serviceName: notes?.includes('Service:') ? notes.split('Service:')[1]?.split('\n')[0]?.trim() || '' : '',
    sourceChannel: String(source_channel || ''),
    proId: String(profile.id),
    scheduledAt: String(date),
    durationMinutes: String(durationMinutes || 60),
  }

  // Stripe Connect: route funds to pro's connected account
  const hasConnect = !!(profile.stripe_connect_id && profile.stripe_connect_charges)
  const connectAccountId = hasConnect ? (profile.stripe_connect_id as string) : null

  // Récupérer le plan du pro pour calculer la commission
  const proPlan: Plan = await getUserPlan(profile.id)
  const platformFee = hasConnect ? computePlatformFee(unitAmount, proPlan) : 0

  logger.info(`[booking-checkout] Plan pro: ${proPlan}, Commission: ${platformFee / 100}€, Connect: ${hasConnect}`)

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réservation — ${profile.full_name || username}`,
              description: paymentLabel,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&username=${encodeURIComponent(username)}`,
      cancel_url: `${appUrl}/${encodeURIComponent(username)}?booking=cancel`,
      metadata: meta,
      payment_intent_data: {
        metadata: meta,
        ...(connectAccountId
          ? {
              application_fee_amount: platformFee,
              transfer_data: { destination: connectAccountId },
            }
          : {}),
      },
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    logger.error('stripe booking-checkout', err)
    return NextResponse.json({ error: 'Paiement indisponible' }, { status: 500 })
  }
}
