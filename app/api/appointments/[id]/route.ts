import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { date, duration } = body as { date?: string; duration?: number }

  if (date === undefined && duration === undefined) {
    return NextResponse.json({ error: 'date ou duration requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const updates: Record<string, unknown> = {}
  if (date !== undefined) updates.date = date
  if (duration !== undefined) updates.duration = duration

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
