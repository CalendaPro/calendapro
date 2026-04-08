import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'

const PLAN_LIMITS = {
  free: 20,
  premium: Infinity,
  infinity: Infinity,
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { title, date, duration, notes } = await request.json()
  if (!title || !date) {
    return NextResponse.json({ error: 'Titre et date requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // ✅ Vérification de la limite selon le plan
  const plan = await getUserPlan(userId)
  const limit = PLAN_LIMITS[plan]

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count !== null && count >= limit) {
      return NextResponse.json(
        {
          error: `Limite atteinte`,
          message: `Le plan Starter est limité à ${limit} rendez-vous. Passez en Premium pour continuer.`,
          upgrade: true, // ← le front peut détecter ce flag pour afficher une modale d'upgrade
        },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({ user_id: userId, title, date, duration, notes, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const supabase = createServerSupabaseClient()

  // ✅ Le .eq('user_id', userId) empêche de supprimer le RDV de quelqu'un d'autre
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}