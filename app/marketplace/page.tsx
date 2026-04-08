'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { BrandLogo } from '@/components/BrandLogo'
import { PlanBadge } from '@/components/marketplace/PlanBadge'
import InfinityMatch from '@/components/marketplace/InfinityMatch'
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] } as Transition}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'white',
        border: hovered ? '1.5px solid rgba(124,58,237,0.3)' : '1.5px solid #f1f0f5',
        borderRadius: '20px',
        padding: '1.4rem',
        display: 'flex', flexDirection: 'column', gap: '0.9rem',
        cursor: 'default',
        transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 48px rgba(124,58,237,0.12), 0 4px 16px rgba(0,0,0,0.06)'
          : '0 2px 8px rgba(0,0,0,0.04), 0 0 0 0 transparent',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar pour infinity */}
      {pro.plan === 'infinity' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
        }} />
      )}

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={pro.full_name || pro.username} size={48} avatarUrl={pro.avatar_url} />
          {pro.plan !== 'starter' && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 11, height: 11, borderRadius: '50%',
                background: '#16a34a', border: '2px solid white',
                boxShadow: '0 0 6px rgba(22,163,74,0.5)',
              }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.95rem',
              color: '#0f0a1e', letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px',
            }}>
              {pro.full_name || pro.username}
            </span>
            <PlanBadge plan={pro.plan} />
          </div>

          {pro.category && catObj && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: '0.68rem', fontWeight: 600, color: catObj.color,
              background: `${catObj.color}12`, border: `1px solid ${catObj.color}22`,
              padding: '0.13rem 0.45rem', borderRadius: '100px',
              fontFamily: "'Outfit', sans-serif", marginBottom: '3px',
            }}>
              <span style={{ fontSize: '0.6rem' }}>{catObj.emoji}</span> {catObj.label}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {pro.city && (
              <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '2px' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {pro.city}
              </span>
            )}
            {/* Badge distance amélioré */}
            {pro.distance != null && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: pro.distance < 1 ? '#16a34a' : pro.distance < 5 ? '#2563eb' : pro.distance < 20 ? '#d97706' : '#94a3b8',
                background: pro.distance < 1 ? '#f0fdf4' : pro.distance < 5 ? '#eff6ff' : pro.distance < 20 ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${pro.distance < 1 ? '#bbf7d0' : pro.distance < 5 ? '#bfdbfe' : pro.distance < 20 ? '#fde68a' : '#e2e8f0'}`,
                padding: '0.12rem 0.45rem', borderRadius: '100px',
                fontFamily: "'Outfit', sans-serif",
                display: 'flex', alignItems: 'center', gap: '3px',
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="4"/>
                </svg>
                {formatDistance(pro.distance)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── SÉPARATEUR ── */}
      <div style={{ height: '1px', background: '#f1f0f5' }} />

      {/* ── BIO ── */}
      <p style={{
        fontSize: '0.78rem', color: '#64748b', lineHeight: 1.65,
        fontFamily: "'Outfit', sans-serif", fontWeight: 400,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        margin: 0, flex: 1, minHeight: '3.5em',
      }}>
        {pro.bio || (
          <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.73rem' }}>
            Aucune description renseignée.
          </span>
        )}
      </p>

      {/* ── CTA ── */}
      <div style={{ display: 'flex', gap: '0.45rem' }}>
        <Link
          href={`/${pro.username}`}
          style={{
            flex: 1, textAlign: 'center', padding: '0.65rem 1rem',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: 'white', borderRadius: '12px',
            fontWeight: 700, fontSize: '0.77rem', letterSpacing: '0.01em',
            textDecoration: 'none', fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
            transition: 'filter 0.18s, transform 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.filter = 'brightness(1.08)'; el.style.transform = 'scale(1.02)' }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.filter = ''; el.style.transform = '' }}
        >
          Prendre RDV →
        </Link>
        <Link
          href={`/${pro.username}`}
          title="Voir le profil"
          style={{
            padding: '0.65rem 0.8rem', background: '#f8f7ff',
            color: '#7c3aed', borderRadius: '12px',
            textDecoration: 'none', fontFamily: "'Outfit', sans-serif",
            border: '1.5px solid #e8e4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#ede9ff'; el.style.borderColor = '#c4b5fd' }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f8f7ff'; el.style.borderColor = '#e8e4ff' }}
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
    <div style={{
      background: 'white', border: '1.5px solid #f1f0f5', borderRadius: '20px',
      padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.9rem',
    }}>
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
        <div className="skel" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div className="skel" style={{ height: 14, width: '50%', borderRadius: 7 }} />
          <div className="skel" style={{ height: 10, width: '32%', borderRadius: 100 }} />
          <div className="skel" style={{ height: 9, width: '22%', borderRadius: 6 }} />
        </div>
      </div>
      <div className="skel" style={{ height: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div className="skel" style={{ height: 10, width: '100%', borderRadius: 6 }} />
        <div className="skel" style={{ height: 10, width: '82%', borderRadius: 6 }} />
        <div className="skel" style={{ height: 10, width: '64%', borderRadius: 6 }} />
      </div>
      <div className="skel" style={{ height: 38, borderRadius: 12 }} />
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
    >
      <div style={{ width: 64, height: 64, borderRadius: '18px', background: '#f5f3ff', border: '1.5px solid #e8e4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🔍</div>
      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#0f0a1e', letterSpacing: '-0.02em' }}>
        Aucun résultat
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", maxWidth: 340, lineHeight: 1.65 }}>
        {query
          ? `Aucun professionnel ne correspond à « ${query} ». Essayez un autre terme ou réinitialisez les filtres.`
          : 'Aucun professionnel dans cette catégorie pour le moment.'}
      </p>
    </motion.div>
  )
}

// ─── STAT PILL ────────────────────────────────────────────────────────────────
function StatPill({ value, label, loading }: { value: string | number; label: string; loading: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
      padding: '0.7rem 1.4rem',
      background: 'white',
      border: '1.5px solid #f1f0f5',
      borderRadius: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {loading
        ? <div className="skel" style={{ height: 22, width: 48, borderRadius: 7, marginBottom: 2 }} />
        : (
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.25rem',
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {value}
          </span>
        )
      }
      <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: "'Outfit', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [pros, setPros] = useState<Pro[]>([])
  const [stats, setStats] = useState<Stats>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [city, setCity] = useState('Toutes les villes')
  const [sortBy, setSortBy] = useState<'plan' | 'name' | 'distance'>('plan')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [availableNow, setAvailableNow] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(false)

  // ── FETCH (PostGIS distance si coordonnées) ─────────────────────────────
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
          setStats(data.stats ?? null)
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
    if (!navigator.geolocation) { setGeoError(true); return }
    setGeoLoading(true); setGeoError(false)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSortBy('distance')
        setGeoLoading(false)
      },
      () => { setGeoLoading(false); setGeoError(true) },
      { timeout: 8000 }
    )
  }, [])

  // ── FILTRES (dérivés, pas d’effet + setState) ─────────────────────────────
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

  const hasActiveFilters = search || category !== 'all' || city !== 'Toutes les villes' || availableNow

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Outfit', sans-serif; background: #faf9fc; }

        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .skel {
          background: linear-gradient(90deg,
            #f1f0f5 0%, #e8e6f0 50%, #f1f0f5 100%);
          background-size: 1200px 100%;
          animation: shimmer 1.8s infinite linear;
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
        }

        .cat-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 0.38rem 0.85rem; border-radius: 100px;
          font-size: 0.73rem; font-weight: 600; cursor: pointer;
          font-family: 'Outfit', sans-serif; white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          border: 1.5px solid transparent; background: none; letter-spacing: 0.01em;
        }
        .cat-pill.active {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: white !important; border-color: transparent;
          box-shadow: 0 4px 14px rgba(124,58,237,0.3);
          transform: translateY(-1px);
        }
        .cat-pill:not(.active) {
          color: #64748b; border-color: #e2e0ea;
          background: white;
        }
        .cat-pill:not(.active):hover {
          color: #7c3aed; border-color: #c4b5fd;
          background: #f5f3ff; transform: translateY(-1px);
        }

        .search-input {
          flex: 1; background: transparent; border: none;
          color: #0f0a1e; font-size: 0.87rem;
          font-family: 'Outfit', sans-serif;
          outline: none;
        }
        .search-input::placeholder { color: #c4bdd6; }

        .select-styled {
          background: white;
          border: 1.5px solid #e2e0ea;
          border-radius: 12px; padding: 0.72rem 2.2rem 0.72rem 0.9rem;
          color: #64748b; font-size: 0.8rem;
          font-family: 'Outfit', sans-serif; font-weight: 500;
          outline: none; cursor: pointer; transition: all 0.18s; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='11' height='7' viewBox='0 0 11 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4.5 5 4.5-5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0.75rem center;
          min-width: 155px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .select-styled:focus { border-color: #c4b5fd; color: #7c3aed; outline: none; }
        .select-styled option { background: white; color: #0f0a1e; }

        .view-btn {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          border: 1.5px solid #e2e0ea; background: white; cursor: pointer;
          color: #94a3b8; transition: all 0.18s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .view-btn.active {
          background: #f5f3ff; border-color: #c4b5fd; color: #7c3aed;
        }
        .view-btn:hover:not(.active) { background: #faf9fc; border-color: #c4bdd6; color: #7c3aed; }

        .toggle-switch {
          position: relative; display: inline-flex;
          align-items: center; gap: 8px; cursor: pointer;
          user-select: none;
        }
        .toggle-track {
          width: 40px; height: 22px; border-radius: 100px;
          transition: background 0.22s;
          position: relative; flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: white; transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }

        @media (max-width: 768px) {
          .marketplace-grid { grid-template-columns: 1fr !important; }
          .search-row { flex-wrap: wrap; }
          .select-styled { min-width: unset !important; flex: 1; }
          .stats-row { gap: 0.5rem !important; }
          .hero-title { font-size: 2.2rem !important; }
        }
        @media (max-width: 640px) {
          .cats-scroll { flex-wrap: nowrap !important; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .cats-scroll::-webkit-scrollbar { display: none; }
        }
      `}</style>

      <div style={{ background: '#faf9fc', minHeight: '100vh' }}>

        {/* ── HERO BACKGROUND DECO ── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '420px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-60px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '-40px', right: '-60px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)' }} />
        </div>

        {/* ── NAV ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          padding: '0 2rem', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(250,249,252,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #f1f0f5',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}>
          <BrandLogo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Link href="/sign-in" style={{
              fontSize: '0.8rem', fontWeight: 500, color: '#64748b',
              textDecoration: 'none', padding: '0.4rem 1rem',
              borderRadius: '100px', border: '1.5px solid #e2e0ea',
              fontFamily: "'Outfit', sans-serif",
              background: 'white', transition: 'all 0.18s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#c4b5fd'; el.style.color = '#7c3aed' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e2e0ea'; el.style.color = '#64748b' }}
            >
              Connexion
            </Link>
            <Link href="/sign-up" style={{
              fontSize: '0.8rem', fontWeight: 700, color: 'white',
              textDecoration: 'none', padding: '0.45rem 1.1rem',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              Inscrire mon activité
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </nav>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1180px', margin: '0 auto', padding: '0 2rem' }}>

          {/* ── HERO ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] } as Transition}
            style={{ textAlign: 'center', padding: '4rem 0 2.5rem' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.4 } as Transition}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: '#f5f3ff', border: '1.5px solid #e8e4ff',
                color: '#7c3aed', fontSize: '0.66rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '0.35rem 0.95rem', borderRadius: '100px',
                fontFamily: "'Outfit', sans-serif", marginBottom: '1.5rem',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              Marketplace · Professionnels vérifiés
            </motion.div>

            <h1
              className="hero-title"
              style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                letterSpacing: '-0.04em', color: '#0f0a1e', lineHeight: 1.06,
                marginBottom: '1rem',
              }}
            >
              Trouvez le bon pro,
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 55%, #f97316 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                réservez en 30 secondes.
              </span>
            </h1>

            <p style={{
              color: '#94a3b8', fontSize: '0.95rem',
              fontFamily: "'Outfit', sans-serif", fontWeight: 400,
              maxWidth: '420px', margin: '0 auto 2rem', lineHeight: 1.7,
            }}>
              Des professionnels indépendants disponibles près de chez vous.
              Agenda en ligne, réservation instantanée.
            </p>

            {/* Stats dynamiques */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.5 } as Transition}
              className="stats-row"
              style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <StatPill loading={loading} value={stats?.totalPros ?? '—'} label="Professionnels" />
              <StatPill loading={loading} value={stats?.totalAppointments ?? '—'} label="Réservations" />
              <StatPill loading={loading} value={stats?.uniqueCities ?? '—'} label="Villes" />
            </motion.div>
          </motion.div>

          {/* ── BLOC RECHERCHE ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] } as Transition}
            style={{
              background: 'white', border: '1.5px solid #f1f0f5',
              borderRadius: '24px', padding: '1.1rem',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              marginBottom: '1.1rem',
            }}
          >
            {/* Ligne 1 : Search + Selects + ViewMode */}
            <div className="search-row" style={{ display: 'flex', gap: '0.55rem', marginBottom: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Search */}
              <div style={{
                flex: 1, minWidth: '200px',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#faf9fc',
                border: `1.5px solid ${searchFocused ? '#c4b5fd' : '#e2e0ea'}`,
                borderRadius: '12px', padding: '0 0.9rem',
                transition: 'border-color 0.18s',
                boxShadow: searchFocused ? '0 0 0 3px rgba(124,58,237,0.08)' : 'none',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={searchFocused ? '#7c3aed' : '#c4bdd6'}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0, transition: 'stroke 0.18s' }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="search-input"
                  type="text"
                  placeholder={userCoords ? 'Rechercher à proximité...' : 'Barbier, coach, photographe...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{ padding: '0.78rem 0' }}
                />
                {/* Bouton géoloc */}
                <button
                  onClick={handleGeolocate}
                  title={userCoords ? 'Position activée — cliquer pour désactiver' : 'Me localiser'}
                  style={{
                    flexShrink: 0, background: userCoords ? '#f0fdf4' : 'none',
                    border: userCoords ? '1px solid #bbf7d0' : 'none',
                    cursor: 'pointer', padding: '4px 6px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    color: userCoords ? '#16a34a' : geoError ? '#dc2626' : '#c4bdd6',
                    fontSize: '0.68rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { if (!userCoords) (e.currentTarget as HTMLElement).style.color = '#7c3aed' }}
                  onMouseLeave={e => { if (!userCoords && !geoError) (e.currentTarget as HTMLElement).style.color = '#c4bdd6' }}
                >
                  {geoLoading
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                  }
                  {userCoords && <span>Activé</span>}
                </button>
              </div>

              <select className="select-styled" value={city} onChange={e => setCity(e.target.value)}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select className="select-styled" value={sortBy} onChange={e => setSortBy(e.target.value as 'plan' | 'name' | 'distance')}>
                <option value="plan">✦ Mis en avant</option>
                <option value="name">A–Z Alphabétique</option>
                {userCoords && <option value="distance">📍 À proximité</option>}
              </select>

              {/* Toggle vue grille / carte */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Vue grille"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button
                  className={`view-btn${viewMode === 'map' ? ' active' : ''}`}
                  onClick={() => setViewMode('map')}
                  title="Vue radar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Ligne 2 : Categories + "Disponible maintenant" */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="cats-scroll" style={{ display: 'flex', gap: '0.38rem', flex: 1, flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 + i * 0.03, duration: 0.25 } as Transition}
                    className={`cat-pill${category === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </motion.button>
                ))}
              </div>

              {/* Toggle "Disponible maintenant" */}
              <div
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '0.75rem', borderLeft: '1.5px solid #f1f0f5' }}
              >
                <label className="toggle-switch" onClick={() => setAvailableNow(v => !v)}>
                  <div
                    className="toggle-track"
                    style={{ background: availableNow ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#e2e0ea' }}
                  >
                    <div
                      className="toggle-thumb"
                      style={{ transform: availableNow ? 'translateX(18px)' : 'translateX(0)' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.73rem', fontWeight: 600, color: availableNow ? '#16a34a' : '#94a3b8', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                    {availableNow && <span style={{ marginRight: '3px' }}>🟢</span>}
                    Disponible maintenant
                  </span>
                </label>
              </div>
            </div>

            {/* Message géoloc */}
            <AnimatePresence>
              {(userCoords || geoError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '0.7rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  {userCoords && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontFamily: "'Outfit', sans-serif", fontWeight: 600, flex: 1 }}>
                        📍 Position activée — les pros les plus proches apparaissent en priorité
                      </span>
                      <button onClick={() => { setUserCoords(null); setSortBy('plan') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                        Désactiver ×
                      </button>
                    </div>
                  )}
                  {geoError && !userCoords && (
                    <div style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '0.7rem', color: '#dc2626', fontFamily: "'Outfit', sans-serif" }}>
                      ⚠️ Géolocalisation refusée ou indisponible. Sélectionnez une ville manuellement.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── BARRE RÉSULTATS ── */}
          <AnimatePresence>
            {!loading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  margin: '0 0 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: '8px',
                    background: '#f5f3ff', border: '1.5px solid #e8e4ff',
                    fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed',
                    fontFamily: "'Outfit', sans-serif",
                  }}>
                    {filtered.length}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>
                    professionnel{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
                    {category !== 'all' && ` · ${CATEGORIES.find(c => c.id === category)?.label}`}
                    {city !== 'Toutes les villes' && ` · ${city}`}
                    {availableNow && ' · Disponible maintenant'}
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(''); setCategory('all'); setCity('Toutes les villes'); setAvailableNow(false) }}
                    style={{
                      background: '#f5f3ff', border: '1.5px solid #e8e4ff',
                      borderRadius: '8px', cursor: 'pointer', color: '#7c3aed',
                      fontSize: '0.72rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '0.26rem 0.65rem', transition: 'all 0.18s',
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Réinitialiser
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CONTENU PRINCIPAL (Grille ou Carte) ── */}
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MarketplaceMap pros={filtered} userCoords={userCoords} categories={CATEGORIES} />
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  className="marketplace-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', paddingBottom: '2rem' }}
                >
                  {loading
                    ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                    : (
                      <AnimatePresence mode="popLayout">
                        {filtered.length === 0
                          ? <EmptyState query={search} />
                          : filtered.map((pro, idx) => <ProCard key={pro.id} pro={pro} idx={idx} />)
                        }
                      </AnimatePresence>
                    )
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CTA BAS ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] } as Transition}
            style={{
              margin: '2rem 0 0',
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)',
              border: '1.5px solid #e8e4ff', borderRadius: '28px',
              padding: 'clamp(2rem, 4vw, 3rem)', textAlign: 'center',
            }}
          >
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', border: '1.5px solid #e8e4ff', color: '#7c3aed', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.85rem', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", marginBottom: '1rem' }}>
                ✦ Pour les professionnels
              </div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', letterSpacing: '-0.04em', color: '#0f0a1e', marginBottom: '0.7rem', lineHeight: 1.1 }}>
                Développez votre activité.
                <br /><span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.68em' }}>Commencez gratuitement, grandissez à votre rythme.</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', fontFamily: "'Outfit', sans-serif", maxWidth: '420px', margin: '0 auto 2rem', lineHeight: 1.65 }}>
                Inscrivez votre activité, soyez visible sur la marketplace, et commencez à recevoir des réservations en ligne dès aujourd&apos;hui.
              </p>
              <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '0.85rem 2rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', borderRadius: '100px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', fontFamily: "'Outfit', sans-serif", boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}>
                  Inscrire mon activité — c&apos;est gratuit
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/#pricing" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.85rem 1.8rem', background: 'white', color: '#64748b', borderRadius: '100px', fontWeight: 500, fontSize: '0.88rem', textDecoration: 'none', fontFamily: "'Outfit', sans-serif", border: '1.5px solid #e2e0ea' }}>
                  Voir les tarifs
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ── FOOTER ── */}
          <div style={{ padding: '1.8rem 0', borderTop: '1px solid #f1f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '2.5rem' }}>
            <BrandLogo />
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <Link href="/marketplace" style={{ fontSize: '0.72rem', color: '#c4bdd6', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}>Marketplace</Link>
              <Link href="/#pricing" style={{ fontSize: '0.72rem', color: '#c4bdd6', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}>Tarifs</Link>
              <span style={{ fontSize: '0.7rem', color: '#ddd8e8', fontFamily: "'Outfit', sans-serif" }}>© 2026 CalendaPro</span>
            </div>
          </div>

        </div>

        <InfinityMatch userCoords={userCoords} />
      </div>
    </>
  )
}
