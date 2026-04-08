import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/auth/callback
 *
 * Point d'entrée post-connexion. Lit le profil Supabase de l'utilisateur
 * et redirige selon son rôle et son état d'onboarding.
 *
 * Query params :
 *   - redirect_url : URL de retour optionnelle (ex: la page pro consultée avant login)
 *
 * Logique :
 *   PRO  + onboarding_completed = false  → /onboarding
 *   PRO  + onboarding_completed = true   → /dashboard
 *   CLIENT                               → redirect_url ?? /marketplace
 *   Profil inexistant                    → Créer le profil automatiquement puis rediriger
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth()

  // Pas connecté → retour au sign-in
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Récupère le redirect_url passé en query param (ex: /:username)
  const { searchParams } = new URL(request.url)
  const rawRedirect = searchParams.get('redirect_url') ?? ''
  // Sécurité : on n'accepte que les URLs relatives commençant par /
  const safeRedirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : null

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  // Aucun profil → créer automatiquement le profil
  if (!profile) {
    // Récupérer les metadata de l'utilisateur Clerk pour déterminer le rôle
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
      onboarding_completed: role === 'client', // Les clients n'ont pas d'onboarding
    })

    if (insertError) {
      console.error('Erreur création automatique profil:', insertError)
    }

    // Rediriger selon le rôle
    if (role === 'client') {
      const destination = safeRedirect ?? '/marketplace'
      return NextResponse.redirect(new URL(destination, request.url))
    }
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  const role = profile.role ?? 'pro'
  const onboardingCompleted = profile.onboarding_completed ?? false

  if (role === 'client') {
    // CLIENT : retour vers la page du pro consultée, ou la marketplace
    const destination = safeRedirect ?? '/marketplace'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // PRO
  if (!onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
