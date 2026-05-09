import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar/google/connect
 * Redirects pro to Google OAuth consent screen.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const url = getGoogleAuthUrl(userId)
  return NextResponse.redirect(url)
}
