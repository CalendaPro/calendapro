'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PlanBadge } from '@/components/marketplace/PlanBadge'
import { compareMarketplacePros } from '@/lib/geo'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transition } from 'framer-motion'

const MarketplaceMap = dynamic(() => import('@/components/marketplace/MarketplaceMap'), { ssr: false })

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Pro = {
  id: string
  username: string
  full_name: string
  bio: string | null
  category: string | null
  city: string | null
  plan: 'starter' | 'premium' | 'infinity'
  avatar_url: string | null
  latitude: number | null
  longitude: number | null
  distance?: number
}

type Stats = {
  totalPros: number
  totalAppointments: number
  uniqueCities: number
} | null

type ViewMode = 'grid' | 'map'

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'Tous',           emoji: '✦',  color: '#7c3aed' },
  { id: 'barbier',    label: 'Barbiers',        emoji: '✂️', color: '#db2777' },
  { id: 'coach',      label: 'Coachs',          emoji: '🎯', color: '#ea580c' },
  { id: 'photo',      label: 'Photographes',    emoji: '📸', color: '#059669' },
  { id: 'freelance',  label: 'Freelances',      emoji: '💻', color: '#2563eb' },
  { id: 'therapeute', label: 'Thérapeutes',     emoji: '💆', color: '#7c3aed' },
  { id: 'sport',      label: 'Coachs sportifs', emoji: '🏋️', color: '#dc2626' },
  { id: 'consultant', label: 'Consultants',     emoji: '📊', color: '#d97706' },
  { id: 'creatif',    label: 'Créatifs',        emoji: '🎨', color: '#0891b2' },
]

const CITIES = [
  'Toutes les villes',
  'Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Montpellier',
  'Strasbourg','Bordeaux','Lille','Rennes','Reims','Le Havre','Saint-Étienne',
  'Toulon','Grenoble','Dijon','Angers','Nîmes','Villeurbanne','Le Mans',
  'Aix-en-Provence','Clermont-Ferrand','Brest','Tours','Amiens','Limoges',
  'Annecy','Perpignan','Boulogne-Billancourt','Metz','Besançon','Orléans',
  'Mulhouse','Rouen','Caen','Nancy','Saint-Denis','Argenteuil','Roubaix',
  'Dunkerque','Tourcoing','Avignon','Créteil','Poitiers','Nanterre',
  'Versailles','Pau','Courbevoie','Vitry-sur-Seine','Colombes','Aulnay-sous-Bois',
  'Asnières-sur-Seine','Rueil-Malmaison','Champigny-sur-Marne',
  'Antibes','La Rochelle','Calais','Cannes','Mérignac',
]

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 48, avatarUrl }: { name: string; size?: number; avatarUrl?: string | null }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const palettes = [
    ['#7c3aed','#a855f7'], ['#db2777','#f43f5e'],
    ['#2563eb','#6366f1'], ['#059669','#14b8a6'],
    ['#d97706','#ef4444'], ['#0891b2','#7c3aed'],
  ]
  const idx = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % palettes.length
  const [from, to] = palettes[idx]
  if (avatarUrl) return (
    <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: size * 0.33,
      fontFamily: "'Outfit', sans-serif", flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// ─── PRO CARD ─────────────────────────────────────────────────────────────────
function ProCard({ pro, idx }: { pro: Pro; idx: number }) {
  const [hovered, setHovered] = useState(false)
  const catObj = CATEGORIES.find(c => c.id === pro.category)

  // Mock badges - in real app, these would come from the pro data
  const badges = {
    topPro: pro.plan === 'infinity' || pro.plan === 'premium',
    fastResponse: Math.random() > 0.5,
    available: Math.random() > 0.3,
    trending: Math.random() > 0.7,
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] } as Transition}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white/70 backdrop-blur-sm border border-violet-100 rounded-2xl p-6 hover:border-violet-400 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
      style={{
        boxShadow: hovered ? '0 16px 48px rgba(124,58,237,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Top accent bar pour infinity */}
      {pro.plan === 'infinity' && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 to-rose-500 rounded-t-2xl" />
      )}

      {/* Badges */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {badges.topPro && (
          <span className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
            ⭐ Top Pro
          </span>
        )}
        {badges.fastResponse && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
            ⚡ Réponse rapide
          </span>
        )}
        {badges.available && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
            🟢 Disponible
          </span>
        )}
        {badges.trending && (
          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full flex items-center gap-1">
            🔥 Trending
          </span>
        )}
      </div>

      {/* ── HEADER ── */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <Avatar name={pro.full_name || pro.username} size={48} avatarUrl={pro.avatar_url} />
          {pro.plan !== 'starter' && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-stone-900 truncate max-w-[140px]">
              {pro.full_name || pro.username}
            </span>
            <PlanBadge plan={pro.plan} />
          </div>

          {pro.category && catObj && (
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full mb-1">
              <span>{catObj.emoji}</span> {catObj.label}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap text-sm text-stone-500">
            {pro.city && (
              <span className="flex items-center gap-1">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {pro.city}
              </span>
            )}
            {pro.distance != null && (
              <span className="font-semibold text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                {formatDistance(pro.distance)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SÉPARATEUR ── */}
      <div className="h-px bg-stone-100 my-3" />

      {/* ── BIO ── */}
      <p className="text-sm text-stone-600 line-clamp-3 flex-1 min-h-[3.5em]">
        {pro.bio || (
          <span className="text-stone-300 italic text-xs">
            Aucune description renseignée.
          </span>
        )}
      </p>

      {/* ── CTA ── */}
      <div className="flex gap-2">
        <Link
          href={`/client/${pro.username}`}
          className="flex-1 text-center py-2 px-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Prendre RDV →
        </Link>
        <Link
          href={`/client/${pro.username}`}
          title="Voir le profil"
          className="py-2 px-2 bg-violet-50 text-violet-600 rounded-xl border border-violet-200 hover:bg-violet-100 transition-colors flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </Link>
      </div>
    </motion.div>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-violet-100 rounded-2xl p-6 space-y-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-100/30 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-rose-100 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gradient-to-r from-violet-100 to-rose-100 rounded w-1/2" />
          <div className="h-2.5 bg-gradient-to-r from-violet-100 to-rose-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-px bg-violet-50" />
      <div className="space-y-2">
        <div className="h-2.5 bg-gradient-to-r from-violet-100 to-rose-100 rounded w-full" />
        <div className="h-2.5 bg-gradient-to-r from-violet-100 to-rose-100 rounded w-3/4" />
        <div className="h-2.5 bg-gradient-to-r from-violet-100 to-rose-100 rounded w-5/6" />
      </div>
      <div className="h-10 bg-gradient-to-r from-violet-100 to-rose-100 rounded-xl" />
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="col-span-full text-center py-20 flex flex-col items-center gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-3xl">🔍</div>
      <h3 className="text-xl font-bold text-stone-900">
        Aucun résultat
      </h3>
      <p className="text-stone-500 max-w-sm leading-relaxed">
        {query
          ? `Aucun professionnel ne correspond à « ${query} ». Essayez un autre terme ou réinitialisez les filtres.`
          : 'Aucun professionnel dans cette catégorie pour le moment.'}
      </p>
    </motion.div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function ClientMarketplacePage() {
  const [pros, setPros] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [city, setCity] = useState('Toutes les villes')
  const [sortBy, setSortBy] = useState<'plan' | 'name' | 'distance'>('plan')
  const [availableNow, setAvailableNow] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  // ── FETCH ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const url = userCoords
      ? `/api/marketplace?lat=${encodeURIComponent(String(userCoords.lat))}&lng=${encodeURIComponent(String(userCoords.lng))}`
      : '/api/marketplace'
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setPros(data.pros ?? [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userCoords])

  // ── GÉOLOC ───────────────────────────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSortBy('distance')
      },
      () => {},
      { timeout: 8000 }
    )
  }, [])

  // ── FILTRES ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result: Pro[] = pros.map(p => ({ ...p }))

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
      )
    }
    if (category !== 'all') result = result.filter(p => p.category === category)
    if (city !== 'Toutes les villes') result = result.filter(p => p.city?.toLowerCase() === city.toLowerCase())

    if (availableNow) {
      result = result.filter(p => p.plan !== 'starter')
    }

    const distTie = sortBy === 'distance' && !!userCoords
    result.sort((a, b) => {
      const c = compareMarketplacePros(
        { plan: a.plan, distance: a.distance },
        { plan: b.plan, distance: b.distance },
        distTie
      )
      if (c !== 0) return c
      return (a.full_name || a.username).localeCompare(b.full_name || b.username, 'fr')
    })

    return result
  }, [pros, search, category, city, sortBy, userCoords, availableNow])

  return (
    <div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Marketplace
        </h1>
        <p className="text-stone-600">
          Trouvez le professionnel idéal pour vos besoins
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par catégorie, ville ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500 bg-white"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGeolocate}
            className="px-4 py-3 border border-stone-200 rounded-xl hover:border-violet-400 transition-colors flex items-center gap-2"
            title="Me localiser"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Localiser
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={availableNow}
              onChange={(e) => setAvailableNow(e.target.checked)}
              className="w-4 h-4 text-violet-600 rounded"
            />
            Disponibles maintenant
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'plan' | 'name' | 'distance')}
            className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-violet-500 bg-white text-sm"
          >
            <option value="plan">Trier par plan</option>
            <option value="name">Trier par nom</option>
            <option value="distance">Trier par distance</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState query={search} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((pro, idx) => (
              <ProCard key={pro.id} pro={pro} idx={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
