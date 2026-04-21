import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/wallet - Récupérer le solde et l'historique
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = createServerSupabaseClient()

  // Récupérer le wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError && walletError.code !== 'PGRST116') {
    return NextResponse.json({ error: walletError.message }, { status: 500 })
  }

  // Récupérer les transactions
  const { data: transactions, error: txError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 })
  }

  return NextResponse.json({
    wallet: wallet || { balance: 0, currency: 'EUR', user_id: userId },
    transactions: transactions || [],
  })
}
