import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type ServiceInput = {
  name: string
  duration: string
  price: number | string
}

type FinalizeBody = {
  username?: string
  fullName?: string
  bio?: string
  city?: string
  category?: string
  accentColor?: string
  template?: string
  vibe?: string
  fontPair?: string
  btnStyle?: string
  services?: ServiceInput[]
  // site-builder v2
  themeName?: string
  fontFamily?: string
  heroImageUrl?: string
  logoUrl?: string
  sectionsVisible?: Record<string, boolean>
  socialLinks?: Record<string, string>
  // site-builder v3
  schedule?: Record<string, unknown>
  scheduleExceptions?: unknown[]
  locationAddress?: string
  locationLat?: number | null
  locationLng?: number | null
  phone?: string
  emailContact?: string
  galleryImages?: string[]
  ctaButtonText?: string
  ctaButtonStyle?: string
  ctaButtonAction?: string
  ctaCustomUrl?: string
  sectionOrder?: string[]
  darkMode?: boolean
  fontSize?: string
  showSchedule?: boolean
  showGallery?: boolean
  showReviews?: boolean
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body: FinalizeBody = await request.json().catch(() => ({}))
  const {
    username,
    fullName,
    bio,
    city,
    category,
    accentColor,
    template,
    vibe,
    fontPair,
    btnStyle,
    services = [],
    themeName,
    fontFamily,
    heroImageUrl,
    logoUrl,
    sectionsVisible,
    socialLinks,
    schedule,
    scheduleExceptions,
    locationAddress,
    locationLat,
    locationLng,
    phone,
    emailContact,
    galleryImages,
    ctaButtonText,
    ctaButtonStyle,
    ctaButtonAction,
    ctaCustomUrl,
    sectionOrder,
    darkMode,
    fontSize,
    showSchedule,
    showGallery,
    showReviews,
  } = body

  if (!username?.trim()) {
    return NextResponse.json({ error: 'Username requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  // ── 1. Upsert profile ────────────────────────────────────────────────────────
  const profileUpdates: Record<string, unknown> = {
    username: username.trim(),
    full_name: fullName ?? null,
    bio: bio ?? null,
    city: city ?? null,
    category: category ?? null,
    accent_color: accentColor ?? '#7c3aed',
    template: template ?? 'minimal',
    design_vibe: vibe ?? 'minimal',
    font_pair: fontPair ?? 'clash-dm',
    btn_style: btnStyle ?? 'gradient',
    is_published: true,
    published_at: now,
    onboarding_completed: true,
    // site-builder v2
    ...(themeName        && { theme_name: themeName }),
    ...(fontFamily       && { font_family: fontFamily }),
    ...(heroImageUrl     && { hero_image_url: heroImageUrl }),
    ...(logoUrl          && { logo_url: logoUrl }),
    ...(sectionsVisible  && { sections_visible: sectionsVisible }),
    ...(socialLinks      && { social_links: socialLinks }),
    // site-builder v3
    ...(schedule            && { schedule }),
    ...(scheduleExceptions  && { schedule_exceptions: scheduleExceptions }),
    ...(locationAddress     && { location_address: locationAddress }),
    ...(locationLat != null && { location_lat: locationLat }),
    ...(locationLng != null && { location_lng: locationLng }),
    ...(phone               && { phone }),
    ...(emailContact        && { email_contact: emailContact }),
    ...(galleryImages       && { gallery_images: galleryImages }),
    ...(ctaButtonText       && { cta_button_text: ctaButtonText }),
    ...(ctaButtonStyle      && { cta_button_style: ctaButtonStyle }),
    ...(ctaButtonAction     && { cta_button_action: ctaButtonAction }),
    ...(ctaCustomUrl        && { cta_custom_url: ctaCustomUrl }),
    ...(sectionOrder        && { section_order: sectionOrder }),
    ...(darkMode !== undefined && { dark_mode: darkMode }),
    ...(fontSize            && { font_size: fontSize }),
    ...(showSchedule !== undefined && { show_schedule: showSchedule }),
    ...(showGallery  !== undefined && { show_gallery:  showGallery  }),
    ...(showReviews  !== undefined && { show_reviews:  showReviews  }),
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId)

  if (profileError) {
    console.error('[finalize] profile update error:', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // ── 2. Delete existing services and re-insert ────────────────────────────────
  await supabase.from('services').delete().eq('user_id', userId)

  const validServices = services.filter(s => s.name?.trim())
  if (validServices.length > 0) {
    const { error: svcError } = await supabase.from('services').insert(
      validServices.map(s => ({
        user_id: userId,
        name: s.name.trim(),
        duration: s.duration ?? '1h',
        price: Number(s.price) || 0,
      }))
    )
    if (svcError) {
      console.error('[finalize] services insert error:', svcError)
    }
  }

  return NextResponse.json({ success: true, username: username.trim() })
}
