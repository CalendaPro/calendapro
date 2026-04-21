import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('waitlist')
    .select('*')
    .eq('client_id', userId)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { pro_id, pro_username, client_name, client_email, client_phone, service_name, preferred_day, preferred_time } = body

  if (!pro_id || !pro_username) {
    return NextResponse.json({ error: 'pro_id et pro_username requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('waitlist')
    .upsert(
      {
        pro_id,
        pro_username,
        client_id: userId,
        client_name: client_name ?? null,
        client_email: client_email ?? null,
        client_phone: client_phone ?? null,
        service_name: service_name ?? null,
        preferred_day: preferred_day ?? null,
        preferred_time: preferred_time ?? null,
        status: 'waiting',
      },
      { onConflict: 'pro_id,client_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { pro_id } = await request.json()
  if (!pro_id) return NextResponse.json({ error: 'pro_id requis' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  await supabase
    .from('waitlist')
    .delete()
    .eq('pro_id', pro_id)
    .eq('client_id', userId)

  return NextResponse.json({ success: true })
}
