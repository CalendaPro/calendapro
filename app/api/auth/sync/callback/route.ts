import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/auth/sync/callback
 *
 * Callback après succès du paiement Stripe Checkout.
 * Met à jour le profil utilisateur et redirige vers l'onboarding.
 *
 * Query params:
 *   - session_id: Stripe Checkout Session ID
 *   - planId: Plan sélectionné
 */
export async function GET(request: NextRequest) {
  console.log('✅ STRIPE CALLBACK - Payment success')

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const planId = searchParams.get('planId')

  if (!sessionId) {
    console.error('❌ Missing session_id')
    return NextResponse.redirect(new URL('/auth-error?error=missing_session', request.url))
  }

  try {
    // Récupérer la session Stripe pour confirmer le paiement
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      console.error('❌ Payment not completed:', session.payment_status)
      return NextResponse.redirect(new URL('/plans?payment=failed', request.url))
    }

    const userId = session.metadata?.userId
    const planIdFromMetadata = session.metadata?.planId

    if (!userId) {
      console.error('❌ Missing userId in session metadata')
      return NextResponse.redirect(new URL('/auth-error?error=missing_user', request.url))
    }

    // Mettre à jour la subscription dans Supabase
    const supabase = createServerSupabaseClient()

    // Vérifier si une subscription existe déjà
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingSub) {
      // Mettre à jour
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan: planIdFromMetadata || planId,
          status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ Error updating subscription:', updateError)
      } else {
        console.log('✅ Subscription updated - Premium activated:', { userId, planId: planIdFromMetadata || planId })
      }
    } else {
      // Créer
      const { error: insertError } = await supabase.from('subscriptions').insert({
        user_id: userId,
        plan: planIdFromMetadata || planId,
        status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })

      if (insertError) {
        console.error('❌ Error creating subscription:', insertError)
      } else {
        console.log('✅ Subscription created - Premium activated:', { userId, planId: planIdFromMetadata || planId })
      }
    }

    // Rediriger vers l'onboarding avec paramètre de succès
    const redirectUrl = new URL('/onboarding', request.url)
    redirectUrl.searchParams.set('upgrade', 'success')
    redirectUrl.searchParams.set('plan', planIdFromMetadata || planId || '')

    console.log('🚀 Redirecting to onboarding with success')
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('❌ Error in stripe callback:', error)
    return NextResponse.redirect(new URL('/auth-error?error=callback', request.url))
  }
}
