import { NextResponse } from 'next/server'
import { exchangeGoogleCode, syncGoogleCalendar, setupGoogleWatch } from '@/lib/google-calendar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar/google/callback?code=...&state=proId
 * Handles Google OAuth callback after user grants consent.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const proId = searchParams.get('state')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')

  if (error) {
    logger.error('[google-callback] OAuth error:', error)
    return NextResponse.redirect(`${appUrl}/dashboard/settings?sync_error=${error}`)
  }

  if (!code || !proId) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?sync_error=missing_params`)
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code)
    const supabase = createServerSupabaseClient()

    // Get user email from Google
    let providerEmail: string | undefined
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json()
        providerEmail = userInfo.email
      }
    } catch {}

    // Upsert calendar connection
    await supabase
      .from('calendar_connections')
      .upsert(
        {
          pro_id: proId,
          provider: 'google',
          provider_email: providerEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          calendar_id: 'primary',
          sync_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'pro_id,provider' }
      )

    // Initial sync
    await syncGoogleCalendar(proId)

    // Setup push notifications
    try {
      await setupGoogleWatch(proId)
    } catch (watchErr) {
      logger.error('[google-callback] Watch setup failed (non-blocking):', watchErr)
    }

    return NextResponse.redirect(`${appUrl}/dashboard/settings?sync_success=google`)
  } catch (err) {
    logger.error('[google-callback] Error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/settings?sync_error=exchange_failed`)
  }
}
