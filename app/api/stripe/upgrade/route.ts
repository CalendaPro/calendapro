import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { priceId } = await request.json()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!subscription?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Pas d\'abonnement actif' }, { status: 400 })
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripe_subscription_id
  )

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    items: [{
      id: stripeSubscription.items.data[0].id,
      price: priceId,
    }],
    proration_behavior: 'create_prorations',
  })

  return NextResponse.json({ success: true })
}