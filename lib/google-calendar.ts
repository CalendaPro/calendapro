import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from './logger'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`

// ── OAuth URLs ──────────────────────────────────────────────

export function getGoogleAuthUrl(proId: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: proId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ── Token Exchange ──────────────────────────────────────────

type GoogleTokens = {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token exchange failed: ${err}`)
  }

  return res.json()
}

export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error('Google token refresh failed')
  }

  return res.json()
}

// ── Ensure valid access token ───────────────────────────────

async function getValidAccessToken(proId: string): Promise<string> {
  const supabase = createServerSupabaseClient()

  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('pro_id', proId)
    .eq('provider', 'google')
    .single()

  if (!conn) throw new Error('No Google Calendar connection found')

  // If token is still valid (with 5min buffer), return it
  if (conn.token_expires_at && new Date(conn.token_expires_at) > new Date(Date.now() + 5 * 60000)) {
    return conn.access_token
  }

  // Refresh the token
  if (!conn.refresh_token) throw new Error('No refresh token — re-authorization required')

  const tokens = await refreshGoogleToken(conn.refresh_token)

  await supabase
    .from('calendar_connections')
    .update({
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conn.id)

  return tokens.access_token
}

// ── Fetch Events ────────────────────────────────────────────

type GoogleEvent = {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status: string
  recurrence?: string[]
}

type GoogleEventsResponse = {
  items: GoogleEvent[]
  nextPageToken?: string
}

export async function fetchGoogleEvents(
  proId: string,
  timeMin: string,
  timeMax: string,
  calendarId = 'primary'
): Promise<GoogleEvent[]> {
  const accessToken = await getValidAccessToken(proId)

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Calendar API error: ${err}`)
  }

  const data: GoogleEventsResponse = await res.json()
  return data.items.filter((e) => e.status !== 'cancelled')
}

// ── Sync Events to blocked_slots ────────────────────────────

export async function syncGoogleCalendar(proId: string): Promise<{ synced: number; errors: number }> {
  const supabase = createServerSupabaseClient()
  let synced = 0
  let errors = 0

  // Log sync start
  const { data: logEntry } = await supabase
    .from('sync_logs')
    .insert({
      pro_id: proId,
      provider: 'google',
      direction: 'inbound',
      status: 'success',
    })
    .select('id')
    .single()

  try {
    // Fetch next 90 days of events
    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + 90)

    const events = await fetchGoogleEvents(
      proId,
      now.toISOString(),
      future.toISOString()
    )

    // Upsert blocked slots
    for (const event of events) {
      const startAt = event.start.dateTime || `${event.start.date}T00:00:00Z`
      const endAt = event.end.dateTime || `${event.end.date}T23:59:59Z`
      const allDay = !event.start.dateTime

      try {
        await supabase
          .from('blocked_slots')
          .upsert(
            {
              pro_id: proId,
              source: 'google',
              external_event_id: event.id,
              title: event.summary || 'Événement externe',
              start_at: startAt,
              end_at: endAt,
              all_day: allDay,
              recurring: !!event.recurrence,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'pro_id,source,external_event_id' }
          )
        synced++
      } catch (err) {
        logger.error(`[google-sync] Error upserting event ${event.id}:`, err)
        errors++
      }
    }

    // Clean up blocked slots that no longer exist in Google
    const googleEventIds = events.map((e) => e.id)
    if (googleEventIds.length > 0) {
      await supabase
        .from('blocked_slots')
        .delete()
        .eq('pro_id', proId)
        .eq('source', 'google')
        .not('external_event_id', 'in', `(${googleEventIds.map((id) => `'${id}'`).join(',')})`)
        .gte('start_at', now.toISOString())
    }

    // Update sync log
    if (logEntry?.id) {
      await supabase
        .from('sync_logs')
        .update({
          events_synced: synced,
          status: errors > 0 ? 'partial' : 'success',
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id)
    }

    // Update last_synced_at
    await supabase
      .from('calendar_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('pro_id', proId)
      .eq('provider', 'google')
  } catch (err) {
    if (logEntry?.id) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'error',
          error_message: err instanceof Error ? err.message : String(err),
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id)
    }
    throw err
  }

  return { synced, errors }
}

// ── Google Watch (Push Notifications) ───────────────────────

export async function setupGoogleWatch(proId: string, calendarId = 'primary'): Promise<void> {
  const accessToken = await getValidAccessToken(proId)
  const supabase = createServerSupabaseClient()
  const channelId = `calendapro-${proId}-${Date.now()}`
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/webhook`

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        params: { ttl: '604800' }, // 7 days
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google watch setup failed: ${err}`)
  }

  const watch = await res.json() as {
    id: string
    resourceId: string
    expiration: string
  }

  await supabase
    .from('calendar_connections')
    .update({
      watch_channel_id: watch.id,
      watch_resource_id: watch.resourceId,
      watch_expiration: new Date(Number(watch.expiration)).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('pro_id', proId)
    .eq('provider', 'google')
}

// ── Stop Google Watch ───────────────────────────────────────

export async function stopGoogleWatch(proId: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('watch_channel_id, watch_resource_id, access_token')
    .eq('pro_id', proId)
    .eq('provider', 'google')
    .single()

  if (!conn?.watch_channel_id) return

  const accessToken = await getValidAccessToken(proId)

  await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: conn.watch_channel_id,
      resourceId: conn.watch_resource_id,
    }),
  })

  await supabase
    .from('calendar_connections')
    .update({
      watch_channel_id: null,
      watch_resource_id: null,
      watch_expiration: null,
    })
    .eq('pro_id', proId)
    .eq('provider', 'google')
}
