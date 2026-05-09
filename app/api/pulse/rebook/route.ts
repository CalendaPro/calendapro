import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.rpc('predict_rebook', {
    target_client_id: userId,
  })

  if (error) {
    logger.error('[Rebook] Prediction failed:', error.message)
    return NextResponse.json({ predictions: [] })
  }

  return NextResponse.json({ predictions: data ?? [] })
}
