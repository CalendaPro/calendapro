import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ensureProfile } from '@/lib/auth/ensure-profile'
import { cookies } from 'next/headers'

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
  console.log('🔄 CALLBACK CALLED')
  
  const { userId } = await auth()
  console.log('👤 userId:', userId)

  // Récupérer les query params dès le début
  const { searchParams } = new URL(request.url)

  // Pas connecté → retour au sign-in (avec planId conservé si présent)
  if (!userId) {
    console.log('❌ No userId, redirecting to /login')
    const loginUrl = new URL('/login', request.url)
    const planId = searchParams.get('planId')
    if (planId) {
      loginUrl.searchParams.set('planId', planId)
    }
    return NextResponse.redirect(loginUrl)
  }

  const expectedRole = searchParams.get('role') || 'pro'
  const rawRedirect = searchParams.get('redirect_url') ?? ''
  
  console.log('🎯 expectedRole:', expectedRole)
  console.log('🔗 rawRedirect:', rawRedirect)
  
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
  
  console.log('📊 profile:', profile)

  // Aucun profil → créer automatiquement le profil avec le rôle attendu
  if (!profile) {
    console.log('🆕 No profile found, calling ensureProfile...')

    try {
      await ensureProfile(userId, { role: expectedRole as 'pro' | 'client' })
      console.log('✅ Profile ensured successfully')
    } catch (err) {
      console.error('❌ ensureProfile failed in callback:', err)
    }

    // Si un redirect_url est fourni (ex: /api/auth/sync avec planId), l'utiliser
    if (safeRedirect) {
      console.log('🚀 Redirecting to safeRedirect:', safeRedirect)
      return NextResponse.redirect(new URL(safeRedirect, request.url))
    }

    // Sinon, rediriger selon le rôle par défaut
    if (expectedRole === 'client') {
      console.log('🚀 Redirecting CLIENT to /client/onboarding')
      return NextResponse.redirect(new URL('/client/onboarding', request.url))
    }
    console.log('🚀 Redirecting PRO to /onboarding')
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
    // Conserver le planId si présent dans l'URL pour continuer le flow après correction
    const planId = searchParams.get('planId')
    if (planId) {
      errorUrl.searchParams.set('planId', planId)
    }
    return NextResponse.redirect(errorUrl)
  }

  // Role correct : rediriger selon onboarding et redirect_url
  const onboardingCompleted = profile.onboarding_completed ?? false

  // 🔴 PRIORITÉ ABSOLUE #1 : Si redirect_url contient /api/auth/sync (sélection de plan)
  // On doit TOUJOURS passer par là pour gérer les plans payants, même si onboarding pas fait
  if (safeRedirect && safeRedirect.includes('/api/auth/sync')) {
    console.log('🚀 Redirecting to sync route (plan selection):', safeRedirect)
    return NextResponse.redirect(new URL(safeRedirect, request.url))
  }

  // 🔴 PRIORITÉ #2 : Si redirect_url générique fourni, l'utiliser
  if (safeRedirect) {
    console.log('🚀 Redirecting to safeRedirect:', safeRedirect)
    return NextResponse.redirect(new URL(safeRedirect, request.url))
  }

  if (expectedRole === 'client') {
    // CLIENT : si onboarding terminé → dashboard client ou pro sélectionné, sinon onboarding
    if (onboardingCompleted) {
      // Check for pending pro selection cookie (priority redirect)
      const cookieStore = await cookies()
      const pendingPro = cookieStore.get('pending_pro_selection')
      if (pendingPro) {
        try {
          const pendingProData = JSON.parse(decodeURIComponent(pendingPro.value))
          if (pendingProData.proUsername && Date.now() - pendingProData.timestamp < 3600000) {
            // Valid cookie - redirect to client booking page and clear cookie
            const response = NextResponse.redirect(new URL(`/client/${pendingProData.proUsername}`, request.url))
            response.cookies.delete('pending_pro_selection')
            return response
          }
        } catch {
          // Invalid cookie format, ignore
        }
      }
      const destination = safeRedirect ?? '/client'
      return NextResponse.redirect(new URL(destination, request.url))
    }
    // Redirect to onboarding with pro context if available
    const cookieStore = await cookies()
    const pendingPro = cookieStore.get('pending_pro_selection')
    let onboardingUrl = '/client/onboarding'
    if (pendingPro) {
      try {
        const pendingProData = JSON.parse(decodeURIComponent(pendingPro.value))
        if (pendingProData.proUsername && Date.now() - pendingProData.timestamp < 3600000) {
          onboardingUrl = `/client/onboarding?pro=${pendingProData.proUsername}&flow=direct`
        }
      } catch {
        // Invalid cookie, use default onboarding
      }
    }
    return NextResponse.redirect(new URL(onboardingUrl, request.url))
  }

  // PRO : onboarding par défaut (seulement si pas de redirect_url fourni - déjà vérifié plus haut)
  if (!onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
