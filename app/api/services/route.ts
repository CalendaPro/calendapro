import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Helper to check auth
async function getAuthUserId() {
  const { userId } = await auth()
  return userId
}

export async function POST(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json()
  const { name, duration, price, description } = body

  if (!name || !duration || price === undefined) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('services')
    .insert({
      user_id: userId,
      name,
      duration,
      price: Number(price),
      description: description || null,
    })
    .select()
    .single()

  if (error) {
    logger.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json()
  const { id, name, duration, price, description } = body

  if (!id || !name || !duration || price === undefined) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  // Verify ownership
  const { data: existing } = await supabase
    .from('services')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('services')
    .update({
      name,
      duration,
      price: Number(price),
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  // Verify ownership before delete
  const { data: existing } = await supabase
    .from('services')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 })
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    logger.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}