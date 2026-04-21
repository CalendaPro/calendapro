import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('client_profiles').upsert({
    user_id: userId,
    source: body.source || null,
    source_other: body.sourceOther || null,
    referrer_name: body.referrerName || null,
    interests: body.interests ?? [],
    city: body.city || null,
    search_radius: body.radius ?? 10,
    include_online: body.includeOnline ?? false,
    available_times: body.availableTimes ?? [],
    phone: body.phone || null,
    sms_reminders: body.smsReminders ?? true,
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) {
    console.error('client-onboarding error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
