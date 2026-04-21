import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  const supabase = createServerSupabaseClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, category, city, avatar_url, latitude, longitude')
    .eq('username', username)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Professionnel introuvable' }, { status: 404 })
  }

  // Fetch plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .maybeSingle()

  // Fetch services
  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration, price')
    .eq('user_id', profile.id)
    .order('price', { ascending: true })

  // Fetch reviews with rating aggregation
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, client_id')
    .eq('pro_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const ratingAvg =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  // Verifier si le pro a des bookings a venir (actif)
  const { count: upcomingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('pro_id', profile.id)
    .gte('scheduled_at', new Date().toISOString())
    .lte('scheduled_at', new Date(Date.now() + 48 * 3_600_000).toISOString())
    .in('status', ['upcoming', 'pending'])

  return NextResponse.json({
    ...profile,
    plan: subscription?.plan ?? 'starter',
    services: services ?? [],
    reviews: reviews ?? [],
    rating: ratingAvg ? Math.round(ratingAvg * 10) / 10 : null,
    review_count: reviews?.length ?? 0,
    has_busy_slots: (upcomingCount ?? 0) > 0,
  })
}
