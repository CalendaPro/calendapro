import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/auth/check
 *
 * Vérifie l'état de connexion de l'utilisateur et redirige selon son rôle.
 *
 * Logique :
 *   Pas connecté → /login
 *   PRO + onboarding_completed = false → /onboarding
 *   PRO + onboarding_completed = true → /dashboard
 *   CLIENT → /marketplace
 *   Profil inexistant → Créer le profil automatiquement puis rediriger
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth()

  // Pas connecté → redirection vers /login
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  // Aucun profil → créer automatiquement le profil
  if (!profile) {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userMetadata = user.unsafeMetadata || {}
    const role = userMetadata.role === 'client' ? 'client' : 'pro'

    // Créer le profil dans Supabase
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      email: user.emailAddresses[0]?.emailAddress,
      full_name: user.fullName,
      role,
      onboarding_completed: role === 'client',
    })

    if (insertError) {
      console.error('Erreur création automatique profil:', insertError)
    }

    // Rediriger selon le rôle
    if (role === 'client') {
      return NextResponse.redirect(new URL('/marketplace', request.url))
    }
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  const role = profile.role ?? 'pro'
  const onboardingCompleted = profile.onboarding_completed ?? false

  if (role === 'client') {
    return NextResponse.redirect(new URL('/marketplace', request.url))
  }

  // PRO
  if (!onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
