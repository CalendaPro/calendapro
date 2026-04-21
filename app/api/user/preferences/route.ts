import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('theme_mode, accent_color_override, pro_layout, client_layout')
    .eq('id', userId)
    .maybeSingle()

  // Unified Modern layout is the only option now
  return NextResponse.json({
    theme_mode: data?.theme_mode ?? 'auto',
    accent_color_override: data?.accent_color_override ?? null,
    pro_layout: 'modern',
    client_layout: 'modern',
  })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    theme_mode?: string
    accent_color_override?: string | null
    pro_layout?: string
    client_layout?: string
    theme_pack_id?: string
  }

  const updates: Record<string, unknown> = {}

  // Only theme_mode and accent_color are now customizable
  // Layout is unified to Modern Premium
  if (body.theme_mode !== undefined) {
    if (!['light', 'dark', 'auto'].includes(body.theme_mode)) {
      return NextResponse.json({ error: 'Valeur invalide pour theme_mode' }, { status: 400 })
    }
    updates.theme_mode = body.theme_mode
  }

  if ('accent_color_override' in body) {
    updates.accent_color_override = body.accent_color_override ?? null
  }

  // Layout fields are deprecated - always 'modern' now
  // Accept but ignore pro_layout and client_layout for backwards compatibility
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error('[preferences PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
