import { createServerSupabaseClient } from './supabase-server'

export type Plan = 'free' | 'premium' | 'infinity'

// ✅ Utilise le client serveur — sécurisé, jamais exposé au front
export async function getUserPlan(userId: string): Promise<Plan> {
  // Validation basique — évite une requête inutile si userId est vide
  if (!userId) return 'free'

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  // Si pas de subscription ou erreur (ex: user nouveau), c'est free
  if (error || !data) return 'free'

  // Cancelled = retour au free, même si la ligne existe encore
  if (data.status === 'cancelled') return 'free'

  return data.plan as Plan
}

// ✅ Nouvelle fonction utile — vérifie si un user a accès à une feature
export async function userHasPlan(userId: string, requiredPlan: Plan): Promise<boolean> {
  const planHierarchy: Record<Plan, number> = {
    free: 0,
    premium: 1,
    infinity: 2,
  }

  const userPlan = await getUserPlan(userId)
  return planHierarchy[userPlan] >= planHierarchy[requiredPlan]
}