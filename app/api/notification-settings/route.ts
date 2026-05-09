import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  return NextResponse.json(data ?? {})
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: userId,
      sms_confirmation: body.smsConfirmation,
      sms_24h_before: body.sms24hBefore,
      sms_2h_before: body.sms2hBefore,
      sms_no_show: body.smsNoShow,
      sms_last_minute: body.smsLastMinute,
      email_confirmation: body.emailConfirmation,
      email_24h_before: body.email24hBefore,
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}