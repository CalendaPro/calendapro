import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { normalizeBookingPaymentSettings } from '@/lib/booking-payment-settings'

const MIN_EUR = 0.5
const MAX_EUR = 50_000

function roundMoneyEur(eur: number) {
  return Math.round(eur * 100) / 100
}

export async function POST(request: Request) {
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
  } = body

  if (!username || !clientName || !date) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL manquant' }, { status: 500 })
  }

  const supabase = createServerSupabaseClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'username, full_name, online_payment_enabled, deposit_required, deposit_type, deposit_value, allow_full_online_payment'
    )
    .eq('username', username)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Professionnel introuvable' }, { status: 404 })
  }

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
  }

  try {
    const session = await stripe.checkout.sessions.create({
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
      success_url: `${appUrl}/${encodeURIComponent(username)}?booking=success`,
      cancel_url: `${appUrl}/${encodeURIComponent(username)}?booking=cancel`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('stripe booking-checkout', err)
    return NextResponse.json({ error: 'Paiement indisponible' }, { status: 500 })
  }
}
