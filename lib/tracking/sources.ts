// lib/tracking/sources.ts
// Configuration des sources de tracking marketing

export interface TrackingSource {
  id: string
  name: string
  emoji: string
  color: string
  icon: string
  description: string
}

export const TRACKING_SOURCES: Record<string, TrackingSource> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    emoji: '📸',
    color: '#E4405F',
    icon: 'Instagram',
    description: 'Clients venant d Instagram',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    emoji: '🎵',
    color: '#000000',
    icon: 'Music',
    description: 'Clients venant de TikTok',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    emoji: '👥',
    color: '#1877F2',
    icon: 'Facebook',
    description: 'Clients venant de Facebook',
  },
  google: {
    id: 'google',
    name: 'Google',
    emoji: '🔍',
    color: '#4285F4',
    icon: 'Search',
    description: 'Clients venant de Google Search',
  },
  email: {
    id: 'email',
    name: 'Email',
    emoji: '📧',
    color: '#EA4335',
    icon: 'Mail',
    description: 'Clients venant de newsletters/emails',
  },
  wom: {
    id: 'wom',
    name: 'Bouche-à-oreille',
    emoji: '👂',
    color: '#34A853',
    icon: 'Users',
    description: 'Recommandations de clients existants',
  },
  direct: {
    id: 'direct',
    name: 'Direct',
    emoji: '🔗',
    color: '#888888',
    icon: 'Link',
    description: 'Accès direct via URL',
  },
  other: {
    id: 'other',
    name: 'Autre',
    emoji: '❓',
    color: '#999999',
    icon: 'HelpCircle',
    description: 'Source non identifiée',
  },
}

// Couleurs pour les charts
export const SOURCE_COLORS = [
  '#E4405F', // Instagram - Rose
  '#000000', // TikTok - Noir
  '#1877F2', // Facebook - Bleu
  '#4285F4', // Google - Bleu clair
  '#EA4335', // Email - Rouge
  '#34A853', // WOM - Vert
  '#888888', // Direct - Gris
  '#9C27B0', // Autre - Violet
]

// Ordre de priorité pour l'affichage
export const SOURCE_PRIORITY = [
  'instagram',
  'tiktok',
  'facebook',
  'google',
  'wom',
  'email',
  'direct',
  'other',
]

// Helpers
export function getSourceById(id: string): TrackingSource {
  return TRACKING_SOURCES[id] || TRACKING_SOURCES.other
}

export function getSourceColor(id: string): string {
  return getSourceById(id).color
}

export function getSourceEmoji(id: string): string {
  return getSourceById(id).emoji
}

export function formatSourceLabel(id: string): string {
  const source = getSourceById(id)
  return `${source.emoji} ${source.name}`
}

export function getAllSources(): TrackingSource[] {
  return SOURCE_PRIORITY.map(id => TRACKING_SOURCES[id])
}
