// Supabase Edge Function — Pulse Dynamic Pricing
// Cron: every hour → finds empty slots + creates discount entries
// Deploy: supabase functions deploy pulse-dynamic-pricing

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmptySlot {
  pro_id: string
  rule_id: string
  service_id: string
  service_name: string
  slot_time: string
  original_price: number
  discount_percent: number
  discounted_price: number
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1. Expire past slots
    const { data: expiredCount } = await supabase.rpc('pulse_expire_old_slots')
    console.log(`Expired slots: ${expiredCount ?? 0}`)

    // 2. Find new empty slots across all pros with pricing enabled
    const { data: emptySlots, error } = await supabase.rpc(
      'pulse_find_empty_slots',
      { target_pro_id: null }
    )

    if (error) {
      throw new Error(`Empty slot scan failed: ${error.message}`)
    }

    const slots = (emptySlots as EmptySlot[]) ?? []
    console.log(`Empty slots found: ${slots.length}`)

    if (slots.length === 0) {
      return new Response(
        JSON.stringify({
          expired: expiredCount ?? 0,
          created: 0,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Bulk insert discounted slots
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
      throw new Error(`Slot insert failed: ${insertError.message}`)
    }

    const result = {
      expired: expiredCount ?? 0,
      created: inserts.length,
      by_pro: Object.entries(
        slots.reduce<Record<string, number>>((acc, s) => {
          acc[s.pro_id] = (acc[s.pro_id] ?? 0) + 1
          return acc
        }, {})
      ).map(([pro_id, count]) => ({ pro_id, slots: count })),
      timestamp: new Date().toISOString(),
    }

    console.log('Dynamic Pricing complete:', JSON.stringify(result))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Edge Function error:', e)
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
