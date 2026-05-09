import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getPatternsByPro, getReminderLog } from '@/lib/pulse/patterns'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view')

  try {
    if (view === 'log') {
      const log = await getReminderLog(userId, 50)
      return NextResponse.json({ log })
    }

    // Default: return client patterns
    const patterns = await getPatternsByPro(userId)

    const summary = {
      total: patterns.length,
      active: patterns.filter((p) => p.status === 'active').length,
      churned: patterns.filter((p) => p.status === 'churned').length,
      high_confidence: patterns.filter((p) => p.confidence_score >= 0.7).length,
      needs_reminder: patterns.filter(
        (p) =>
          p.status === 'active' &&
          p.next_expected_at &&
          new Date(p.next_expected_at) <= new Date()
      ).length,
    }

    return NextResponse.json({ patterns, summary })
  } catch (e) {
    logger.error('[API:Pulse:Reminders] GET error:', e)
    return NextResponse.json(
      { error: 'Erreur récupération patterns' },
      { status: 500 }
    )
  }
}
