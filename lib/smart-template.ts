export type SmartTemplate = 'minimal' | 'visual' | 'direct'
export type Goal = 'noshows' | 'clients' | 'time' | 'revenue'

export function smartTemplateFrom(category: string, goal: Goal): SmartTemplate {
  const VISUAL = new Set([
    'barbier',
    'coiffeur',
    'estheticienne',
    'nail-art',
    'massage',
    'photographe',
    'videaste',
    'tatoueur',
    'graphiste',
  ])
  const DIRECT = new Set([
    'coach-vie',
    'coach-sport',
    'coach-business',
    'psychologue',
    'osteopathe',
    'osteopathe-sport',
    'kine',
    'acupuncteur',
    'consultant',
    'nutritionniste',
  ])
  const MINIMAL = new Set(['developpeur', 'formateur', 'professeur', 'avocat', 'notaire', 'autre'])

  if (goal === 'clients' && VISUAL.has(category)) return 'visual'
  if ((goal === 'time' || goal === 'revenue') && DIRECT.has(category)) return 'direct'
  if (goal === 'noshows' && MINIMAL.has(category)) return 'minimal'
  return VISUAL.has(category) ? 'visual' : 'minimal'
}
