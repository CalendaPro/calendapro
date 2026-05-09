import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/client-callback
 *
 * Callback spécifique pour les CLIENTS après connexion/inscription.
 * Redirige vers la marketplace ou la page du pro consultée.
 *
 * Query params :
 *   - redirect_url : URL de retour optionnelle (ex: la page pro consultée avant login)
 *   - next : page suivante ('onboarding' ou direct)
 *   - pro : username du pro sélectionné
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth()

  // Pas connecté → retour au client-sign-in
  if (!userId) {
    return NextResponse.redirect(new URL('/client-sign-in', request.url))
  }

  const { searchParams } = new URL(request.url)
  const rawRedirect = searchParams.get('redirect_url') ?? ''
  const next = searchParams.get('next') ?? ''
  const proUsername = searchParams.get('pro') ?? ''

  // Check for pending pro selection in cookies (from marketplace click)
  const cookieStore = await cookies()
  const pendingPro = cookieStore.get('pending_pro_selection')
  let pendingProData: { proId: string; proUsername: string; timestamp: number } | null = null

  if (pendingPro) {
    try {
      pendingProData = JSON.parse(decodeURIComponent(pendingPro.value))
      // Check if cookie is still valid (1 hour)
      if (Date.now() - pendingProData!.timestamp > 3600000) {
        pendingProData = null
      }
    } catch {
      pendingProData = null
    }
  }

  // Sécurité : on n'accepte que les URLs relatives commençant par /
  const safeRedirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : null

  // Smart routing logic
  // 1. If coming from marketplace with pro selected -> onboarding -> pro page
  // 2. If direct ref link -> express onboarding (just registration) -> pro page
  // 3. Otherwise -> full onboarding or marketplace

  if (next === 'onboarding') {
    // User needs to complete onboarding first
    const proTarget = proUsername || pendingProData?.proUsername
    if (proTarget) {
      // Redirect to onboarding with pro context for direct flow
      return NextResponse.redirect(new URL(`/client/onboarding?pro=${proTarget}&flow=direct`, request.url))
    }
    // Full discovery onboarding
    return NextResponse.redirect(new URL('/client/onboarding?flow=explore', request.url))
  }

  // Post-onboarding or direct access
  if (pendingProData) {
    // Clear the cookie after use
    const response = NextResponse.redirect(new URL(`/${pendingProData.proUsername}`, request.url))
    response.cookies.delete('pending_pro_selection')
    return response
  }

  // Default redirect
  const destination = safeRedirect ?? '/marketplace'
  return NextResponse.redirect(new URL(destination, request.url))
}
