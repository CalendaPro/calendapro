import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const POPULAR_CATEGORIES = [
 { id: 'barbier', label: 'Barbier', emoji: '' },
 { id: 'coach', label: 'Coach', emoji: '' },
 { id: 'photo', label: 'Photographe', emoji: '' },
 { id: 'therapeute', label: 'Thérapeute', emoji: '' },
 { id: 'sport', label: 'Coach sportif', emoji: '' },
 { id: 'consultant', label: 'Consultant', emoji: '' },
 { id: 'creatif', label: 'Créatif', emoji: '' },
 { id: 'freelance', label: 'Freelance', emoji: '' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (!q) {
    // Return popular searches when empty
    const { data: popular } = await supabase
      .from('search_history')
      .select('query')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
      .limit(200)

    const freq: Record<string, number> = {}
    for (const row of popular ?? []) {
      freq[row.query] = (freq[row.query] ?? 0) + 1
    }
    const popularSearches = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([query]) => ({ query }))

    return NextResponse.json({ categories: [], cities: [], popular: popularSearches })
  }

  const ql = q.toLowerCase()

  // Category suggestions
  const categories = POPULAR_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(ql) || c.id.includes(ql)
  ).slice(0, 4)

  // City suggestions from profiles DB
  const { data: cityRows } = await supabase
    .from('profiles')
    .select('city')
    .ilike('city', `%${q}%`)
    .not('city', 'is', null)
    .limit(50)

  const uniqueCities = [...new Set(cityRows?.map(r => r.city).filter(Boolean) as string[])]
    .slice(0, 4)
    .map(city => ({ city }))

  // User's recent matching history
  const { userId } = await auth()
  let history: { query: string }[] = []
  if (userId) {
    const { data } = await supabase
      .from('search_history')
      .select('query')
      .eq('client_id', userId)
      .ilike('query', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(5)
    history = data ?? []
  }

  return NextResponse.json({ categories, cities: uniqueCities, history })
}
