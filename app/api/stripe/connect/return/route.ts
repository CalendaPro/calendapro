import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('account_id')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''

  if (!accountId) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?section=integrations&connect_error=missing_account`)
  }

  try {
    // Retrieve the account to check its status
    const account = await stripe.accounts.retrieve(accountId)

    const charges_enabled = account.charges_enabled ?? false
    const payouts_enabled = account.payouts_enabled ?? false
    const onboarding_complete = charges_enabled && payouts_enabled

    // Update the profile with the Connect status
    const supabase = createServerSupabaseClient()
    await supabase
      .from('profiles')
      .update({
        stripe_connect_id: accountId,
        stripe_connect_onboarding: onboarding_complete,
        stripe_connect_charges: charges_enabled,
        stripe_connect_payouts: payouts_enabled,
      })
      .eq('stripe_connect_id', accountId)

    if (onboarding_complete) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/settings?section=integrations&connect_success=true`
      )
    } else {
      // Onboarding incomplete — redirect back with a notice
      return NextResponse.redirect(
        `${appUrl}/dashboard/settings?section=integrations&connect_incomplete=true`
      )
    }
  } catch (err) {
    logger.error('[Connect Return] Erreur:', err)
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?section=integrations&connect_error=retrieval_failed`
    )
  }
}
