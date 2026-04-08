import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getUserPlan } from '@/lib/subscription'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const plan = await getUserPlan(userId)
  if (plan === 'free') {
    return NextResponse.json({ error: 'Plan payant requis' }, { status: 403 })
  }

  const { priceId, credits } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'Prix requis' }, { status: 400 })
  if (credits == null || Number.isNaN(Number(credits))) {
    return NextResponse.json({ error: 'Nombre de crédits requis' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL manquant' }, { status: 500 })
  }

  const meta: Record<string, string> = {
    userId,
    credits: String(credits),
    type: 'sms_credits',
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/sms?success=true&credits=${credits}`,
      cancel_url: `${appUrl}/dashboard/sms`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('stripe sms-checkout', e)
    return NextResponse.json({ error: 'Paiement indisponible' }, { status: 500 })
  }
}