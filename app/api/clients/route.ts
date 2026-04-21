import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  // Get unique clients from bookings (not from legacy clients table)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('client_id, pro_name')
    .eq('pro_id', userId)
    .not('client_id', 'is', null)
    .order('created_at', { ascending: false })

  if (!bookings) return NextResponse.json([])

  // Deduplicate by client_id
  const seen = new Set<string>()
  const clients = bookings
    .filter(b => b.client_id && !seen.has(b.client_id) && seen.add(b.client_id))
    .map(b => ({ user_id: b.client_id, name: b.pro_name || b.client_id }))

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name, email, phone } = await request.json()
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: userId, name, email, phone })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await request.json()

  const supabase = createServerSupabaseClient()
  await supabase.from('clients').delete().eq('id', id).eq('user_id', userId)
  return NextResponse.json({ success: true })
}