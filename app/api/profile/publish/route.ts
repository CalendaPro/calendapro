import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const plan = await getUserPlan(userId)
  if (!plan) return NextResponse.json({ error: 'Plan introuvable' }, { status: 500 })

  // Optionnel : on laisse le front envoyer template/accent/bio pour garantir la cohérence au moment du publish
  const body = (await request.json().catch(() => ({}))) as {
    template?: 'minimal' | 'visual' | 'direct'
    accentColor?: string
    bio?: string
  }

  if (plan !== 'infinity' && body.template && body.template !== 'minimal') {
    return NextResponse.json({ error: 'Template réservé au plan Infinity' }, { status: 403 })
  }
  if (plan === 'free' && body.accentColor && body.accentColor !== '#7c3aed') {
    return NextResponse.json({ error: 'Palette réservée au plan Premium/Infinity' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {
    is_published: true,
    published_at: now,
  }

  if (body.template) updates.template = body.template
  if (body.accentColor) updates.accent_color = body.accentColor
  if (typeof body.bio === 'string') updates.bio = body.bio

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error('profile/publish:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, published_at: now })
}

