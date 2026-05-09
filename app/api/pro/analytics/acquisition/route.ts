import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'
import {
  calculateLTVBySource,
  getAcquisitionTrends,
  generateMarketingAdvice,
  getMarketingAdvice,
  getAcquisitionSummary,
} from '@/lib/analytics/ltv'
import { type MarketingAdvice } from '@/lib/analytics/ltv'
import { formatSourceLabel, getSourceEmoji } from '@/lib/tracking/sources'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export interface AcquisitionData {
  timeRange: '7d' | '30d' | '90d'
  summary: {
    totalClients: number
    totalRevenue: number
    averageBasket: number
    topSource: string
    topSourcePercent: number
    totalBookings: number
  }
  channels: Array<{
    sourceChannel: string
    clientCount: number
    bookingCount: number
    totalRevenue: number
    averageBasket: number
    retentionRate: number
    percentage: number
    emoji: string
    label: string
    trend: 'up' | 'down' | 'stable'
    changePercent: number
  }>
  trends: Array<{
    date: string
    sourceChannel: string
    clientCount: number
    revenue: number
    newClients: number
  }>
  advice: MarketingAdvice[]
  recommendations: {
    topAction: string
    topContent: string
    estimatedRevenue: number
    priority: 'high' | 'medium' | 'low'
  }
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const plan = await getUserPlan(userId)
  if (plan === 'free') {
    return NextResponse.json(
      { error: 'Plan Premium requis', upgrade: true },
      { status: 403 }
    )
  }

  const url = new URL(req.url)
  const timeRange = (url.searchParams.get('range') as '7d' | '30d' | '90d') || '30d'
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

  const supabase = createServerSupabaseClient()

  try {
    // Récupérer le pro_id
    const { data: proData, error: proError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (proError || !proData) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    const proId = proData.id

    // Récupérer toutes les données en parallèle
    const [ltvData, trendsData, adviceData, summaryData] = await Promise.all([
      calculateLTVBySource(proId, days),
      getAcquisitionTrends(proId, days),
      getMarketingAdvice(proId, true), // Unread only
      getAcquisitionSummary(proId, days),
    ])

    // Si pas de conseils, en générer de nouveaux
    let finalAdvice = adviceData
    if (adviceData.length === 0 && ltvData.length > 0) {
      finalAdvice = await generateMarketingAdvice(proId)
    }

    // Calculer le total pour les pourcentages
    const totalClients = ltvData.reduce((sum, item) => sum + item.clientCount, 0)
    const totalBookings = ltvData.reduce((sum, item) => sum + item.bookingCount, 0)

    // Formater les canaux avec pourcentages
    const channels = ltvData.map((item) => ({
      ...item,
      percentage: totalClients > 0 ? Math.round((item.clientCount / totalClients) * 100) : 0,
      emoji: getSourceEmoji(item.sourceChannel),
      label: formatSourceLabel(item.sourceChannel),
      trend: 'stable' as const,
      changePercent: 0,
    }))

    // Trouver la meilleure recommandation
    const topAdvice = finalAdvice[0]
    const recommendations = topAdvice
      ? {
          topAction: topAdvice.action,
          topContent: topAdvice.contentSuggestion,
          estimatedRevenue: topAdvice.estimatedRevenueImpact,
          priority: topAdvice.priority,
        }
      : {
          topAction: 'Commence à partager ton lien sur tes réseaux',
          topContent: 'Poste ton lien avec un call-to-action clair',
          estimatedRevenue: 500,
          priority: 'high' as const,
        }

    const response: AcquisitionData = {
      timeRange,
      summary: {
        ...summaryData,
        totalBookings,
      },
      channels,
      trends: trendsData,
      advice: finalAdvice,
      recommendations,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Error fetching acquisition data:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// POST pour marquer un conseil comme lu ou actionné
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const body = await req.json()
  const { action, adviceId } = body

  try {
    // Récupérer le pro_id
    const { data: proData } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!proData) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    const proId = proData.id

    if (action === 'mark-read') {
      await supabase
        .from('marketing_advice')
        .update({ is_read: true })
        .eq('id', adviceId)
        .eq('pro_id', proId)
      return NextResponse.json({ success: true })
    }

    if (action === 'mark-actioned') {
      await supabase
        .from('marketing_advice')
        .update({ is_actioned: true, is_read: true })
        .eq('id', adviceId)
        .eq('pro_id', proId)
      return NextResponse.json({ success: true })
    }

    if (action === 'dismiss') {
      await supabase
        .from('marketing_advice')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', adviceId)
        .eq('pro_id', proId)
      return NextResponse.json({ success: true })
    }

    if (action === 'generate-advice') {
      const newAdvice = await generateMarketingAdvice(proId)
      return NextResponse.json({ success: true, advice: newAdvice })
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  } catch (error) {
    logger.error('Error processing advice action:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
