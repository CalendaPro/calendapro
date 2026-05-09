import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ ok: false })

  const body = await request.json().catch(() => ({})) as { query?: string; results_count?: number }
  const query = body.query?.trim()
  if (!query || query.length < 2) return NextResponse.json({ ok: false })

  const supabase = createServerSupabaseClient()

  await supabase.from('search_history').insert({
    client_id: userId,
    query,
    results_count: body.results_count ?? null,
  })

  // Keep only the 10 most recent searches per client
  const { data: old } = await supabase
    .from('search_history')
    .select('id, created_at')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (old && old.length > 10) {
    const toDelete = old.slice(10).map(r => r.id)
    await supabase.from('search_history').delete().in('id', toDelete)
  }

  return NextResponse.json({ ok: true })
}
