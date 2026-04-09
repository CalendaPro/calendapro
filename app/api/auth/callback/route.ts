import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/auth/callback
 *
 * Point d'entrée post-connexion Clerk. Lit le profil Supabase de l'utilisateur
 * et redirige selon son rôle et son état d'onboarding.
 *
 * Query params :
 *   - role : 'pro' ou 'client' (déterminé par la route utilisée)
 *   - redirect_url : URL de retour optionnelle (ex: la page pro consultée avant login)
 *
 * Logique :
 *   Profil existe + role = attendu → Redirection selon onboarding
 *   Profil existe + role ≠ attendu → Erreur role mismatch
 *   Profil inexistant → Créer le profil automatiquement puis rediriger
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth()

  // Pas connecté → retour au sign-in
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Récupérer les query params
  const { searchParams } = new URL(request.url)
  const expectedRole = searchParams.get('role') || 'pro'
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

  // Aucun profil → créer automatiquement le profil avec le rôle attendu
  if (!profile) {
    // Récupérer l'email de l'utilisateur Clerk via clerkClient
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress
    const fullName = user.fullName

    // Créer le profil dans Supabase
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName,
      role: expectedRole,
      onboarding_completed: expectedRole === 'client', // Les clients n'ont pas d'onboarding
    })

    if (insertError) {
      console.error('Erreur création automatique profil:', insertError)
    }

    // Rediriger selon le rôle
    if (expectedRole === 'client') {
      const destination = safeRedirect ?? '/marketplace'
      return NextResponse.redirect(new URL(destination, request.url))
    }
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Profil existe : vérifier le role mismatch
  const currentRole = profile.role ?? 'pro'
  
  if (currentRole !== expectedRole) {
    // Role mismatch : l'utilisateur a un compte PRO mais essaie de se connecter en CLIENT
    const errorUrl = new URL('/auth-error', request.url)
    errorUrl.searchParams.set('error', 'role_mismatch')
    errorUrl.searchParams.set('current_role', currentRole)
    errorUrl.searchParams.set('expected_role', expectedRole)
    return NextResponse.redirect(errorUrl)
  }

  // Role correct : rediriger selon onboarding
  const onboardingCompleted = profile.onboarding_completed ?? false

  if (expectedRole === 'client') {
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
