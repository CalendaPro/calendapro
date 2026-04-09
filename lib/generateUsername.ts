/**
 * Génère un username unique à partir du nom complet
 * Format : {first_letter_prenom}{nom_complet_slugified}_{random_3_chiffres}
 * Exemple : aharri_123 ou cdurant_456
 */
export function generateUsername(fullName: string | null | undefined): string {
  if (!fullName) {
    // Fallback si pas de nom
    return `user_${Math.floor(Math.random() * 10000)}`
  }

  // Nettoyer et slugifier le nom
  const slug = fullName
    .toLowerCase()
    .normalize('NFD') // Normaliser pour enlever les accents
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]/g, '') // Garder seulement a-z et 0-9
    .substring(0, 15) // Limiter à 15 caractères

  // Générer un nombre aléatoire à 3 chiffres
  const random = Math.floor(Math.random() * 1000)

  // Combiner : première lettre + slug + nombre aléatoire
  const firstLetter = slug.charAt(0)
  const rest = slug.substring(1)
  
  return `${firstLetter}${rest}_${random}`
}
