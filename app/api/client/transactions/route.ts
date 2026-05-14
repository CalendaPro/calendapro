import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
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

    // Récupérer l'email du user connecté pour le fallback (réservations anonymes)
    let userEmail: string | null = null
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      userEmail = user.emailAddresses[0]?.emailAddress ?? null
    } catch {
      logger.warn('client/transactions: impossible de récupérer email Clerk')
    }

    // Requête principale par Clerk userId
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

    // Fallback : récupérer aussi les transactions stockées avec l'email comme user_id
    // (réservations anonymes créées avant la création de compte)
    let anonymousTransactions: typeof transactions = []
    if (userEmail) {
      const { data: anonData } = await supabase
        .from('client_transactions')
        .select('*')
        .eq('user_id', userEmail)
        .order('created_at', { ascending: false })

      if (anonData && anonData.length > 0) {
        // Déduplique par id — évite les doublons si migration déjà faite
        const existingIds = new Set((transactions ?? []).map((t) => t.id))
        anonymousTransactions = anonData.filter((t) => !existingIds.has(t.id))
      }
    }

    const allTransactions = [...(transactions ?? []), ...anonymousTransactions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)

    const totalCount = (count ?? 0) + anonymousTransactions.length

    // Calculer les totaux
    const totalSpent = allTransactions
      .filter(t => t.status === 'succeeded' || t.status === 'partially_refunded')
      .reduce((sum, t) => sum + (t.amount - (t.refunded_amount || 0)), 0) || 0

    const totalRefunded = allTransactions
      .reduce((sum, t) => sum + (t.refunded_amount || 0), 0) || 0

    return NextResponse.json({
      transactions: allTransactions,
      totalCount,
      totalSpent,
      totalRefunded,
      pagination: {
        limit,
        offset,
        hasMore: totalCount > offset + limit,
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
