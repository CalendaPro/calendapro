/**
 * Convertit une durée textuelle (ex: "30 min", "1h", "1h30") en nombre de minutes (entier)
 * Retourne null si la conversion échoue
 */
export function parseDurationToMinutes(duration: string | number | null | undefined): number | null {
  if (duration === null || duration === undefined) return null
  
  // Si déjà un nombre, le retourner tel quel
  if (typeof duration === 'number') {
    return Number.isFinite(duration) ? Math.round(duration) : null
  }
  
  const normalized = duration.trim().toLowerCase().replace(/\s+/g, '')
  
  // Format "30min" ou "30 min"
  const minutesMatch = normalized.match(/^(\d+)\s*min$/)
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10)
  }
  
  // Format "1h" ou "1 h"
  const hoursMatch = normalized.match(/^(\d+)\s*h$/)
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 60
  }
  
  // Format "1h30" ou "1h30min"
  const hoursMinutesMatch = normalized.match(/^(\d+)\s*h\s*(\d+)\s*min?$/)
  if (hoursMinutesMatch) {
    const hours = parseInt(hoursMinutesMatch[1], 10)
    const minutes = parseInt(hoursMinutesMatch[2], 10)
    return hours * 60 + minutes
  }
  
  // Format "1:30" ou "1h:30min"
  const colonMatch = normalized.match(/^(\d+)[:h](\d+)$/)
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10)
    const minutes = parseInt(colonMatch[2], 10)
    return hours * 60 + minutes
  }
  
  // Essayer de parser directement si c'est juste un nombre
  const directNumber = parseInt(normalized, 10)
  if (!isNaN(directNumber) && directNumber > 0) {
    return directNumber
  }
  
  return null
}

/**
 * Formate une durée en minutes pour l'affichage (ex: 90 -> "1h30")
 */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return ''
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h${mins.toString().padStart(2, '0')}`
}
