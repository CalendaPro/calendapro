import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan, type Plan } from '@/lib/subscription'

/** CalendaPro platform commission: 5% for starter/free plans */
export const PLATFORM_FEE_PERCENT_STARTER = 5

/** Commission pour plans payants : 0% */
export const PLATFORM_FEE_PERCENT_PAID = 0

/**
 * Determine platform fee percent based on pro's plan.
 * - Starter/Free: 5%
 * - Premium/Infinity: 0%
 */
export function getPlatformFeePercent(plan: Plan): number {
  return plan === 'free' ? PLATFORM_FEE_PERCENT_STARTER : PLATFORM_FEE_PERCENT_PAID
}

/**
 * Compute platform fee in cents from a total amount in cents and pro's plan.
 * - Starter/Free: 5% commission
 * - Premium/Infinity: 0% commission
 */
export function computePlatformFee(amountCents: number, plan: Plan = 'free'): number {
  const percent = getPlatformFeePercent(plan)
  return Math.round(amountCents * (percent / 100))
}

/**
 * Async version that fetches the pro's plan from DB and computes fee.
 */
export async function computePlatformFeeAsync(proId: string, amountCents: number): Promise<number> {
  const plan = await getUserPlan(proId)
  return computePlatformFee(amountCents, plan)
}

/**
 * Look up a pro's Stripe Connect account ID from their profile.
 * Returns null if Connect is not set up.
 */
export async function getProConnectId(proId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('stripe_connect_id, stripe_connect_charges')
    .eq('id', proId)
    .maybeSingle()

  if (!data?.stripe_connect_id || !data?.stripe_connect_charges) return null
  return data.stripe_connect_id
}

/**
 * Check whether a pro has completed Stripe Connect onboarding
 * by refreshing their status from Stripe API.
 */
export async function refreshConnectStatus(proId: string) {
  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_id')
    .eq('id', proId)
    .maybeSingle()

  if (!profile?.stripe_connect_id) {
    return { connected: false, charges_enabled: false, payouts_enabled: false, onboarding_complete: false }
  }

  const account = await stripe.accounts.retrieve(profile.stripe_connect_id)
  const charges_enabled = account.charges_enabled ?? false
  const payouts_enabled = account.payouts_enabled ?? false
  const onboarding_complete = charges_enabled && payouts_enabled

  // Sync status to DB
  await supabase
    .from('profiles')
    .update({
      stripe_connect_onboarding: onboarding_complete,
      stripe_connect_charges: charges_enabled,
      stripe_connect_payouts: payouts_enabled,
    })
    .eq('id', proId)

  return {
    connected: true,
    charges_enabled,
    payouts_enabled,
    onboarding_complete,
    stripe_connect_id: profile.stripe_connect_id,
  }
}

/**
 * Log a Connect transaction to our DB.
 */
export async function logConnectTransaction(params: {
  proId: string
  stripePaymentId: string
  stripeTransferId?: string
  amount: number
  platformFee: number
  netAmount: number
  currency?: string
  status?: string
  clientName?: string
  clientEmail?: string
  bookingId?: string
  paymentType?: string
  metadata?: Record<string, unknown>
  plan?: Plan
}) {
  const supabase = createServerSupabaseClient()
  await supabase.from('connect_transactions').insert({
    pro_id: params.proId,
    stripe_payment_id: params.stripePaymentId,
    stripe_transfer_id: params.stripeTransferId || null,
    amount: params.amount,
    platform_fee: params.platformFee,
    net_amount: params.netAmount,
    currency: params.currency || 'eur',
    status: params.status || 'succeeded',
    client_name: params.clientName || null,
    client_email: params.clientEmail || null,
    booking_id: params.bookingId || null,
    payment_type: params.paymentType || 'booking',
    plan: params.plan || 'free',
    metadata: params.metadata || {},
  })
}
