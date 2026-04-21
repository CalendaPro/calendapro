// lib/tracking/detect.ts
// Détection automatique de la source d'acquisition

import { type NextRequest } from 'next/server'
import { TRACKING_SOURCES } from './sources'

export interface DetectedSource {
  source: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referrerUrl?: string
}

/**
 * Détecte la source d'acquisition à partir de la requête
 * Ordre de priorité:
 * 1. Paramètre ?ref= dans l'URL
 * 2. Paramètres UTM (?utm_source=)
 * 3. Header Referer
 * 4. Cookie existant
 * 5. Default: direct
 */
export function detectSourceChannel(req: NextRequest): DetectedSource {
  const url = new URL(req.url)
  
  // 1. Check ?ref= parameter (ex: ?ref=instagram)
  const ref = url.searchParams.get('ref')
  if (ref && TRACKING_SOURCES[ref]) {
    return {
      source: ref,
      referrerUrl: req.headers.get('referer') || undefined,
    }
  }
  
  // 2. Check UTM parameters
  const utmSource = url.searchParams.get('utm_source')
  const utmMedium = url.searchParams.get('utm_medium')
  const utmCampaign = url.searchParams.get('utm_campaign')
  
  if (utmSource) {
    // Map utm_source vers nos sources
    const mappedSource = mapUtmToSource(utmSource)
    return {
      source: mappedSource,
      utmSource,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      referrerUrl: req.headers.get('referer') || undefined,
    }
  }
  
  // 3. Check referrer header
  const referrer = req.headers.get('referer') || ''
  if (referrer) {
    const detectedFromReferrer = detectFromReferrer(referrer)
    if (detectedFromReferrer) {
      return {
        source: detectedFromReferrer,
        referrerUrl: referrer,
      }
    }
  }
  
  // 4. Default to direct
  return {
    source: 'direct',
    referrerUrl: referrer || undefined,
  }
}

/**
 * Map UTM source vers nos IDs de source internes
 */
function mapUtmToSource(utmSource: string): string {
  const mappings: Record<string, string> = {
    'instagram': 'instagram',
    'ig': 'instagram',
    'facebook': 'facebook',
    'fb': 'facebook',
    'tiktok': 'tiktok',
    'tt': 'tiktok',
    'google': 'google',
    'g': 'google',
    'email': 'email',
    'newsletter': 'email',
    'mail': 'email',
    'referral': 'wom',
    'referral_program': 'wom',
    'wom': 'wom',
    'direct': 'direct',
    'none': 'direct',
  }
  
  return mappings[utmSource.toLowerCase()] || 'other'
}

/**
 * Détecte la source à partir de l'URL referrer
 */
function detectFromReferrer(referrer: string): string | null {
  const lowerRef = referrer.toLowerCase()
  
  if (lowerRef.includes('instagram.com')) return 'instagram'
  if (lowerRef.includes('tiktok.com')) return 'tiktok'
  if (lowerRef.includes('facebook.com') || lowerRef.includes('fb.com')) return 'facebook'
  if (lowerRef.includes('google.com') || lowerRef.includes('google.fr')) return 'google'
  if (lowerRef.includes('mail.google.com') || lowerRef.includes('gmail')) return 'email'
  if (lowerRef.includes('calendar.google.com')) return 'email'
  
  // Check for social media in general
  if (lowerRef.includes('l.instagram.com') || lowerRef.includes('instagram')) return 'instagram'
  if (lowerRef.includes('t.co') || lowerRef.includes('twitter.com') || lowerRef.includes('x.com')) return 'other'
  
  return null // Unknown referrer, will fall back to direct
}

/**
 * Stocke la source détectée dans un cookie
 */
export function createSourceCookie(source: DetectedSource): string {
  const value = JSON.stringify({
    source: source.source,
    utmSource: source.utmSource,
    utmMedium: source.utmMedium,
    utmCampaign: source.utmCampaign,
    referrerUrl: source.referrerUrl,
    detectedAt: new Date().toISOString(),
  })
  
  // Cookie valable 30 jours
  return `calendapro_source=${encodeURIComponent(value)}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
}

/**
 * Parse le cookie de source
 */
export function parseSourceCookie(cookieValue: string): DetectedSource | null {
  try {
    // First try to parse as JSON
    const decoded = decodeURIComponent(cookieValue)
    const parsed = JSON.parse(decoded)
    
    return {
      source: parsed.source || parsed.source_channel || 'direct',
      utmSource: parsed.utmSource || parsed.utm_source,
      utmMedium: parsed.utmMedium || parsed.utm_medium,
      utmCampaign: parsed.utmCampaign || parsed.utm_campaign,
      referrerUrl: parsed.referrerUrl || parsed.referrer_url,
    }
  } catch {
    // If parsing fails, treat the raw value as the source
    return {
      source: cookieValue || 'direct',
    }
  }
}

/**
 * Génère un lien de tracking personnalisé pour un Pro
 */
export function generateTrackingLink(
  baseUrl: string,
  source: string,
  campaign?: string
): string {
  const url = new URL(baseUrl)
  
  // Priorité: ref parameter pour simplicité
  url.searchParams.set('ref', source)
  
  if (campaign) {
    url.searchParams.set('utm_campaign', campaign)
  }
  
  return url.toString()
}

/**
 * Détecte si le client a déjà un cookie de source valide
 */
export function getExistingSourceFromCookies(
  cookieHeader: string | null
): DetectedSource | null {
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';')
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'calendapro_source' && value) {
      return parseSourceCookie(value)
    }
  }
  
  return null
}
