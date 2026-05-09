import { createServerSupabaseClient } from '@/lib/supabase-server'
import { clerkClient } from '@clerk/nextjs/server'
import { generateUsername } from '@/lib/generateUsername'
import { logger } from '../logger'

export type EnsureProfileOptions = {
  role?: 'pro' | 'client'
  emailOverride?: string
  fullNameOverride?: string
}

export type EnsureProfileResult = {
  id: string
  username: string
  email: string | null
  full_name: string | null
  role: string
  onboarding_completed: boolean
}

/**
 * Crée ou récupère le profil Supabase pour un userId Clerk.
 * Utilise upsert avec ignoreDuplicates pour être safe contre toute race condition.
 * Ne crée jamais de subscription payante — toujours free par défaut.
 */
export async function ensureProfile(
  userId: string,
  opts: EnsureProfileOptions = {}
): Promise<EnsureProfileResult> {
  const { role = 'pro', emailOverride, fullNameOverride } = opts
  const supabase = createServerSupabaseClient()

  // Vérifier d'abord si le profil existe déjà pour éviter l'appel Clerk inutile
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, username, email, full_name, role, onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  if (existing) {
    // Subscription de sécurité : s'assurer qu'elle existe (ignoreDuplicates = ne change pas un plan payant)
    await supabase
      .from('subscriptions')
      .upsert(
        { user_id: userId, plan: 'free', status: 'active' },
        { onConflict: 'user_id', ignoreDuplicates: true }
      )
    return existing as EnsureProfileResult
  }

  // Profil inexistant → récupérer les données Clerk
  let email = emailOverride ?? null
  let fullName = fullNameOverride ?? null

  if (!email || !fullName) {
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      email = email ?? user.emailAddresses[0]?.emailAddress ?? null
      fullName = fullName ?? user.fullName ?? null
    } catch (err) {
      logger.error('[ensureProfile] Clerk fetch failed:', err)
    }
  }

  const username = generateUsername(fullName)

  const { data: created, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        username,
        email,
        full_name: fullName,
        role,
        onboarding_completed: role === 'client',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    .select('id, username, email, full_name, role, onboarding_completed')
    .maybeSingle()

  if (profileError) {
    logger.error('[ensureProfile] Profile upsert error:', profileError)
    throw new Error(`Profile creation failed: ${profileError.message}`)
  }

  // Subscription free par défaut — ignoreDuplicates protège les plans payants existants
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert(
      { user_id: userId, plan: 'free', status: 'active' },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )

  if (subError) {
    logger.error('[ensureProfile] Subscription upsert error (non-fatal):', subError)
  }

  return (created ?? {
    id: userId,
    username,
    email,
    full_name: fullName,
    role,
    onboarding_completed: role === 'client',
  }) as EnsureProfileResult
}
