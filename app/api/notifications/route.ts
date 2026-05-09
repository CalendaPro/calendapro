import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limitStr = searchParams.get('limit') ?? '30'
  const limit = Math.min(parseInt(limitStr, 10) || 30, 100)

  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('notifications')
    .select('id, type, title, message, read, action_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const notifications = data ?? []
  const unreadCount = notifications.filter(n => !n.read).length

  return NextResponse.json({ notifications, unread_count: unreadCount })
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    id?: string
    mark_all_read?: boolean
  }

  const supabase = createServerSupabaseClient()

  if (body.mark_all_read) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (body.id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', body.id)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'id ou mark_all_read requis' }, { status: 400 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    user_id?: string
    type?: string
    title?: string
    message?: string
    action_url?: string
    _secret?: string
  }

  if (body._secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { user_id, type, title, message, action_url } = body

  if (!user_id || !type || !title) {
    return NextResponse.json({ error: 'user_id, type et title requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id, type, title, message, action_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
