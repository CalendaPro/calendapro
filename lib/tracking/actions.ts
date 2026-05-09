'use server'

import { cookies } from 'next/headers'

export async function setSourceCookie(source: string, detectedAt: string) {
  const cookieStore = await cookies()
  const value = encodeURIComponent(JSON.stringify({ source, detectedAt }))
  
  cookieStore.set('calendapro_source', value, {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    path: '/',
    sameSite: 'lax',
    httpOnly: false, // Accessible côté client pour analytics
  })
}
