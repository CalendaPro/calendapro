// ═══════════════════════════════════════════════════════════════════════════════
// API: Vérification en temps réel des conflits de créneaux (Fix #3)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkBookingConflict } from '@/lib/booking-conflict'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const date = searchParams.get('date')
  const duration = parseInt(searchParams.get('duration') || '60')

  if (!username || !date) {
    return NextResponse.json(
      { error: 'Paramètres requis: username, date' },
      { status: 400 }
    )
  }

  const supabase = createServerSupabaseClient()

  try {
    // Récupérer le pro_id depuis le username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Professionnel introuvable' },
        { status: 404 }
      )
    }

    // Vérifier le conflit
    const hasConflict = await checkBookingConflict(
      supabase,
      profile.id,
      date,
      duration
    )

    return NextResponse.json({
      available: !hasConflict,
      conflict: hasConflict,
      date,
      duration,
      username
    })
  } catch (err) {
    logger.error('[CheckSlot] Erreur:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
