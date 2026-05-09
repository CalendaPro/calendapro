import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'username required' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data: pro } = await supabase
      .from('profiles')
      .select('full_name, username, category, avatar_url, city, plan')
      .ilike('username', username)
      .eq('role', 'pro')
      .maybeSingle()

    if (!pro) {
      return NextResponse.json({ pro: null })
    }

    return NextResponse.json({ pro })
  } catch {
    return NextResponse.json({ pro: null })
  }
}
