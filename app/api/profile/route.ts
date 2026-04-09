import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  const plan = await getUserPlan(userId)

  if (error) {
    console.error('profile GET:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ...(data ?? {}), plan })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { username, full_name, bio, email, role, onboarding_completed } = body
  if (!username) return NextResponse.json({ error: 'Username requis' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username,
      full_name,
      bio,
      email,
      role,
      onboarding_completed,
    })
    .select()
    .single()

  if (error) {
    console.error('profile POST:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
