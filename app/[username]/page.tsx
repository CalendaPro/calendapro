import { notFound } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import TemplateMinimal from '@/components/templates/TemplateMinimal'
import TemplateVisuel from '@/components/templates/TemplateVisuel'
import TemplateDirect from '@/components/templates/TemplateDirect'
import { getExistingSourceFromCookies } from '@/lib/tracking/detect'
import { TRACKING_SOURCES } from '@/lib/tracking/sources'

interface ProPublicProfile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  category: string | null
  city: string | null
  plan: 'free' | 'premium' | 'infinity' | 'starter'
  avatar_url: string | null
  template?: 'minimal' | 'visual' | 'direct'
  accent_color?: string
  is_published?: boolean
  rating?: number | null
  review_count?: number
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { username } = await params
  const query = await searchParams

  // Détecter la source d'acquisition depuis searchParams + headers
  let detectedSource = { source: 'direct' }

  const ref = typeof query.ref === 'string' ? query.ref : undefined
  const utmSource = typeof query.utm_source === 'string' ? query.utm_source : undefined
  const headersList = await headers()
  const referer = headersList.get('referer') || ''

  if (ref && TRACKING_SOURCES[ref]) {
    detectedSource = { source: ref }
  } else if (utmSource) {
    detectedSource = { source: utmSource }
  } else if (referer) {
    // Basic referrer detection
    const host = (() => { try { return new URL(referer).hostname } catch { return '' } })()
    if (host.includes('google')) detectedSource = { source: 'google' }
    else if (host.includes('instagram')) detectedSource = { source: 'instagram' }
    else if (host.includes('facebook') || host.includes('fb.')) detectedSource = { source: 'facebook' }
    else if (host.includes('tiktok')) detectedSource = { source: 'tiktok' }
    else if (host.includes('linkedin')) detectedSource = { source: 'linkedin' }
  }

  // Vérifier si un cookie existe déjà
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.get('calendapro_source')?.value ?? null
  const existingSource = getExistingSourceFromCookies(
    cookieHeader ? `calendapro_source=${cookieHeader}` : null
  )

  if (detectedSource.source === 'direct' && existingSource) {
    detectedSource = existingSource
  }

  // Mettre à jour le cookie
  const sourceCookieValue = encodeURIComponent(JSON.stringify({
    source: detectedSource.source,
    detectedAt: new Date().toISOString(),
  }))
  cookieStore.set('calendapro_source', sourceCookieValue, {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    path: '/',
    sameSite: 'lax'
  })

  const serverSupabase = createServerSupabaseClient()

  const { data: profile } = await serverSupabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const safeProfile = profile as ProPublicProfile
  const isPublished = safeProfile.is_published !== false
  if (!isPublished) notFound()

  const template = safeProfile.template ?? 'minimal'
  const accentColor = safeProfile.accent_color ?? '#7c3aed'

  const { data: services } = await serverSupabase
    .from('services')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })

  const prefix = `${profile.id}/`
  const { data: photoList } = await serverSupabase.storage.from('pro-photos').list(prefix)
  const items = Array.isArray(photoList) ? photoList : []

  const photos = await Promise.all(
    items.map(async (it: any) => {
      const name = it?.name ?? ''
      if (!name) return null
      const path = `${prefix}${name}`.replace(/^\//, '')

      const { data: signed } = await serverSupabase.storage.from('pro-photos').createSignedUrl(path, 60 * 60)
      const signedUrl = (signed as any)?.signedUrl as string | undefined

      if (signedUrl) return { url: signedUrl, path }

      const { data: pub } = serverSupabase.storage.from('pro-photos').getPublicUrl(path)
      const url = pub?.publicUrl
      if (!url) return null

      return { url, path }
    }),
  )

  const safePhotos = photos.filter(Boolean) as Array<{ url: string; path?: string }>

  const Template = template === 'direct' ? TemplateDirect : template === 'visual' ? TemplateVisuel : TemplateMinimal

  return (
    <Template
      profile={safeProfile}
      accentColor={accentColor}
      photos={safePhotos}
      services={services ?? []}
    />
  )
}