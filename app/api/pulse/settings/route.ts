import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { PulseSettings } from '@/lib/pulse/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_settings')
    .select('*')
    .eq('pro_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // No settings yet — return defaults
    return NextResponse.json({
      pro_id: userId,
      smart_reminders_enabled: true,
      dynamic_pricing_enabled: false,
      daily_briefing_enabled: true,
      briefing_delivery: 'email',
      reminder_channel: 'email',
      reminder_lookahead_days: 7,
    } satisfies Partial<PulseSettings>)
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_settings')
    .upsert(
      {
        pro_id: userId,
        smart_reminders_enabled: body.smart_reminders_enabled ?? true,
        dynamic_pricing_enabled: body.dynamic_pricing_enabled ?? false,
        daily_briefing_enabled: body.daily_briefing_enabled ?? true,
        briefing_delivery: body.briefing_delivery ?? 'email',
        reminder_channel: body.reminder_channel ?? 'email',
        reminder_lookahead_days: body.reminder_lookahead_days ?? 7,
      },
      { onConflict: 'pro_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
