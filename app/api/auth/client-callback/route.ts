import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/client-callback
 *
 * Callback spécifique pour les CLIENTS après connexion/inscription.
 * Redirige vers la marketplace ou la page du pro consultée.
 *
 * Query params :
 *   - redirect_url : URL de retour optionnelle (ex: la page pro consultée avant login)
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth()

  // Pas connecté → retour au client-sign-in
  if (!userId) {
    return NextResponse.redirect(new URL('/client-sign-in', request.url))
  }

  // Récupère le redirect_url passé en query param (ex: /:username)
  const { searchParams } = new URL(request.url)
  const rawRedirect = searchParams.get('redirect_url') ?? ''
  // Sécurité : on n'accepte que les URLs relatives commençant par /
  const safeRedirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : null

  // CLIENT : retour vers la page du pro consultée, ou la marketplace
  const destination = safeRedirect ?? '/marketplace'
  return NextResponse.redirect(new URL(destination, request.url))
}
