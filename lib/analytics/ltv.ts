// lib/analytics/ltv.ts
// Calcul Lifetime Value (LTV) par canal d'acquisition

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '../logger'

export interface ClientValueMetrics {
  sourceChannel: string
  clientCount: number
  bookingCount: number
  totalRevenue: number
  averageBasket: number
  retentionRate: number // Pourcentage de clients qui reviennent
  trend: 'up' | 'down' | 'stable'
  changePercent: number // Changement vs période précédente
}

export interface AcquisitionTrend {
  date: string
  sourceChannel: string
  clientCount: number
  revenue: number
  newClients: number
}

export interface MarketingAdvice {
  id: string
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  description: string
  action: string
  contentSuggestion: string
  relatedSource?: string
  estimatedRevenueImpact: number
  isRead: boolean
  isActioned: boolean
  createdAt: string
}

/**
 * Calcule les métriques LTV par canal d'acquisition
 */
export async function calculateLTVBySource(
  proId: string,
  days: number = 90
): Promise<ClientValueMetrics[]> {
  const supabase = createServerSupabaseClient()
  
  // Utiliser la fonction SQL pour calculer LTV
  const { data, error } = await supabase.rpc('calculate_ltv_by_source', {
    p_pro_id: proId,
    p_days: days,
  })
  
  if (error) {
    logger.error('Error calculating LTV:', error)
    throw error
  }
  
  // Transformer les données
  return (data || []).map((row: any) => ({
    sourceChannel: row.source_channel,
    clientCount: Number(row.client_count),
    bookingCount: Number(row.booking_count),
    totalRevenue: Number(row.total_revenue),
    averageBasket: Number(row.average_basket),
    retentionRate: Number(row.retention_rate),
    trend: 'stable', // Sera calculé séparément
    changePercent: 0,
  }))
}

/**
 * Récupère les tendances d'acquisition par jour
 */
export async function getAcquisitionTrends(
  proId: string,
  days: number = 30
): Promise<AcquisitionTrend[]> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase.rpc('get_acquisition_trends', {
    p_pro_id: proId,
    p_days: days,
  })
  
  if (error) {
    logger.error('Error getting trends:', error)
    throw error
  }
  
  return (data || []).map((row: any) => ({
    date: row.date,
    sourceChannel: row.source_channel,
    clientCount: Number(row.client_count),
    revenue: Number(row.revenue),
    newClients: Number(row.new_clients),
  }))
}

/**
 * Génère des conseils marketing basés sur les données LTV
 */
export async function generateMarketingAdvice(
  proId: string
): Promise<MarketingAdvice[]> {
  const supabase = createServerSupabaseClient()
  
  // Récupérer les conseils générés par la fonction SQL
  const { data, error } = await supabase.rpc('generate_marketing_advice', {
    p_pro_id: proId,
  })
  
  if (error) {
    logger.error('Error generating advice:', error)
    // Fallback: générer localement
    return generateLocalAdvice(proId)
  }
  
  // Transformer et stocker en base
  const advice: MarketingAdvice[] = (data || []).map((row: any, index: number) => ({
    id: `advice-${Date.now()}-${index}`,
    priority: row.priority,
    icon: row.icon,
    title: row.title,
    description: row.description,
    action: row.action,
    contentSuggestion: row.content_suggestion,
    relatedSource: row.related_source,
    estimatedRevenueImpact: Number(row.estimated_revenue_impact),
    isRead: false,
    isActioned: false,
    createdAt: new Date().toISOString(),
  }))
  
  // Stocker les nouveaux conseils en base
  await storeAdvice(proId, advice)
  
  return advice
}

/**
 * Fallback: génère des conseils localement si la fonction SQL échoue
 */
async function generateLocalAdvice(proId: string): Promise<MarketingAdvice[]> {
  const ltv = await calculateLTVBySource(proId, 90)
  
  if (ltv.length === 0) {
    return [{
      id: `advice-${Date.now()}-start`,
      priority: 'high',
 icon: '',
      title: 'Commence à partager ton lien',
      description: 'Aucun client tracké encore. Partage ton lien sur tes réseaux sociaux.',
      action: 'Copie ton lien et partage sur Instagram/TikTok',
      contentSuggestion: 'Poste ton lien avec un call-to-action clair',
      estimatedRevenueImpact: 500,
      isRead: false,
      isActioned: false,
      createdAt: new Date().toISOString(),
    }]
  }
  
  const sorted = [...ltv].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const topSource = sorted[0]
  const secondSource = sorted[1]
  const worstSource = sorted[sorted.length - 1]
  const womSource = sorted.find(s => s.sourceChannel === 'wom')
  
  const advice: MarketingAdvice[] = []
  
  // Conseil 1: Top source
  if (topSource) {
    advice.push({
      id: `advice-${Date.now()}-top`,
      priority: 'high',
 icon: '',
      title: `${topSource.sourceChannel} est TON canal golden`,
      description: `${topSource.clientCount} clients, €${topSource.totalRevenue.toFixed(2)} générés, panier moyen €${topSource.averageBasket.toFixed(2)}`,
      action: `Double down sur ${topSource.sourceChannel} maintenant`,
      contentSuggestion: 'Poste Avant/Après transformation à l\'heure optimale (18h-20h)',
      relatedSource: topSource.sourceChannel,
      estimatedRevenueImpact: topSource.totalRevenue * 0.3,
      isRead: false,
      isActioned: false,
      createdAt: new Date().toISOString(),
    })
  }
  
  // Conseil 2: Deuxième source
  if (secondSource && secondSource.clientCount < topSource.clientCount * 0.5) {
    advice.push({
      id: `advice-${Date.now()}-second`,
      priority: 'medium',
 icon: '',
      title: `${secondSource.sourceChannel} a du potentiel non exploité`,
      description: `Seulement ${secondSource.clientCount} clients vs ${topSource.clientCount} sur ${topSource.sourceChannel}`,
      action: `Poste 3x par semaine sur ${secondSource.sourceChannel}`,
      contentSuggestion: 'Utilise les trending sounds + transformation rapide',
      relatedSource: secondSource.sourceChannel,
      estimatedRevenueImpact: secondSource.totalRevenue * 0.5,
      isRead: false,
      isActioned: false,
      createdAt: new Date().toISOString(),
    })
  }
  
  // Conseil 3: Parrainage
  if (womSource && womSource.retentionRate > 70) {
    advice.push({
      id: `advice-${Date.now()}-wom`,
      priority: 'high',
 icon: '',
      title: 'Crée un programme de parrainage',
      description: `Bouche-à-oreille = ${womSource.retentionRate}% de fidélité, c'est ton meilleur canal!`,
      action: 'Offre €10 à chaque client qui ramène un ami',
      contentSuggestion: 'Envoie message personnalisé aux 5 meilleurs clients avec ton lien parrainage',
      relatedSource: 'wom',
      estimatedRevenueImpact: womSource.totalRevenue * 0.4,
      isRead: false,
      isActioned: false,
      createdAt: new Date().toISOString(),
    })
  }
  
  // Conseil 4: Source faible
  if (worstSource && worstSource.sourceChannel !== topSource.sourceChannel) {
    advice.push({
      id: `advice-${Date.now()}-weak`,
      priority: 'low',
 icon: '',
      title: `Optimise ton ${worstSource.sourceChannel}`,
      description: `Panier moyen de €${worstSource.averageBasket.toFixed(2)} vs €${topSource.averageBasket.toFixed(2)} sur ${topSource.sourceChannel}`,
      action: `Teste un nouveau format de contenu sur ${worstSource.sourceChannel}`,
      contentSuggestion: `Analyse ce qui marche sur ${topSource.sourceChannel} et adapte`,
      relatedSource: worstSource.sourceChannel,
      estimatedRevenueImpact: worstSource.totalRevenue * 0.2,
      isRead: false,
      isActioned: false,
      createdAt: new Date().toISOString(),
    })
  }
  
  await storeAdvice(proId, advice)
  return advice
}

/**
 * Stocke les conseils en base de données
 */
async function storeAdvice(proId: string, advice: MarketingAdvice[]): Promise<void> {
  const supabase = createServerSupabaseClient()
  
  // Ne stocker que les nouveaux conseils (pas de doublons)
  for (const item of advice) {
    await supabase.from('marketing_advice').upsert({
      pro_id: proId,
      priority: item.priority,
      icon: item.icon,
      title: item.title,
      description: item.description,
      action: item.action,
      content_suggestion: item.contentSuggestion,
      related_source: item.relatedSource,
      estimated_revenue_impact: item.estimatedRevenueImpact,
      is_read: item.isRead,
      is_actioned: item.isActioned,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
    }, {
      onConflict: 'pro_id,title', // Éviter les doublons
      ignoreDuplicates: true,
    })
  }
}

/**
 * Récupère les conseils marketing existants pour un Pro
 */
export async function getMarketingAdvice(
  proId: string,
  unreadOnly: boolean = false
): Promise<MarketingAdvice[]> {
  const supabase = createServerSupabaseClient()
  
  let query = supabase
    .from('marketing_advice')
    .select('*')
    .eq('pro_id', proId)
    .gt('expires_at', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (unreadOnly) {
    query = query.eq('is_read', false)
  }
  
  const { data, error } = await query.limit(10)
  
  if (error) {
    logger.error('Error fetching advice:', error)
    return []
  }
  
  return (data || []).map((row: any) => ({
    id: row.id,
    priority: row.priority,
    icon: row.icon,
    title: row.title,
    description: row.description,
    action: row.action,
    contentSuggestion: row.content_suggestion,
    relatedSource: row.related_source,
    estimatedRevenueImpact: Number(row.estimated_revenue_impact),
    isRead: row.is_read,
    isActioned: row.is_actioned,
    createdAt: row.created_at,
  }))
}

/**
 * Marque un conseil comme lu
 */
export async function markAdviceAsRead(
  proId: string,
  adviceId: string
): Promise<void> {
  const supabase = createServerSupabaseClient()
  
  await supabase
    .from('marketing_advice')
    .update({ is_read: true })
    .eq('id', adviceId)
    .eq('pro_id', proId)
}

/**
 * Marque un conseil comme actionné
 */
export async function markAdviceAsActioned(
  proId: string,
  adviceId: string
): Promise<void> {
  const supabase = createServerSupabaseClient()
  
  await supabase
    .from('marketing_advice')
    .update({ is_actioned: true, is_read: true })
    .eq('id', adviceId)
    .eq('pro_id', proId)
}

/**
 * Calcule le résumé global d'acquisition
 */
export async function getAcquisitionSummary(
  proId: string,
  days: number = 30
): Promise<{
  totalClients: number
  totalRevenue: number
  averageBasket: number
  topSource: string
  topSourcePercent: number
}> {
  const ltv = await calculateLTVBySource(proId, days)
  
  if (ltv.length === 0) {
    return {
      totalClients: 0,
      totalRevenue: 0,
      averageBasket: 0,
      topSource: 'none',
      topSourcePercent: 0,
    }
  }
  
  const totalClients = ltv.reduce((sum, item) => sum + item.clientCount, 0)
  const totalRevenue = ltv.reduce((sum, item) => sum + item.totalRevenue, 0)
  const averageBasket = totalRevenue / ltv.reduce((sum, item) => sum + item.bookingCount, 0) || 0
  
  const topSource = ltv[0]
  const topSourcePercent = totalClients > 0 
    ? Math.round((topSource.clientCount / totalClients) * 100) 
    : 0
  
  return {
    totalClients,
    totalRevenue,
    averageBasket,
    topSource: topSource.sourceChannel,
    topSourcePercent,
  }
}
