'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PlanBadge } from '@/components/marketplace/PlanBadge'
import { compareMarketplacePros } from '@/lib/geo'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transition } from 'framer-motion'
import InfinityMatch from '@/components/marketplace/InfinityMatch'
import {
  LayoutGrid, Scissors, Target, Camera, Laptop, Sparkles,
  Dumbbell, TrendingUp, Palette, MapPin, ArrowRight, Heart,
  Locate, RotateCcw, Grid2X2, Map,
} from 'lucide-react'

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
type Category = { id: string; label: string; icon: React.ElementType; color: string }

const CATEGORIES: Category[] = [
  { id: 'all',        label: 'Tous',           icon: LayoutGrid,  color: '#4F46E5' },
  { id: 'barbier',    label: 'Barbiers',        icon: Scissors,    color: '#db2777' },
  { id: 'coach',      label: 'Coachs',          icon: Target,      color: '#ea580c' },
  { id: 'photo',      label: 'Photographes',    icon: Camera,      color: '#059669' },
  { id: 'freelance',  label: 'Freelances',      icon: Laptop,      color: '#2563eb' },
  { id: 'therapeute', label: 'Thérapeutes',     icon: Sparkles,    color: '#7c3aed' },
  { id: 'sport',      label: 'Coachs sportifs', icon: Dumbbell,    color: '#dc2626' },
  { id: 'consultant', label: 'Consultants',     icon: TrendingUp,  color: '#d97706' },
  { id: 'creatif',    label: 'Créatifs',        icon: Palette,     color: '#0891b2' },
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
function ProCard({ pro, idx, isFav, onToggleFav }: { pro: Pro; idx: number; isFav: boolean; onToggleFav: (pro: Pro) => void }) {
  const catObj = CATEGORIES.find(c => c.id === pro.category)
  const CatIcon = catObj?.icon
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] } as Transition}
      className="glass-card-white"
      style={{
        overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', cursor: 'pointer',
        border: `1.5px solid ${pro.plan === 'infinity' ? '#c7d2fe' : 'var(--cl-border)'}`,
      }}
      whileHover={{
        y: -5,
        boxShadow: '0 24px 56px rgba(79,70,229,0.10), 0 4px 16px rgba(79,70,229,0.06)',
        borderColor: pro.plan === 'infinity' ? '#a5b4fc' : 'rgba(79,70,229,0.2)',
      }}
    >
      {pro.plan === 'infinity' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #4F46E5, #6366f1, #8B5CF6)' }} />
      )}
      <div style={{ padding: '1.2rem 1.2rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={pro.full_name || pro.username} size={48} avatarUrl={pro.avatar_url} />
            {pro.plan !== 'starter' && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' } as Transition}
                style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' as const }}>
              <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: 'var(--cl-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 140 }}>
                {pro.full_name || pro.username}
              </span>
              <PlanBadge plan={pro.plan} />
            </div>
            {catObj && CatIcon && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 600, color: catObj.color, background: `${catObj.color}14`, border: `1px solid ${catObj.color}28`, padding: '0.18rem 0.5rem', borderRadius: 100, marginBottom: '0.25rem', fontFamily: "'DM Sans', sans-serif" }}>
                <CatIcon size={10} strokeWidth={2} /> {catObj.label}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const }}>
              {pro.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  <MapPin size={9} strokeWidth={2} />
                  {pro.city}
                </span>
              )}
              {pro.distance != null && (
                <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.12rem 0.4rem', borderRadius: 100, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontFamily: "'DM Sans', sans-serif" }}>
                  {formatDistance(pro.distance)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--cl-border)', marginBottom: '0.65rem' }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--cl-text-muted)', lineHeight: 1.65, display: '-webkit-box' as const, WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', minHeight: '3.75em', fontFamily: "'DM Sans', sans-serif" }}>
          {pro.bio || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Aucune description renseignée.</span>}
        </p>
      </div>
      <div style={{ padding: '0.75rem 1.2rem', marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
        <Link
          href={`/client/${pro.username}`}
          className="btn-glow"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 16px rgba(79,70,229,0.2)' }}
        >
          Prendre RDV
          <ArrowRight size={11} strokeWidth={2.5} />
        </Link>
        <button
          onClick={() => onToggleFav(pro)}
          title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, border: `1.5px solid ${isFav ? '#fecdd3' : 'var(--cl-border)'}`, background: isFav ? '#fff1f2' : 'var(--cl-surface)', color: isFav ? '#f43f5e' : 'var(--cl-text-muted)', transition: 'all 0.18s', cursor: 'pointer', flexShrink: 0 }}
        >
          <Heart size={15} strokeWidth={2} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--cl-surface)',
      border: '1.5px solid var(--cl-border)',
      borderRadius: 20, overflow: 'hidden',
      padding: '1.2rem',
      boxShadow: 'var(--cl-shadow-soft)',
    }}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {/* Avatar skeleton */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(90deg, var(--cl-border) 0%, var(--cl-bg) 50%, var(--cl-border) 100%)',
          backgroundSize: '400% 100%',
          animation: 'skeletonPulse 1.8s ease infinite',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Name skeleton */}
          <div style={{
            height: 14, borderRadius: 6,
            background: 'linear-gradient(90deg, var(--cl-border) 0%, var(--cl-bg) 50%, var(--cl-border) 100%)',
            backgroundSize: '400% 100%',
            animation: 'skeletonPulse 1.8s ease infinite 0.1s',
            width: '65%',
          }} />
          {/* Category skeleton */}
          <div style={{
            height: 11, borderRadius: 6,
            background: 'linear-gradient(90deg, var(--cl-border) 0%, var(--cl-bg) 50%, var(--cl-border) 100%)',
            backgroundSize: '400% 100%',
            animation: 'skeletonPulse 1.8s ease infinite 0.2s',
            width: '40%',
          }} />
          {/* City skeleton */}
          <div style={{
            height: 10, borderRadius: 6,
            background: 'linear-gradient(90deg, var(--cl-border) 0%, var(--cl-bg) 50%, var(--cl-border) 100%)',
            backgroundSize: '400% 100%',
            animation: 'skeletonPulse 1.8s ease infinite 0.3s',
            width: '50%',
          }} />
        </div>
      </div>
      {/* Separator */}
      <div style={{ height: 1, background: 'var(--cl-border)', marginBottom: '0.75rem' }} />
      {/* Bio skeleton : 3 lignes */}
      {[100, 92, 75].map((w, i) => (
        <div key={i} style={{
          height: 10, borderRadius: 5, marginBottom: 6,
          background: 'linear-gradient(90deg, var(--cl-border) 0%, var(--cl-bg) 50%, var(--cl-border) 100%)',
          backgroundSize: '400% 100%',
          animation: `skeletonPulse 1.8s ease infinite ${0.1 * i}s`,
          width: `${w}%`,
        }} />
      ))}
      {/* CTA skeleton */}
      <div style={{
        height: 40, borderRadius: 12, marginTop: '0.75rem',
        background: 'linear-gradient(90deg, var(--cl-border) 0%, var(--cl-bg) 50%, var(--cl-border) 100%)',
        backgroundSize: '400% 100%',
        animation: 'skeletonPulse 1.8s ease infinite 0.4s',
      }} />
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ gridColumn: '1 / -1', textAlign: 'center' as const, padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--cl-accent-soft)', border: '1.5px solid var(--cl-accent-20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cl-accent)" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--cl-text-primary)' }}>Aucun résultat</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--cl-text-muted)', fontSize: '0.85rem', maxWidth: 340, lineHeight: 1.65 }}>
        {query ? `Aucun professionnel ne correspond à « ${query} ». Essayez un autre terme.` : 'Aucun professionnel dans cette catégorie pour le moment.'}
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
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [searchFocused, setSearchFocused] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(false)
  const [favIds, setFavIds] = useState<Set<string>>(new Set())

  // ── FETCH ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/favorites')
      .then(r => r.json())
      .then((favs: { pro_id: string }[]) => {
        if (Array.isArray(favs)) setFavIds(new Set(favs.map(f => f.pro_id)))
      })
      .catch(() => {})
  }, [])

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

  const handleToggleFav = useCallback(async (pro: Pro) => {
    // Update optimiste immédiat
    const wasAlreadyFav = favIds.has(pro.id)
    setFavIds(prev => {
      const next = new Set(prev)
      if (wasAlreadyFav) next.delete(pro.id)
      else next.add(pro.id)
      return next
    })

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pro_id: pro.id, pro_username: pro.username }),
      })
      if (!res.ok) throw new Error('Echec')
      const data = await res.json()
      // Sync avec la vraie valeur serveur
      setFavIds(prev => {
        const next = new Set(prev)
        if (data.action === 'added') next.add(pro.id)
        if (data.action === 'removed') next.delete(pro.id)
        return next
      })
    } catch {
      // Rollback si echec
      setFavIds(prev => {
        const next = new Set(prev)
        if (wasAlreadyFav) next.add(pro.id)
        else next.delete(pro.id)
        return next
      })
    }
  }, [favIds])

  // ── GÉOLOC ───────────────────────────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setGeoError(true); return }
    setGeoLoading(true); setGeoError(false)
    navigator.geolocation.getCurrentPosition(
      pos => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSortBy('distance'); setGeoLoading(false) },
      () => { setGeoLoading(false); setGeoError(true) },
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

  const hasActiveFilters = !!(search || category !== 'all' || city !== 'Toutes les villes' || availableNow)

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .cat-pill { display: inline-flex; align-items: center; gap: 5px; padding: 0.3rem 0.7rem; border-radius: 100px; border: 1.5px solid var(--cl-border); background: var(--cl-surface); color: var(--cl-text-muted); font-size: 0.71rem; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
        .cat-pill:hover { border-color: rgba(79,70,229,0.3); color: var(--cl-accent); background: var(--cl-accent-soft); }
        .cat-pill.active { background: var(--cl-accent-soft); border-color: var(--cl-accent-20); color: var(--cl-accent); }
        .select-styled { padding: 0.48rem 0.8rem; border-radius: 10px; border: 1.5px solid var(--cl-border); background: var(--cl-surface); color: var(--cl-text-primary); font-size: 0.72rem; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; outline: none; transition: all 0.18s; }
        .select-styled:hover { border-color: rgba(79,70,229,0.3); }
        .select-styled:focus { border-color: var(--cl-accent); box-shadow: 0 0 0 3px var(--cl-accent-soft); }
        .view-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid var(--cl-border); background: var(--cl-surface); color: var(--cl-text-muted); cursor: pointer; transition: all 0.18s; }
        .view-btn:hover, .view-btn.active { border-color: rgba(79,70,229,0.3); color: var(--cl-accent); background: var(--cl-accent-soft); }
        .toggle-switch { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
        .toggle-track { width: 38px; height: 20px; border-radius: 100px; transition: background 0.25s; position: relative; flex-shrink: 0; }
        .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.25s; }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--cl-accent)', marginBottom: '0.3rem', fontFamily: "'DM Sans', sans-serif" }}>Marketplace</div>
          <div style={{ fontSize: 'clamp(1.5rem, 2.2vw, 1.9rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--cl-text-primary)', fontFamily: "'Clash Display', sans-serif", lineHeight: 1.2 }}>Trouver un professionnel</div>
        </div>

        {/* ── Search & Filters bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] } as Transition}
          style={{ background: 'var(--cl-surface)', border: '1.5px solid var(--cl-border)', borderRadius: 18, padding: '1rem 1.2rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: 'var(--cl-shadow-soft)' }}
        >
          {/* Row 1: search + city + sort + geo + view toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' as const }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: searchFocused ? 'var(--cl-accent)' : 'var(--cl-text-muted)', transition: 'color 0.18s', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Nom, catégorie, ville…"
                style={{ width: '100%', paddingLeft: 30, paddingRight: 12, paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: 10, border: `1.5px solid ${searchFocused ? 'var(--cl-accent)' : 'var(--cl-border)'}`, outline: 'none', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", color: 'var(--cl-text-primary)', transition: 'all 0.18s', background: 'var(--cl-bg)', boxShadow: searchFocused ? '0 0 0 3px var(--cl-accent-soft)' : 'none' }}
              />
            </div>
            <button onClick={handleGeolocate} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: userCoords ? '#16a34a' : geoError ? '#dc2626' : 'var(--cl-text-muted)', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, border: '1.5px solid var(--cl-border)', background: userCoords ? '#f0fdf4' : 'var(--cl-surface)', transition: 'all 0.18s' }}>
              {geoLoading ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>}
              {userCoords && <span>Activé</span>}
            </button>
            <select className="select-styled" value={city} onChange={e => setCity(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="select-styled" value={sortBy} onChange={e => setSortBy(e.target.value as 'plan' | 'name' | 'distance')}>
              <option value="plan">✦ Mis en avant</option>
              <option value="name">A–Z Alphabétique</option>
              {userCoords && <option value="distance">A proximité</option>}
            </select>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button className={`view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} title="Vue grille"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>
              <button className={`view-btn${viewMode === 'map' ? ' active' : ''}`} onClick={() => setViewMode('map')} title="Vue radar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></button>
            </div>
          </div>

          {/* Row 2: category pills + available toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', gap: '0.38rem', flex: 1, flexWrap: 'wrap' as const }}>
              {CATEGORIES.map((cat, i) => {
                const CatIcon = cat.icon
                return (
                  <motion.button key={cat.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.03, duration: 0.25 } as Transition} className={`cat-pill${category === cat.id ? ' active' : ''}`} onClick={() => setCategory(cat.id)}>
                    <CatIcon size={11} strokeWidth={2} style={{ color: category === cat.id ? cat.color : 'currentColor' }} />
                    {cat.label}
                  </motion.button>
                )
              })}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '0.75rem', borderLeft: '1.5px solid #f1f0f5' }}>
              <label className="toggle-switch" onClick={() => setAvailableNow(v => !v)}>
                <div className="toggle-track" style={{ background: availableNow ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#e2e0ea' }}>
                  <div className="toggle-thumb" style={{ transform: availableNow ? 'translateX(18px)' : 'translateX(0)' }} />
                </div>
                <span style={{ fontSize: '0.73rem', fontWeight: 600, color: availableNow ? '#16a34a' : '#94a3b8', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' as const }}>Disponible maintenant</span>
              </label>
            </div>
          </div>

          {/* Geo message */}
          <AnimatePresence>
            {(userCoords || geoError) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                {userCoords && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', fontFamily: "'Outfit', sans-serif", fontWeight: 600, flex: 1 }}>Position activée — les pros les plus proches apparaissent en priorité</span>
                    <button onClick={() => { setUserCoords(null); setSortBy('plan') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>Désactiver ×</button>
                  </div>
                )}
                {geoError && !userCoords && (
                  <div style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '0.7rem', color: '#dc2626', fontFamily: "'Outfit', sans-serif" }}>Géolocalisation refusée. Sélectionnez une ville manuellement.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Results bar ── */}
        <AnimatePresence>
          {!loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '8px', background: 'var(--cl-accent-soft)', border: '1.5px solid var(--cl-accent-20)', fontSize: '0.68rem', fontWeight: 800, color: 'var(--cl-accent)', fontFamily: "'DM Sans', sans-serif" }}>{filtered.length}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>professionnel{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}{category !== 'all' ? ` · ${CATEGORIES.find(c => c.id === category)?.label}` : ''}{city !== 'Toutes les villes' ? ` · ${city}` : ''}{availableNow ? ' · Disponible maintenant' : ''}</span>
              </div>
              {hasActiveFilters && (
                <button onClick={() => { setSearch(''); setCategory('all'); setCity('Toutes les villes'); setAvailableNow(false) }} style={{ background: 'var(--cl-accent-soft)', border: '1.5px solid var(--cl-accent-20)', borderRadius: '8px', cursor: 'pointer', color: 'var(--cl-accent)', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.26rem 0.65rem' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Réinitialiser
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid or Map ── */}
        <AnimatePresence mode="wait">
          {viewMode === 'map' ? (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MarketplaceMap pros={filtered} userCoords={userCoords} categories={CATEGORIES} />
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', paddingBottom: '2rem' }}>
                {loading
                  ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                  : (
                    <AnimatePresence mode="popLayout">
                      {filtered.length === 0
                        ? <EmptyState query={search} />
                        : filtered.map((pro, idx) => <ProCard key={pro.id} pro={pro} idx={idx} isFav={favIds.has(pro.id)} onToggleFav={handleToggleFav} />)
                      }
                    </AnimatePresence>
                  )
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <InfinityMatch userCoords={userCoords} />
      </div>
    </>
  )
}
