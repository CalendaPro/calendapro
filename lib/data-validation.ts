/**
 * AUDIT #6 — Edge Case 10: DONNÉES CORROMPUES / MANQUANTES
 * Validation robuste des données dans toute l'application
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ProProfileValidation {
  id: string
  hasServices: boolean
  hasAvailability: boolean
  hasPaymentSettings: boolean
  isPublished: boolean
  accountStatus: string
  missingFields: string[]
}

/**
 * Valide les données minimales requises pour un profil pro
 */
export async function validateProProfile(
  supabase: SupabaseClient,
  proId: string
): Promise<ProProfileValidation> {
  const result: ProProfileValidation = {
    id: proId,
    hasServices: false,
    hasAvailability: false,
    hasPaymentSettings: false,
    isPublished: false,
    accountStatus: 'unknown',
    missingFields: []
  }

  // Vérifier le profil
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', proId)
    .maybeSingle()

  if (error || !profile) {
    result.missingFields.push('profile')
    return result
  }

  // Vérifier le statut du compte
  result.accountStatus = profile.account_status || 'active'
  if (result.accountStatus === 'deleted' || result.accountStatus === 'pending_deletion') {
    result.missingFields.push('account_deleted')
    return result
  }

  result.isPublished = profile.is_published === true

  // Vérifier les champs requis
  if (!profile.full_name) result.missingFields.push('full_name')
  if (!profile.email) result.missingFields.push('email')

  // Vérifier les services
  const { data: services } = await supabase
    .from('services')
    .select('id')
    .eq('pro_id', proId)
    .limit(1)
  
  result.hasServices = (services?.length || 0) > 0

  // Vérifier les disponibilités
  const { data: availabilities } = await supabase
    .from('availabilities')
    .select('id')
    .eq('pro_id', proId)
    .limit(1)
  
  result.hasAvailability = (availabilities?.length || 0) > 0

  // Vérifier les paramètres de paiement
  result.hasPaymentSettings = 
    profile.online_payment_enabled !== null &&
    (profile.deposit_required !== null || profile.allow_full_online_payment !== null)

  return result
}

/**
 * Valide les données d'un booking avant création
 */
export function validateBookingData(data: {
  proId?: string
  clientId?: string
  scheduledAt?: string
  duration?: number
  serviceName?: string
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data.proId) {
    errors.push('proId manquant')
  }

  if (!data.clientId) {
    errors.push('clientId manquant')
  }

  if (!data.scheduledAt) {
    errors.push('scheduledAt manquant')
  } else {
    const date = new Date(data.scheduledAt)
    if (isNaN(date.getTime())) {
      errors.push('scheduledAt invalide')
    } else if (date < new Date()) {
      errors.push('scheduledAt dans le passé')
    }
  }

  if (!data.duration || data.duration <= 0) {
    warnings.push('duration invalide, utilisation de la valeur par défaut (60min)')
  }

  if (!data.serviceName?.trim()) {
    warnings.push('serviceName vide')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Vérifie si un webhook Stripe contient les métadonnées requises
 */
export function validateStripeWebhookMetadata(
  metadata: Record<string, string | null | undefined> | null | undefined,
  requiredFields: string[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!metadata) {
    errors.push('metadata manquantes')
    return { valid: false, errors, warnings }
  }

  for (const field of requiredFields) {
    if (!metadata[field] || metadata[field]?.trim() === '') {
      errors.push(`metadata.${field} manquante`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valide les paramètres de connexion Stripe
 */
export function validateStripeConnectSettings(profile: {
  stripe_connect_id?: string | null
  stripe_connect_charges?: boolean | null
  stripe_connect_payouts?: boolean | null
  stripe_connect_onboarding?: boolean | null
}): {
  isConfigured: boolean
  canAcceptPayments: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (!profile.stripe_connect_id) {
    issues.push('Compte Connect non créé')
  }

  if (!profile.stripe_connect_onboarding) {
    issues.push('Onboarding Connect non complété')
  }

  if (!profile.stripe_connect_charges) {
    issues.push('Paiements non activés sur Connect')
  }

  if (!profile.stripe_connect_payouts) {
    issues.push('Virements non activés')
  }

  const isConfigured = !!profile.stripe_connect_id
  const canAcceptPayments = 
    profile.stripe_connect_charges === true && 
    profile.stripe_connect_payouts === true

  return { isConfigured, canAcceptPayments, issues }
}

/**
 * Fonction utilitaire pour gérer les valeurs nulles/undefined
 */
export function safeGet<T>(
  value: T | null | undefined,
  defaultValue: T
): T {
  if (value === null || value === undefined) {
    return defaultValue
  }
  return value
}

/**
 * Vérifie si une valeur est un email valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Vérifie si une valeur est un numéro de téléphone valide (format E.164)
 */
export function isValidPhoneE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone.replace(/\s/g, ''))
}

/**
 * Nettoie et normalise une chaîne
 */
export function sanitizeString(
  input: string | null | undefined,
  maxLength: number = 500
): string {
  if (!input) return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Supprime les caractères HTML dangereux
}

/**
 * Vérifie si un montant Stripe est valide
 */
export function isValidStripeAmount(
  amountCents: number
): { valid: boolean; error?: string } {
  const MIN_AMOUNT_CENTS = 50 // 0.50€
  const MAX_AMOUNT_CENTS = 99999999 // ~1M€

  if (amountCents < MIN_AMOUNT_CENTS) {
    return { 
      valid: false, 
      error: `Montant minimum: ${MIN_AMOUNT_CENTS / 100}€` 
    }
  }

  if (amountCents > MAX_AMOUNT_CENTS) {
    return { 
      valid: false, 
      error: `Montant maximum dépassé` 
    }
  }

  return { valid: true }
}

/**
 * Détecte les cas edge cases courants
 */
export async function detectEdgeCases(
  supabase: SupabaseClient,
  proId: string,
  scheduledAt: string
): Promise<{
  hasConflict: boolean
  conflictDetails?: string
  isSlotOnHold: boolean
  holdExpiresAt?: string
  proAccountValid: boolean
  proAccountIssues?: string[]
}> {
  const result: ReturnType<typeof detectEdgeCases> extends Promise<infer T> ? T : never = {
    hasConflict: false,
    isSlotOnHold: false,
    proAccountValid: true
  }

  // Vérifier le compte pro
  const profileValidation = await validateProProfile(supabase, proId)
  if (profileValidation.accountStatus === 'deleted') {
    result.proAccountValid = false
    result.proAccountIssues = ['Ce professionnel n\'est plus disponible']
  } else if (!profileValidation.isPublished) {
    result.proAccountValid = false
    result.proAccountIssues = ['Ce professionnel n\'est pas encore publié']
  }

  // Vérifier si le créneau est déjà réservé (via RPC)
  const { data: slotCheck } = await supabase.rpc('is_slot_available', {
    p_pro_id: proId,
    p_scheduled_at: scheduledAt,
    p_duration_minutes: 60
  })

  if (slotCheck) {
    const check = slotCheck as { available: boolean; reason?: string; expires_at?: string }
    if (!check.available) {
      if (check.reason === 'BOOKED') {
        result.hasConflict = true
        result.conflictDetails = 'Ce créneau est déjà réservé'
      } else if (check.reason === 'ON_HOLD') {
        result.isSlotOnHold = true
        result.holdExpiresAt = check.expires_at
      }
    }
  }

  return result
}
