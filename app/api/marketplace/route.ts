import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { compareMarketplacePros, haversineKm } from '@/lib/geo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const latStr = searchParams.get('lat')
    const lngStr = searchParams.get('lng')

    let userLat: number | null = null
    let userLng: number | null = null
    if (latStr && lngStr) {
      const la = parseFloat(latStr)
      const ln = parseFloat(lngStr)
      if (Number.isFinite(la) && Number.isFinite(ln)) {
        userLat = la
        userLng = ln
      }
    }

    let profileQuery = supabase
      .from('profiles')
      .select('id, username, full_name, bio, category, city, avatar_url, latitude, longitude')
      .not('username', 'is', null)
      .not('full_name', 'is', null)

    if (category && category !== 'all') {
      profileQuery = profileQuery.eq('category', category)
    }
    if (city && city !== 'Toutes les villes') {
      profileQuery = profileQuery.ilike('city', city)
    }
    if (search) {
      profileQuery = profileQuery.or(
        `full_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%,category.ilike.%${search}%,city.ilike.%${search}%`
      )
    }

    const { data: profiles, error: profileError } = await profileQuery.limit(100)

    if (profileError) {
      console.error('Supabase profiles error:', profileError)
      return NextResponse.json({ pros: [], stats: null }, { status: 200 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ pros: [], stats: null })
    }

    const userIds = profiles.map(p => p.id)

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, plan, status')
      .in('user_id', userIds)
      .eq('status', 'active')

    const planMap: Record<string, 'starter' | 'premium' | 'infinity'> = {}
    subscriptions?.forEach(s => {
      planMap[s.user_id] = s.plan as 'starter' | 'premium' | 'infinity'
    })

    const distanceKmById: Record<string, number> = {}
    if (userLat != null && userLng != null) {
      const { data: distRows, error: rpcError } = await supabase.rpc('marketplace_pros_near', {
        user_lat: userLat,
        user_lng: userLng,
      })
      if (rpcError) {
        console.warn('marketplace_pros_near (PostGIS) — repli Haversine:', rpcError.message)
      } else if (distRows && Array.isArray(distRows)) {
        for (const row of distRows as { profile_id: string; distance_m: number }[]) {
          distanceKmById[row.profile_id] = row.distance_m / 1000
        }
      }
    }

    const pros = profiles.map(profile => {
      const lat = profile.latitude != null ? Number(profile.latitude) : null
      const lng = profile.longitude != null ? Number(profile.longitude) : null
      let distance: number | undefined
      if (userLat != null && userLng != null && lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        distance = distanceKmById[profile.id]
        if (distance == null || Number.isNaN(distance)) {
          distance = haversineKm(userLat, userLng, lat, lng)
        }
      }
      return {
        ...profile,
        latitude: lat,
        longitude: lng,
        plan: planMap[profile.id] ?? 'starter',
        distance,
      }
    })

    const tieDist = userLat != null && userLng != null
    pros.sort((a, b) => {
      const c = compareMarketplacePros(
        { plan: a.plan, distance: a.distance },
        { plan: b.plan, distance: b.distance },
        tieDist
      )
      if (c !== 0) return c
      return (a.full_name || a.username).localeCompare(b.full_name || b.username, 'fr')
    })

    const { count: totalPros } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('username', 'is', null)
      .not('full_name', 'is', null)

    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    const { data: citiesData } = await supabase
      .from('profiles')
      .select('city')
      .not('city', 'is', null)
      .not('username', 'is', null)

    const uniqueCities = new Set(citiesData?.map(r => r.city?.toLowerCase().trim()).filter(Boolean)).size

    const stats = {
      totalPros: totalPros ?? 0,
      totalAppointments: totalAppointments ?? 0,
      uniqueCities: uniqueCities ?? 0,
    }

    return NextResponse.json({ pros, stats })
  } catch (err) {
    console.error('Marketplace API error:', err)
    return NextResponse.json({ pros: [], stats: null }, { status: 500 })
  }
}
