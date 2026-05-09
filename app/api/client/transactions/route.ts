import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/client/transactions — Récupérer l'historique des transactions Stripe
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerSupabaseClient()

    // Récupérer les transactions du client depuis la table client_transactions
    const { data: transactions, error, count } = await supabase
      .from('client_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Erreur récupération transactions client:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculer les totaux
    const totalSpent = transactions
      ?.filter(t => t.status === 'succeeded' || t.status === 'partially_refunded')
      .reduce((sum, t) => sum + (t.amount - (t.refunded_amount || 0)), 0) || 0

    const totalRefunded = transactions
      ?.reduce((sum, t) => sum + (t.refunded_amount || 0), 0) || 0

    return NextResponse.json({
      transactions: transactions || [],
      totalCount: count || 0,
      totalSpent,
      totalRefunded,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })

  } catch (err) {
    logger.error('Erreur API client transactions:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
