// ═══════════════════════════════════════════════════════════════════════════════
// Validation téléphone E.164 avec libphonenumber-js (Fix #8)
// ═══════════════════════════════════════════════════════════════════════════════

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js'

/**
 * Normalise un numéro de téléphone vers le format E.164 standard international.
 * Utilise libphonenumber-js pour une validation robuste.
 * 
 * @param phone - Le numéro de téléphone à normaliser
 * @param country - Code pays par défaut (ex: 'FR', 'BE', 'CH')
 * @returns Le numéro en format E.164 (ex: +33612345678) ou null si invalide
 */
export function normalizePhoneE164(
  phone: string | undefined | null,
  country: CountryCode = 'FR'
): string | null {
  if (!phone || typeof phone !== 'string') return null

  // Nettoyage basique
  const cleaned = phone.trim()
  if (cleaned.length < 4) return null

  try {
    // Essayer de parser avec le pays par défaut
    const phoneNumber = parsePhoneNumber(cleaned, country)
    
    if (phoneNumber && isValidPhoneNumber(cleaned, country)) {
      return phoneNumber.format('E.164')
    }

    // Si ça ne marche pas, essayer de détecter automatiquement le pays
    const autoNumber = parsePhoneNumber(cleaned)
    if (autoNumber && autoNumber.isValid()) {
      return autoNumber.format('E.164')
    }

    return null
  } catch {
    // En cas d'erreur de parsing, retourner null
    return null
  }
}

/**
 * Vérifie si un numéro de téléphone est valide selon le format E.164.
 * 
 * @param phone - Le numéro de téléphone à valider
 * @param country - Code pays par défaut (ex: 'FR')
 * @returns true si valide, false sinon
 */
export function isValidPhoneE164(phone: string, country: CountryCode = 'FR'): boolean {
  if (!phone || typeof phone !== 'string') return false
  
  try {
    return isValidPhoneNumber(phone, country) || isValidPhoneNumber(phone)
  } catch {
    return false
  }
}

/**
 * Valide et normalise un numéro pour SMS Twilio.
 * Twilio nécessite un format E.164 strict.
 * 
 * @param phone - Le numéro de téléphone
 * @returns Objet avec isValid, e164Number, et error si invalide
 */
export function validatePhoneForSMS(phone: string): {
  isValid: boolean
  e164Number: string | null
  error?: string
} {
  const normalized = normalizePhoneE164(phone, 'FR')
  
  if (!normalized) {
    return {
      isValid: false,
      e164Number: null,
      error: 'Numéro de téléphone invalide. Format attendu: +33612345678 ou 0612345678'
    }
  }

  // Vérification supplémentaire pour SMS: doit être un mobile
  try {
    const parsed = parsePhoneNumber(normalized)
    if (!parsed) {
      return { isValid: false, e164Number: null, error: 'Impossible de parser le numéro' }
    }

    // Pour la France, vérifier que c'est bien un mobile (06 ou 07)
    if (parsed.country === 'FR') {
      const nationalNumber = parsed.nationalNumber
      if (!nationalNumber.match(/^[67]/)) {
        return {
          isValid: false,
          e164Number: normalized,
          error: 'Le numéro doit être un mobile français (06 ou 07) pour recevoir des SMS'
        }
      }
    }

    return { isValid: true, e164Number: normalized }
  } catch (err) {
    return {
      isValid: false,
      e164Number: null,
      error: err instanceof Error ? err.message : 'Erreur de validation'
    }
  }
}

/**
 * Formatte un numéro E.164 pour affichage lisible.
 * Ex: +33612345678 → +33 6 12 34 56 78
 */
export function formatPhoneForDisplay(phone: string | null): string {
  if (!phone) return ''
  
  try {
    const parsed = parsePhoneNumber(phone)
    if (parsed) {
      return parsed.formatInternational()
    }
    return phone
  } catch {
    return phone
  }
}

// Export des types pour utilisation
export type { CountryCode } from 'libphonenumber-js'
