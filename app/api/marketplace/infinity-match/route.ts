import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { addDays, format, setHours, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { haversineKm, PLAN_SORT_RANK } from '@/lib/geo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Plan = 'starter' | 'premium' | 'infinity'

type ProfileRow = {
  id: string
  username: string
  full_name: string
  bio: string | null
  category: string | null
  city: string | null
  avatar_url: string | null
  latitude: number | null
  longitude: number | null
}

const CATEGORY_HINTS: { re: RegExp; cat: string }[] = [
  { re: /coach\s*sport|sportif|muscu|fitness|running|salle|sport\b/i, cat: 'sport' },
  { re: /barbier|barber/i, cat: 'barbier' },
  { re: /photo|photographe/i, cat: 'photo' },
  { re: /freelance|développeur|dev\b|graphiste/i, cat: 'freelance' },
  { re: /thérapeute|ost[eo]|kiné|psychologue|massage/i, cat: 'therapeute' },
  { re: /consultant|conseil/i, cat: 'consultant' },
  { re: /créatif|design|tatou/i, cat: 'creatif' },
  { re: /coach\b(?!.*sport)/i, cat: 'coach' },
]

function inferCategory(text: string): string | null {
  const t = text.toLowerCase()
  for (const { re, cat } of CATEGORY_HINTS) {
    if (re.test(t)) return cat
  }
  return null
}

function prefersMorning(text: string) {
  return /matin|^\s*(9|10|11)\s*h/i.test(text) || /demain\s*matin/i.test(text)
}

async function suggestSlot(proUserId: string, userQuery: string) {
  const tomorrow = addDays(new Date(), 1)
  const day0 = startOfDay(tomorrow)
  const day1 = addDays(day0, 1)
  const { data: busy } = await supabase
    .from('appointments')
    .select('date')
    .eq('user_id', proUserId)
    .gte('date', day0.toISOString())
    .lt('date', day1.toISOString())

  const hours = prefersMorning(userQuery)
    ? [9, 10, 11, 12]
    : [10, 11, 14, 15, 16, 17]

  const taken = new Set((busy ?? []).map(a => new Date(a.date).getHours()))
  for (const h of hours) {
    if (!taken.has(h)) {
      const d = setHours(day0, h)
      return {
        iso: d.toISOString(),
        label: format(d, "EEEE d MMMM 'à' HH:mm", { locale: fr }),
      }
    }
  }
  const d = setHours(day0, 10)
  return {
    iso: d.toISOString(),
    label: format(d, "EEEE d MMMM 'à' HH:mm", { locale: fr }),
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    const lat = typeof body.lat === 'number' ? body.lat : parseFloat(body.lat)
    const lng = typeof body.lng === 'number' ? body.lng : parseFloat(body.lng)
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

    if (query.length < 3) {
      return NextResponse.json({ error: 'Décrivez votre besoin (au moins 3 caractères).' }, { status: 400 })
    }

    const targetCat = inferCategory(query)

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, category, city, avatar_url, latitude, longitude')
      .not('username', 'is', null)
      .not('full_name', 'is', null)
      .limit(120)

    if (error || !profiles?.length) {
      return NextResponse.json({ error: 'Aucun professionnel disponible.' }, { status: 200 })
    }

    const ids = profiles.map(p => p.id)
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, plan, status')
      .in('user_id', ids)
      .eq('status', 'active')

    const planByUser: Record<string, Plan> = {}
    subs?.forEach(s => {
      planByUser[s.user_id] = s.plan as Plan
    })

    let candidates: (ProfileRow & { plan: Plan; distance?: number })[] = profiles.map(p => ({
      ...p,
      plan: planByUser[p.id] ?? 'starter',
    }))

    if (targetCat) {
      const matched = candidates.filter(p => p.category === targetCat)
      if (matched.length > 0) candidates = matched
    }

    const qlow = query.toLowerCase()
    const scored = candidates.map(p => {
      let score = 0
      const pr = PLAN_SORT_RANK[p.plan] ?? 3
      score += (3 - pr) * 250
      if (targetCat && p.category === targetCat) score += 400
      const bio = (p.bio ?? '').toLowerCase()
      const name = (p.full_name ?? '').toLowerCase()
      const chunks = qlow.split(/\s+/).filter((w: string) => w.length > 2)
      for (const w of chunks) {
        if (bio.includes(w) || name.includes(w)) score += 40
      }
      let distanceKm: number | undefined
      if (hasCoords && p.latitude != null && p.longitude != null) {
        const d = haversineKm(lat, lng, Number(p.latitude), Number(p.longitude))
        distanceKm = d
        score += Math.max(0, 80 - d * 2)
      }
      const pro = { ...p, distance: distanceKm }
      return { pro, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]?.pro
    if (!best) {
      return NextResponse.json({ error: 'Aucune correspondance.' }, { status: 200 })
    }

    const slot = await suggestSlot(best.id, query)

    return NextResponse.json({
      match: {
        id: best.id,
        username: best.username,
        full_name: best.full_name,
        bio: best.bio,
        category: best.category,
        city: best.city,
        avatar_url: best.avatar_url,
        plan: best.plan,
        distance: best.distance,
      },
      slot,
      hint: targetCat
        ? `Catégorie détectée : ${targetCat}`
        : 'Recherche élargie à tous les pros — affinez avec un métier (ex. coach sportif).',
    })
  } catch (e) {
    console.error('infinity-match', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
