import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('client_id', userId)
    .maybeSingle()

  // Return defaults if no row yet
  return NextResponse.json(data ?? {
    client_id: userId,
    email_24h: true,
    email_1h: false,
    sms_24h: false,
    sms_1h: false,
    sms_phone: null,
    push_notifications: true,
    email_frequency: 'immediate',
  })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    email_24h?: boolean
    email_1h?: boolean
    sms_24h?: boolean
    sms_1h?: boolean
    sms_phone?: string | null
    push_notifications?: boolean
    email_frequency?: string
  }

  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('reminder_settings')
    .upsert({
      client_id: userId,
      ...body,
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
