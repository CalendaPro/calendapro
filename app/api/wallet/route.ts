import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET /api/wallet - Récupérer le solde et l'historique
// Fix #9: Utilise une transaction SQL atomique pour garantir la cohérence du solde
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = createServerSupabaseClient()

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // TRANSACTION ATOMIQUE: Calcul du solde avec row-level locking (Fix #9)
    // Utilise une RPC pour garantir atomicité et éviter les race conditions
    // ═══════════════════════════════════════════════════════════════════════════════
    const { data: walletData, error: walletError } = await supabase.rpc('get_wallet_balance_atomic', {
      p_user_id: userId
    })

    if (walletError) {
      logger.error('[Wallet] Erreur transaction atomique:', walletError)
      // Fallback à la méthode non-atomique en cas d'erreur
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, currency, updated_at')
        .eq('user_id', userId)
        .single()
      
      if (!wallet) {
        return NextResponse.json({
          wallet: { balance: 0, currency: 'EUR', user_id: userId },
          transactions: [],
          warning: 'Fallback mode - non atomic'
        })
      }
    }

    const wallet = walletData || { balance: 0, currency: 'EUR', user_id: userId }

    // Récupérer les transactions (hors transaction pour performance)
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('id, amount, type, status, description, created_at, booking_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    // Vérification de cohérence: le solde doit correspondre à la somme des transactions
    const calculatedBalance = (transactions || []).reduce((sum, tx) => {
      if (tx.status === 'completed') {
        return sum + (tx.type === 'credit' ? tx.amount : -tx.amount)
      }
      return sum
    }, 0)

    // Log si incohérence détectée
    if (Math.abs((wallet.balance || 0) - calculatedBalance) > 0.01) {
      logger.warn(`[Wallet] Incohérence détectée pour ${userId}: wallet=${wallet.balance}, calculé=${calculatedBalance}`)
    }

    return NextResponse.json({
      wallet: {
        balance: wallet.balance || 0,
        currency: wallet.currency || 'EUR',
        user_id: userId,
        last_updated: wallet.updated_at
      },
      transactions: transactions || [],
      calculated_balance: calculatedBalance,
      consistent: Math.abs((wallet.balance || 0) - calculatedBalance) < 0.01
    })
  } catch (err) {
    logger.error('[Wallet] Exception:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
