// Unified Tunnel Tracking System
// Gère le flux Découverte → Inscription → Réservation

const COOKIE_PENDING_PRO = 'pending_pro_selection'
const COOKIE_SOURCE_CHANNEL = 'calendapro_source'
const COOKIE_UTM_DATA = 'utm_data'

// Store pro selection in cookie for post-registration redirect
export function storeProSelection(proId: string, proUsername: string): void {
  const data = JSON.stringify({
    proId,
    proUsername,
    timestamp: Date.now(),
  })
  // Cookie expires in 1 hour
  document.cookie = `${COOKIE_PENDING_PRO}=${encodeURIComponent(data)}; path=/; max-age=3600; SameSite=Lax`
}

// Get stored pro selection
export function getProSelection(): { proId: string; proUsername: string; timestamp: number } | null {
  const match = document.cookie.match(new RegExp(`${COOKIE_PENDING_PRO}=([^;]+)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

// Clear pro selection cookie
export function clearProSelection(): void {
  document.cookie = `${COOKIE_PENDING_PRO}=; path=/; max-age=0; SameSite=Lax`
}

// Detect and store acquisition source from URL or referrer
export function detectAndStoreSource(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const params = url.searchParams

  // Priority: URL params > referrer
  let source = 'direct'
  let utmSource = params.get('utm_source')
  let utmMedium = params.get('utm_medium')
  let utmCampaign = params.get('utm_campaign')
  let ref = params.get('ref')

  // Check for ref parameter first
  if (ref) {
    const refLower = ref.toLowerCase()
    if (['instagram', 'ig', 'insta'].includes(refLower)) source = 'instagram'
    else if (['tiktok', 'tt'].includes(refLower)) source = 'tiktok'
    else if (['facebook', 'fb'].includes(refLower)) source = 'facebook'
    else if (['google', 'g'].includes(refLower)) source = 'google'
    else if (['email', 'mail', 'newsletter'].includes(refLower)) source = 'email'
    else if (['marketplace'].includes(refLower)) source = 'marketplace_internal'
    else source = refLower
  }
  // Then check UTM source
  else if (utmSource) {
    source = utmSource.toLowerCase()
  }
  // Finally check referrer
  else {
    const referrer = document.referrer
    if (referrer) {
      if (referrer.includes('google')) source = 'google'
      else if (referrer.includes('instagram')) source = 'instagram'
      else if (referrer.includes('facebook')) source = 'facebook'
      else if (referrer.includes('tiktok')) source = 'tiktok'
      else if (referrer.includes('calendapro')) source = 'marketplace_internal'
      else source = 'referral'
    }
  }

  // Store source in JSON format (same as lib/tracking/detect.ts)
  const sourceData = JSON.stringify({
    source,
    utmSource: utmSource || undefined,
    utmMedium: utmMedium || undefined,
    utmCampaign: utmCampaign || undefined,
    referrerUrl: document.referrer || undefined,
    detectedAt: new Date().toISOString(),
  })
  document.cookie = `${COOKIE_SOURCE_CHANNEL}=${encodeURIComponent(sourceData)}; path=/; max-age=86400; SameSite=Lax`
}

// Get stored source channel
export function getSourceChannel(): string {
  if (typeof window === 'undefined') return 'direct'
  const match = document.cookie.match(new RegExp(`${COOKIE_SOURCE_CHANNEL}=([^;]+)`))
  if (!match) return 'direct'
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]))
    return parsed.source || 'direct'
  } catch {
    // Fallback for legacy format (raw string)
    return decodeURIComponent(match[1]) || 'direct'
  }
}

// Get UTM data
export function getUtmData(): { source: string; medium: string; campaign: string; referrer_url: string } | null {
  if (typeof window === 'undefined') return null
  const match = document.cookie.match(new RegExp(`${COOKIE_UTM_DATA}=([^;]+)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

// Clear all tracking cookies
export function clearTrackingCookies(): void {
  document.cookie = `${COOKIE_SOURCE_CHANNEL}=; path=/; max-age=0; SameSite=Lax`
  document.cookie = `${COOKIE_UTM_DATA}=; path=/; max-age=0; SameSite=Lax`
}

// Determine onboarding flow type
export function getOnboardingFlowType(): 'explore' | 'direct' {
  const selection = getProSelection()
  const url = new URL(window.location.href)
  const ref = url.searchParams.get('ref')

  // Direct flow: has ref parameter pointing to a pro
  if (ref && !['instagram', 'tiktok', 'facebook', 'google', 'marketplace'].includes(ref)) {
    return 'direct'
  }

  // Direct flow: came from marketplace with pro selected
  if (selection) {
    return 'direct'
  }

  // Default: explore flow (full discovery onboarding)
  return 'explore'
}

// Build post-onboarding redirect URL
export function buildPostOnboardingRedirect(): string {
  const selection = getProSelection()

  if (selection) {
    clearProSelection() // Clean up after use
    return `/client/${selection.proUsername}`
  }

  return '/client/marketplace'
}
