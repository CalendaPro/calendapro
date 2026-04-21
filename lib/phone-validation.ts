/**
 * Normalise un numéro de téléphone français vers le format E.164.
 * Retourne null si le numéro est invalide.
 */
export function normalizePhoneE164(phone: string | undefined | null): string | null {
  if (!phone) return null

  // Supprimer tous les espaces, tirets, points, parenthèses
  let cleaned = phone.replace(/[\s\-\.()]/g, '')

  // Format français : 06 → +336, 07 → +337
  if (/^0[67]\d{8}$/.test(cleaned)) {
    cleaned = '+33' + cleaned.slice(1)
  }

  // Format déjà international sans +
  if (/^33[67]\d{8}$/.test(cleaned)) {
    cleaned = '+' + cleaned
  }

  // Format correct E.164
  if (/^\+33[67]\d{8}$/.test(cleaned)) {
    return cleaned
  }

  // Format international autre (accepté tel quel si structure correcte)
  if (/^\+\d{8,15}$/.test(cleaned)) {
    return cleaned
  }

  return null
}

export function isValidPhoneE164(phone: string): boolean {
  return normalizePhoneE164(phone) !== null
}
