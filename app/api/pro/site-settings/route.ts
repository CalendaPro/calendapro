import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'

const PROFILE_FIELDS = [
  'username', 'full_name', 'bio', 'bio_generated', 'city', 'category',
  'phone', 'email_contact',
  'template', 'accent_color', 'design_vibe', 'font_pair', 'btn_style',
  'theme_name', 'font_family', 'hero_image_url', 'logo_url',
  'sections_visible', 'social_links', 'section_order',
  'schedule', 'schedule_exceptions', 'show_schedule',
  'location_address', 'location_lat', 'location_lng',
  'gallery_images', 'show_gallery',
  'cta_button_text', 'cta_button_style', 'cta_button_action', 'cta_custom_url',
  'show_reviews', 'dark_mode', 'font_size',
  'color_palette', 'button_rounded',
  'is_published', 'published_at',
  // Paramètres de paiement Stripe
  'online_payment_enabled', 'deposit_required', 'deposit_type', 'deposit_value', 'allow_full_online_payment',
  // Paramètres d'annulation
  'allow_cancellations', 'cancellation_delay', 'cancellation_delay_custom_value', 'cancellation_delay_custom_unit',
  'keep_deposit_on_late_cancellation', 'allow_reschedule',
  // Paramètres de reçus
  'auto_send_receipt_to_client', 'auto_send_receipt_to_pro', 'receipt_custom_message',
]

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const plan = await getUserPlan(userId)

  const [profileRes, servicesRes, reviewsRes] = await Promise.all([
    supabase.from('profiles').select(PROFILE_FIELDS.join(',')).eq('id', userId).maybeSingle(),
    supabase.from('services').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('reviews').select('id, rating, comment, created_at').eq('pro_id', userId).order('created_at', { ascending: false }).limit(20),
  ])

  const avgRating = reviewsRes.data && reviewsRes.data.length > 0
    ? reviewsRes.data.reduce((s, r) => s + r.rating, 0) / reviewsRes.data.length
    : null

  return NextResponse.json({
    profile: profileRes.data ?? {},
    services: servicesRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    avgRating,
    plan,
  })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const plan = await getUserPlan(userId)

  const allowed = new Set(PROFILE_FIELDS)
  const updates: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) {
      // Plan gating for premium columns
      if (k === 'hero_image_url' && plan === 'free') continue
      updates[k] = v
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) {
    console.error('[site-settings PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: Object.keys(updates) })
}
