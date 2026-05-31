import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import TemplateMinimal from '@/components/templates/TemplateMinimal'
import TemplateVisuel from '@/components/templates/TemplateVisuel'
import TemplateDirect from '@/components/templates/TemplateDirect'
import { getExistingSourceFromCookies } from '@/lib/tracking/detect'
import { TRACKING_SOURCES } from '@/lib/tracking/sources'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calendapro.fr'

interface ProPublicProfile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  category: string | null
  city: string | null
  plan?: 'free' | 'premium' | 'infinity' | 'starter'
  avatar_url: string | null
  template?: 'minimal' | 'visual' | 'direct'
  accent_color?: string
  is_published?: boolean
  rating?: number | null
  review_count?: number
  phone?: string | null
  address?: string | null
  postal_code?: string | null
  social_links?: Record<string, string> | null
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const serverSupabase = createServerSupabaseClient()

  const { data: profile } = await serverSupabase
    .from('profiles')
    .select('username, full_name, bio, category, city, avatar_url')
    .eq('username', username)
    .single()

  if (!profile) {
    return {
      title: 'Profil non trouvé',
      description: 'Ce profil professionnel n\'existe pas ou n\'est plus disponible.',
    }
  }

  const fullName = profile.full_name || profile.username
  const description = profile.bio || `Prenez rendez-vous avec ${fullName} sur CalendaPro.`
  const title = `${fullName} — Réservez en ligne | CalendaPro`

  return {
    title,
    description,
    keywords: [
      profile.category,
      profile.city,
      'rendez-vous',
      'réservation',
      'professionnel',
      'booking',
      'RDV',
    ].filter(Boolean) as string[],
    openGraph: {
      type: 'profile',
      locale: 'fr_FR',
      url: `${baseUrl}/${profile.username}`,
      siteName: 'CalendaPro',
      title,
      description,
      images: profile.avatar_url
        ? [
            {
              url: profile.avatar_url,
              width: 400,
              height: 400,
              alt: `Photo de ${fullName}`,
            },
          ]
        : [
            {
              url: '/og-default-pro.png',
              width: 1200,
              height: 630,
              alt: `Profil professionnel sur CalendaPro`,
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : ['/og-default-pro.png'],
    },
    alternates: {
      canonical: `/${profile.username}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
  }
}

// Generate Schema.org JSON-LD structured data
function generateSchemaOrg(
  profile: ProPublicProfile,
  services: Array<{ name: string; price?: number | null; duration?: string }>
): Record<string, unknown> {
  const fullName = profile.full_name || profile.username
  const profileUrl = `${baseUrl}/${profile.username}`

  // LocalBusiness schema
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': profile.category ? getBusinessType(profile.category) : 'LocalBusiness',
    name: fullName,
    description: profile.bio,
    url: profileUrl,
    image: profile.avatar_url,
    ...(profile.city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.city,
        ...(profile.postal_code && { postalCode: profile.postal_code }),
        addressCountry: 'FR',
      },
    }),
    ...(profile.phone && {
      telephone: profile.phone,
    }),
    ...(profile.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: profile.rating,
        reviewCount: profile.review_count || 0,
      },
    }),
  }

  // Services as Service schema
  const serviceSchemas = services.slice(0, 5).map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    provider: {
      '@type': profile.category ? getBusinessType(profile.category) : 'LocalBusiness',
      name: fullName,
    },
    ...(service.price && {
      offers: {
        '@type': 'Offer',
        price: service.price,
        priceCurrency: 'EUR',
      },
    }),
    ...(service.duration && {
      estimatedCost: {
        '@type': 'Duration',
        description: service.duration,
      },
    }),
  }))

  // WebSite schema for search action
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `CalendaPro - ${fullName}`,
    url: profileUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/marketplace?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [localBusiness, website, ...serviceSchemas],
  }
}

// Map category to Schema.org business type
function getBusinessType(category: string): string {
  const typeMap: Record<string, string> = {
    barbier: 'HairSalon',
    coiffeur: 'HairSalon',
    coach: 'ProfessionalService',
    sport: 'SportsActivityLocation',
    photo: 'ProfessionalService',
    freelance: 'ProfessionalService',
    therapeute: 'MedicalBusiness',
    consultant: 'ProfessionalService',
    creatif: 'ProfessionalService',
  }
  return typeMap[category] || 'LocalBusiness'
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

  // Préparer les données de tracking pour le client
  const trackingSource = detectedSource.source
  const trackingDetectedAt = new Date().toISOString()

  const serverSupabase = createServerSupabaseClient()

  // Cache pour le profil public (60s revalidation)
  // ATTENTION: Ne sélectionner UNIQUEMENT les champs publics - pas d'email, téléphone, ou données privées
  const getCachedProfile = unstable_cache(
    async (uname: string) => {
      const { data } = await serverSupabase
        .from('profiles')
        .select(`
          id, username, full_name, bio, category, city,
          avatar_url, template, accent_color, is_published,
          theme_name, font_family,
          hero_image_url, logo_url, sections_visible, social_links,
          schedule, location_address, location_lat, location_lng,
          cta_button_text, cta_button_style, cta_button_action, cta_custom_url,
          section_order, dark_mode, font_size, show_schedule, show_gallery, show_reviews,
          published_at, design_vibe, font_pair, btn_style
        `)
        .eq('username', uname)
        .single()
      return data
    },
    ['pro-public-profile'],
    { revalidate: 60, tags: ['pro-profile'] }
  )

  const profile = await getCachedProfile(username)

  if (!profile) notFound()

  const safeProfile = profile as ProPublicProfile
  const isPublished = safeProfile.is_published !== false
  if (!isPublished) notFound()

  const template = safeProfile.template ?? 'minimal'
  const accentColor = safeProfile.accent_color ?? '#7c3aed'

  // Cache pour les services
  const getCachedServices = unstable_cache(
    async (userId: string) => {
      const { data } = await serverSupabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      return data ?? []
    },
    ['pro-services'],
    { revalidate: 60, tags: ['pro-services'] }
  )

  const services = await getCachedServices(profile.id)

  // Utiliser la RPC get_pro_photos pour éviter le N+1
  const getCachedPhotos = unstable_cache(
    async (userId: string) => {
      const { data: photoPaths } = await serverSupabase.rpc('get_pro_photo_paths', { pro_id: userId })
      const items = Array.isArray(photoPaths) ? photoPaths : []

      // Générer les URLs signées en batch
      const photos = await Promise.all(
        items.map(async (it: { name: string; full_path: string }) => {
          const path = it.full_path
          if (!path) return null

          const { data: signed } = await serverSupabase.storage.from('pro-photos').createSignedUrl(path, 60 * 60)
          const signedUrl = (signed as any)?.signedUrl as string | undefined  // reason: Supabase signedUrl shape not in generated types

          if (signedUrl) return { url: signedUrl, path }

          const { data: pub } = serverSupabase.storage.from('pro-photos').getPublicUrl(path)
          const url = pub?.publicUrl
          if (!url) return null

          return { url, path }
        }),
      )

      return photos.filter(Boolean) as Array<{ url: string; path?: string }>
    },
    ['pro-photos'],
    { revalidate: 60, tags: ['pro-photos'] }
  )

  const safePhotos = await getCachedPhotos(profile.id)

  const Template = template === 'direct' ? TemplateDirect : template === 'visual' ? TemplateVisuel : TemplateMinimal

  // Generate Schema.org structured data
  const schemaData = generateSchemaOrg(safeProfile, services ?? [])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <Template
        profile={safeProfile}
        accentColor={accentColor}
        photos={safePhotos}
        services={services ?? []}
        trackingSource={trackingSource}
        trackingDetectedAt={trackingDetectedAt}
        socialLinks={safeProfile.social_links}
      />
    </>
  )
}