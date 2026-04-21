import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('favorites')
    .select('pro_id, pro_username, created_at')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) return NextResponse.json([])

  // Enrich with profile data
  const proIds = data.map(f => f.pro_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, category, city, avatar_url')
    .in('id', proIds)

  const profileMap: Record<string, typeof profiles extends (infer T)[] | null ? T : never> = {}
  profiles?.forEach(p => { profileMap[p.id] = p })

  const enriched = data.map(f => ({
    ...f,
    profile: profileMap[f.pro_id] ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { pro_id, pro_username } = await request.json()
  if (!pro_id || !pro_username) {
    return NextResponse.json({ error: 'pro_id et pro_username requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Toggle: if already a favorite → remove; otherwise → add
  const { data: existing } = await supabase
    .from('favorites')
    .select('client_id')
    .eq('client_id', userId)
    .eq('pro_id', pro_id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('client_id', userId)
      .eq('pro_id', pro_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'removed' })
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ client_id: userId, pro_id, pro_username })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: 'added' }, { status: 201 })
}
