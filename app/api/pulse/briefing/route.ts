import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildAndStoreBriefing, getLatestBriefing } from '@/lib/pulse/briefing'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const briefing = await getLatestBriefing(userId)
    if (!briefing) {
      return NextResponse.json({ briefing: null, message: 'Aucun briefing disponible' })
    }
    return NextResponse.json({ briefing })
  } catch (e) {
    logger.error('[API:Pulse:Briefing] GET error:', e)
    return NextResponse.json(
      { error: 'Erreur récupération briefing' },
      { status: 500 }
    )
  }
}

// POST = generate / regenerate today's briefing
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  // Fetch pro name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const proName = profile?.full_name ?? 'Professionnel'

  try {
    const briefing = await buildAndStoreBriefing(userId, proName)
    return NextResponse.json({ briefing })
  } catch (e) {
    logger.error('[API:Pulse:Briefing] POST error:', e)
    return NextResponse.json(
      { error: 'Erreur génération briefing' },
      { status: 500 }
    )
  }
}
