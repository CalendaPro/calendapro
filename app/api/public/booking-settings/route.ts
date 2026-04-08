import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { normalizeBookingPaymentSettings } from '@/lib/booking-payment-settings'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.trim()
  if (!username) {
    return NextResponse.json({ error: 'username requis' }, { status: 400 })
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
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  const settings = normalizeBookingPaymentSettings(profile)

  return NextResponse.json({
    username: profile.username,
    professionalName: profile.full_name,
    ...settings,
  })
}
