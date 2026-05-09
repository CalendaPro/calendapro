import { createServerSupabaseClient } from '@/lib/supabase-server'
import { userHasPlan } from '@/lib/subscription'
import type { PricingRule, DiscountedSlot, PulseEmptySlot } from './types'
import { logger } from '../logger'

const REQUIRED_PLAN = 'infinity' as const

// ── Get or create pricing rule for a pro ────────────────────
export async function getPricingRule(proId: string): Promise<PricingRule | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_pricing_rules')
    .select('*')
    .eq('pro_id', proId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Pricing rule fetch failed: ${error.message}`)
  }

  return data as PricingRule | null
}

// ── Upsert pricing rule ─────────────────────────────────────
export async function upsertPricingRule(
  proId: string,
  rule: Partial<Omit<PricingRule, 'id' | 'pro_id' | 'created_at' | 'updated_at'>>
): Promise<PricingRule> {
  // Gate: Infinity plan only
  const hasAccess = await userHasPlan(proId, REQUIRED_PLAN)
  if (!hasAccess) {
    throw new Error('Dynamic Pricing nécessite le plan Infinity')
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_pricing_rules')
    .upsert(
      { pro_id: proId, ...rule },
      { onConflict: 'pro_id' }
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Pricing rule upsert failed: ${error.message}`)
  }

  return data as PricingRule
}

// ── Run the pricing engine: find empty slots + create discounts ──
export async function runPricingEngine(proId?: string): Promise<{
  slotsCreated: number
  slotsExpired: number
}> {
  const supabase = createServerSupabaseClient()

  // 1. Expire old slots
  const { data: expiredCount } = await supabase.rpc('pulse_expire_old_slots')

  // 2. Find new empty slots
  const { data: emptySlots, error } = await supabase.rpc(
    'pulse_find_empty_slots',
    { target_pro_id: proId ?? null }
  )

  if (error) {
    logger.error('[Pulse:Pricing] Empty slot scan failed:', error.message)
    throw new Error(`Empty slot scan failed: ${error.message}`)
  }

  const slots = (emptySlots as PulseEmptySlot[]) ?? []
  if (slots.length === 0) {
    return { slotsCreated: 0, slotsExpired: expiredCount ?? 0 }
  }

  // 3. Bulk insert new discounted slots
  const inserts = slots.map((s) => ({
    pro_id: s.pro_id,
    rule_id: s.rule_id,
    service_id: s.service_id,
    service_name: s.service_name,
    slot_time: s.slot_time,
    original_price: s.original_price,
    discounted_price: s.discounted_price,
    discount_percent: s.discount_percent,
    booked: false,
    expired: false,
  }))

  const { error: insertError } = await supabase
    .from('pulse_discounted_slots')
    .insert(inserts)

  if (insertError) {
    logger.error('[Pulse:Pricing] Slot insert failed:', insertError.message)
    throw new Error(`Slot insert failed: ${insertError.message}`)
  }

  logger.info(
    `[Pulse:Pricing] Created ${inserts.length} discounted slots, expired ${expiredCount ?? 0}`
  )

  return { slotsCreated: inserts.length, slotsExpired: expiredCount ?? 0 }
}

// ── Get active discounted slots for a pro (public page) ─────
export async function getActiveDiscounts(
  proId: string
): Promise<DiscountedSlot[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_discounted_slots')
    .select('*')
    .eq('pro_id', proId)
    .eq('booked', false)
    .eq('expired', false)
    .gte('slot_time', new Date().toISOString())
    .order('slot_time', { ascending: true })

  if (error) {
    throw new Error(`Active discounts fetch failed: ${error.message}`)
  }

  return (data as DiscountedSlot[]) ?? []
}

// ── Mark a discounted slot as booked ────────────────────────
export async function markSlotBooked(slotId: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('pulse_discounted_slots')
    .update({ booked: true })
    .eq('id', slotId)

  if (error) {
    logger.error('[Pulse:Pricing] Mark booked failed:', error.message)
  }
}

// ── Get pricing stats for dashboard ─────────────────────────
export async function getPricingStats(proId: string) {
  const supabase = createServerSupabaseClient()

  const [active, booked, total] = await Promise.all([
    supabase
      .from('pulse_discounted_slots')
      .select('*', { count: 'exact', head: true })
      .eq('pro_id', proId)
      .eq('booked', false)
      .eq('expired', false),
    supabase
      .from('pulse_discounted_slots')
      .select('*', { count: 'exact', head: true })
      .eq('pro_id', proId)
      .eq('booked', true),
    supabase
      .from('pulse_discounted_slots')
      .select('discounted_price, original_price')
      .eq('pro_id', proId)
      .eq('booked', true),
  ])

  const revenue = (total.data ?? []).reduce(
    (acc, s) => acc + Number(s.discounted_price),
    0
  )
  const savings = (total.data ?? []).reduce(
    (acc, s) => acc + (Number(s.original_price) - Number(s.discounted_price)),
    0
  )

  return {
    active_slots: active.count ?? 0,
    booked_slots: booked.count ?? 0,
    revenue_from_discounts: revenue,
    total_discount_given: savings,
  }
}
