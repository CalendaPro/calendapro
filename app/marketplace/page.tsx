'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { BrandLogo } from '@/components/BrandLogo'
import { PlanBadge } from '@/components/marketplace/PlanBadge'
import InfinityMatch from '@/components/marketplace/InfinityMatch'
import { compareMarketplacePros } from '@/lib/geo'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { storeProSelection, detectAndStoreSource } from '@/lib/tunnel-tracking'
import {
  Search,
  MapPin,
  Grid3X3,
  Map as MapIcon,
  Crosshair,
  Scissors,
  Camera,
  Dumbbell,
  BrainCircuit,
  Palette,
  Briefcase,
  Heart,
  Sparkles,
  X,
  ArrowRight,
  User,
  Zap,
  AlertTriangle
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
const CATEGORIES = [
  { id: 'all',        label: 'Tous',           icon: Sparkles,    color: '#7c3aed' },
  { id: 'barbier',    label: 'Barbiers',        icon: Scissors,    color: '#db2777' },
  { id: 'coach',      label: 'Coachs',          icon: Crosshair,   color: '#ea580c' },
  { id: 'photo',      label: 'Photographes',    icon: Camera,      color: '#059669' },
  { id: 'freelance',  label: 'Freelances',      icon: Briefcase,   color: '#7c3aed' },
  { id: 'therapeute', label: 'Thérapeutes',     icon: Heart,       color: '#ec4899' },
  { id: 'sport',      label: 'Coachs sportifs', icon: Dumbbell,    color: '#dc2626' },
  { id: 'consultant', label: 'Consultants',     icon: BrainCircuit, color: '#d97706' },
  { id: 'creatif',    label: 'Créatifs',        icon: Palette,     color: '#8b5cf6' },
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
function Avatar({ name, size = 56, avatarUrl, isPremium = false }: { name: string; size?: number; avatarUrl?: string | null; isPremium?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const palettes = [
    ['#7c3aed','#818cf8'], ['#db2777','#f43f5e'],
    ['#2563eb','#6366f1'], ['#059669','#14b8a6'],
    ['#d97706','#ef4444'], ['#0891b2','#7c3aed'],
  ]
  const idx = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % palettes.length
  const [from, to] = palettes[idx]

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    position: 'relative',
    flexShrink: 0,
    ...(isPremium && {
      boxShadow: '0 0 0 2px rgba(236, 72, 153, 0.5), 0 4px 20px rgba(236, 72, 153, 0.3), 0 8px 32px rgba(0,0,0,0.12)',
    }),
  }

  if (avatarUrl) {
    return (
      <div style={containerStyle}>
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            border: isPremium ? '2px solid #ffffff' : 'none',
          }}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: size * 0.32,
        fontFamily: "'Clash Display', sans-serif",
        border: isPremium ? '2px solid #ffffff' : 'none',
      }}>
        {initials}
      </div>
    </div>
  )
}

// ─── PRO CARD ─────────────────────────────────────────────────────────────────
function ProCard({ pro, idx }: { pro: Pro; idx: number }) {
  const [hovered, setHovered] = useState(false)
  const catObj = CATEGORIES.find(c => c.id === pro.category)
  const CategoryIcon = catObj?.icon || Sparkles
  const isPremium = pro.plan === 'infinity' || pro.plan === 'premium'

  const handleProClick = useCallback(() => {
    storeProSelection(pro.id, pro.username)
    detectAndStoreSource()
  }, [pro.id, pro.username])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] } as Transition}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="pro-card"
      style={{
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '24px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        cursor: 'default',
        transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 24px 48px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
          : '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Glass shine effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
        pointerEvents: 'none',
        borderRadius: '24px 24px 0 0',
      }} />

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
        <Avatar
          name={pro.full_name || pro.username}
          size={56}
          avatarUrl={pro.avatar_url}
          isPremium={isPremium}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600,
              fontSize: '1rem',
              color: '#0B0F19',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '160px',
            }}>
              {pro.full_name || pro.username}
            </span>
            <PlanBadge plan={pro.plan} />
          </div>

          {pro.category && catObj && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: catObj.color,
              background: `${catObj.color}14`,
              border: `1px solid ${catObj.color}30`,
              padding: '0.2rem 0.6rem',
              borderRadius: '100px',
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: '4px',
            }}>
              <CategoryIcon size={12} strokeWidth={2} />
              {catObj.label}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {pro.city && (
              <span style={{
                fontSize: '0.8rem',
                color: '#6B7280',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500,
              }}>
                <MapPin size={12} strokeWidth={2} />
                {pro.city}
              </span>
            )}
            {pro.distance != null && (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: pro.distance < 1 ? '#059669' : pro.distance < 5 ? '#7c3aed' : pro.distance < 20 ? '#d97706' : '#6B7280',
                background: pro.distance < 1 ? 'rgba(5, 150, 105, 0.08)' : pro.distance < 5 ? 'rgba(124, 58, 237, 0.08)' : pro.distance < 20 ? 'rgba(217, 119, 6, 0.08)' : 'rgba(107, 114, 128, 0.08)',
                border: `1px solid ${pro.distance < 1 ? 'rgba(5, 150, 105, 0.2)' : pro.distance < 5 ? 'rgba(124, 58, 237, 0.2)' : pro.distance < 20 ? 'rgba(217, 119, 6, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`,
                padding: '0.15rem 0.5rem',
                borderRadius: '100px',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <Zap size={10} strokeWidth={2.5} />
                {formatDistance(pro.distance)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── BIO ── */}
      <p style={{
        fontSize: '0.875rem',
        color: '#4B5563',
        lineHeight: 1.7,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        margin: 0,
        flex: 1,
        minHeight: '3.5em',
        position: 'relative',
      }}>
        {pro.bio || (
          <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.8rem' }}>
            Aucune description renseignée.
          </span>
        )}
      </p>

      {/* ── CTA ── */}
      <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
        <Link
          href={`/auth-choice?pro=${pro.username}`}
          onClick={handleProClick}
          className="btn-animated-border"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
            color: 'white',
            borderRadius: '14px',
            fontWeight: 600,
            fontSize: '0.85rem',
            letterSpacing: '0.01em',
            textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.transform = 'translateY(-2px) scale(1.01)'
            el.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.45), inset 0 1px 0 rgba(255,255,255,0.3)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.transform = ''
            el.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        >
          <span>Prendre RDV</span>
          <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
        <Link
          href={`/${pro.username}`}
          title="Voir le profil"
          style={{
            padding: '0.75rem 0.9rem',
            background: 'rgba(255, 255, 255, 0.6)',
            color: '#7c3aed',
            borderRadius: '14px',
            textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif",
            border: '1px solid rgba(124, 58, 237, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(255, 255, 255, 0.9)'
            el.style.borderColor = 'rgba(124, 58, 237, 0.3)'
            el.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(255, 255, 255, 0.6)'
            el.style.borderColor = 'rgba(124, 58, 237, 0.15)'
            el.style.transform = ''
          }}
        >
          <User size={16} strokeWidth={2} />
        </Link>
      </div>
    </motion.div>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.5)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      borderRadius: '24px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div className="skel-glass" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="skel-glass" style={{ height: 16, width: '55%', borderRadius: 8 }} />
          <div className="skel-glass" style={{ height: 12, width: '35%', borderRadius: 100 }} />
          <div className="skel-glass" style={{ height: 10, width: '25%', borderRadius: 6 }} />
        </div>
      </div>
      <div className="skel-glass" style={{ height: 1, borderRadius: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div className="skel-glass" style={{ height: 12, width: '100%', borderRadius: 6 }} />
        <div className="skel-glass" style={{ height: 12, width: '85%', borderRadius: 6 }} />
        <div className="skel-glass" style={{ height: 12, width: '70%', borderRadius: 6 }} />
      </div>
      <div className="skel-glass" style={{ height: 44, borderRadius: 14, marginTop: '0.5rem' }} />
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem'
      }}
    >
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
      }}>
        <Search size={28} strokeWidth={1.5} color="#7c3aed" />
      </div>
      <h3 style={{
        fontFamily: "'Clash Display', sans-serif",
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#0B0F19',
        letterSpacing: '-0.02em'
      }}>
        Aucun résultat
      </h3>
      <p style={{
        color: '#6B7280',
        fontSize: '0.9rem',
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: 360,
        lineHeight: 1.65
      }}>
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
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      padding: '0.85rem 1.75rem',
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
    }}>
      {loading
        ? <div className="skel-glass" style={{ height: 24, width: 56, borderRadius: 8, marginBottom: 4 }} />
        : (
          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 700,
            fontSize: '1.5rem',
            letterSpacing: '-0.03em',
            color: '#0B0F19',
          }}>
            {value}
          </span>
        )
      }
      <span style={{
        fontSize: '0.65rem',
        color: '#6B7280',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>
        {label}
      </span>
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const { isSignedIn } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => setUserRole(data?.role ?? null))
      .catch(() => {})
  }, [isSignedIn])

  const authDest = isSignedIn
    ? (userRole === 'pro' ? '/dashboard' : '/client')
    : null

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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'DM Sans', sans-serif;
          background: #FFFFFF;
          color: #0B0F19;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes shimmer-gold {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(124, 58, 237, 0); }
        }

        @keyframes border-rotate {
          0% { --angle: 0deg; }
          100% { --angle: 360deg; }
        }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        .skel-glass {
          background: linear-gradient(90deg,
            rgba(243, 244, 246, 0.6) 0%,
            rgba(229, 231, 235, 0.8) 50%,
            rgba(243, 244, 246, 0.6) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }

        .search-container {
          position: relative;
          overflow: hidden;
        }

        .search-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 40%,
            rgba(236, 72, 153, 0.15) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 1;
        }

        .search-container:hover::before {
          opacity: 1;
          animation: shimmer-gold 2s ease-in-out;
        }

        .cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          border: 1.5px solid rgba(0, 0, 0, 0.07);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          letter-spacing: 0.01em;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          color: #4B5563;
        }

        .cat-pill.active {
          color: white !important;
          border-color: transparent !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
        }

        .cat-pill:not(.active):hover {
          border-color: rgba(124, 58, 237, 0.25);
          background: rgba(255, 255, 255, 1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #0B0F19;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          font-weight: 500;
        }

        .search-input::placeholder { color: #9CA3AF; }

        .select-styled {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 14px;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          color: #4B5563;
          font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.9rem center;
          min-width: 160px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }

        .select-styled:focus {
          border-color: rgba(124, 58, 237, 0.3);
          color: '#7c3aed';
          outline: none;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
        }

        .select-styled option {
          background: white;
          color: #0B0F19;
        }

        .view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          cursor: pointer;
          color: #6B7280;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .view-btn.active {
          background: #7c3aed;
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
        }

        .view-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(124, 58, 237, 0.2);
          color: #7c3aed;
          transform: translateY(-1px);
        }

        .toggle-switch {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .toggle-track {
          width: 44px;
          height: 24px;
          border-radius: 100px;
          transition: background 0.3s;
          position: relative;
          flex-shrink: 0;
        }

        .toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .marketplace-grid { grid-template-columns: 1fr !important; }
          .search-row { flex-wrap: wrap; }
          .select-styled { min-width: unset !important; flex: 1; }
          .stats-row { gap: 0.75rem !important; }
          .hero-title { font-size: 2rem !important; }
        }

        @media (max-width: 640px) {
          .cats-scroll {
            flex-wrap: nowrap !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 8px;
            gap: 0.5rem;
          }
          .cats-scroll::-webkit-scrollbar { display: none; }
        }
      `}</style>

      <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>

        {/* ── HERO BACKGROUND DECO ── */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}>
          {/* Soft gradient orbs */}
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.03) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            right: '-10%',
            width: '40vw',
            height: '40vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.02) 0%, transparent 55%)',
            filter: 'blur(80px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-5%',
            left: '30%',
            width: '30vw',
            height: '30vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.02) 0%, transparent 50%)',
            filter: 'blur(60px)',
          }} />
        </div>

        {/* ── NAV ── */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0 2.5rem',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        }}>
          <BrandLogo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/sign-up" style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#9CA3AF',
              textDecoration: 'none',
              padding: '0.45rem 0.9rem',
              borderRadius: '100px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              fontFamily: "'DM Sans', sans-serif",
              background: 'transparent',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(124, 58, 237, 0.2)'
                el.style.color = '#7c3aed'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                el.style.color = '#9CA3AF'
              }}
            >
              Vous êtes un pro ?
            </Link>
            <Link href={authDest ?? '/client-sign-in'} style={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#4B5563',
              textDecoration: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '100px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              fontFamily: "'DM Sans', sans-serif",
              background: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(124, 58, 237, 0.3)'
                el.style.color = '#7c3aed'
                el.style.background = 'rgba(255, 255, 255, 0.9)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                el.style.color = '#4B5563'
                el.style.background = 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {authDest ? (userRole === 'pro' ? 'Mon Dashboard' : 'Mon Espace') : 'Connexion'}
            </Link>
            <Link href={authDest ?? '/client-sign-up'} style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'white',
              textDecoration: 'none',
              padding: '0.55rem 1.4rem',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-1px)'
                el.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.45)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = ''
                el.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.35)'
              }}
            >
              {authDest ? (userRole === 'pro' ? 'Dashboard Pro' : 'Mon Espace Client') : 'Rejoindre CalendaPro'}
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </nav>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1180px', margin: '0 auto', padding: '0 2rem' }}>

          {/* ── HERO ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] } as Transition}
            style={{ textAlign: 'center', padding: '5rem 0 3rem' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 } as Transition}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.15)',
                color: '#7c3aed',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.5rem 1rem',
                borderRadius: '100px',
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: '2rem',
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#7c3aed',
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite'
              }} />
              Marketplace · Professionnels vérifiés
            </motion.div>

            <h1
              className="hero-title"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '-0.03em',
                color: '#0B0F19',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                paddingRight: '0.05em',
                paddingBottom: '0.05em',
                overflow: 'visible',
              }}
            >
              Trouvez le bon pro,
              <br />
              <span style={{ color: '#7c3aed' }}>
                réservez en 30 secondes.
              </span>
            </h1>

            <p style={{
              color: '#6B7280',
              fontSize: '1.1rem',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              maxWidth: '480px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.7,
            }}>
              Des professionnels indépendants disponibles près de chez vous.
              Agenda en ligne, réservation instantanée.
            </p>

            {/* Stats dynamiques */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 } as Transition}
              className="stats-row"
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <StatPill loading={loading} value={stats?.totalPros ?? '—'} label="Professionnels" />
              <StatPill loading={loading} value={stats?.totalAppointments ?? '—'} label="Réservations" />
              <StatPill loading={loading} value={stats?.uniqueCities ?? '—'} label="Villes" />
            </motion.div>
          </motion.div>

          {/* ── BLOC RECHERCHE ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] } as Transition}
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '28px',
              padding: '1.25rem',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
              marginBottom: '1.5rem',
            }}
          >
            {/* Ligne 1 : Search + Selects + ViewMode */}
            <div className="search-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Search */}
              <div
                className="search-container"
                style={{
                  flex: 1,
                  minWidth: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: `1.5px solid ${searchFocused ? 'rgba(124, 58, 237, 0.3)' : 'rgba(0, 0, 0, 0.06)'}`,
                  borderRadius: '16px',
                  padding: '0 1rem',
                  transition: 'all 0.3s',
                  boxShadow: searchFocused
                    ? '0 0 0 4px rgba(124, 58, 237, 0.08), 0 4px 20px rgba(0,0,0,0.06)'
                    : '0 2px 12px rgba(0, 0, 0, 0.04)',
                }}
              >
                <Search
                  size={18}
                  strokeWidth={2}
                  color={searchFocused ? '#7c3aed' : '#9CA3AF'}
                  style={{ flexShrink: 0, transition: 'color 0.3s' }}
                />
                <input
                  className="search-input"
                  type="text"
                  placeholder={userCoords ? 'Rechercher à proximité...' : 'Barbier, coach, photographe...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{ padding: '0.9rem 0' }}
                />
                {/* Bouton géoloc */}
                <button
                  onClick={handleGeolocate}
                  title={userCoords ? 'Position activée' : 'Me localiser'}
                  style={{
                    flexShrink: 0,
                    background: userCoords ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                    border: userCoords ? '1px solid rgba(124, 58, 237, 0.2)' : 'none',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: userCoords ? '#7c3aed' : geoError ? '#dc2626' : '#9CA3AF',
                    fontSize: '0.75rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!userCoords) (e.currentTarget as HTMLElement).style.color = '#7c3aed' }}
                  onMouseLeave={e => { if (!userCoords && !geoError) (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
                >
                  {geoLoading
                    ? <div style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    : <Crosshair size={16} strokeWidth={2} />
                  }
                  {userCoords && <span>Activé</span>}
                </button>
              </div>

              <select className="select-styled" value={city} onChange={e => setCity(e.target.value)}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select className="select-styled" value={sortBy} onChange={e => setSortBy(e.target.value as 'plan' | 'name' | 'distance')}>
                <option value="plan">Mis en avant</option>
                <option value="name">A–Z Alphabétique</option>
                {userCoords && <option value="distance">À proximité</option>}
              </select>

              {/* Toggle vue grille / carte */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Vue grille"
                >
                  <Grid3X3 size={18} strokeWidth={2} />
                </button>
                <button
                  className={`view-btn${viewMode === 'map' ? ' active' : ''}`}
                  onClick={() => setViewMode('map')}
                  title="Vue radar"
                >
                  <MapIcon size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Ligne 2 : Categories + "Mis en avant" toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="cats-scroll" style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] } as Transition}
                    className={`cat-pill${category === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                    style={category === cat.id ? { background: cat.color, boxShadow: `0 4px 14px ${cat.color}44` } : {}}
                  >
                    <cat.icon size={12} strokeWidth={2} style={{ color: category === cat.id ? 'white' : cat.color }} />
                    {cat.label}
                  </motion.button>
                ))}
              </div>

              {/* Toggle "Mis en avant" - Indigo */}
              <div
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '1rem', borderLeft: '1px solid rgba(0, 0, 0, 0.06)' }}
              >
                <label className="toggle-switch" onClick={() => setAvailableNow(v => !v)}>
                  <div
                    className="toggle-track"
                    style={{ background: availableNow ? '#7c3aed' : '#E5E7EB' }}
                  >
                    <div
                      className="toggle-thumb"
                      style={{ transform: availableNow ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: availableNow ? '#7c3aed' : '#6B7280',
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: 'nowrap'
                  }}>
                    {availableNow && <Sparkles size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />}
                    Mis en avant
                  </span>
                </label>
              </div>
            </div>

            {/* Message géoloc */}
            <AnimatePresence>
              {(userCoords || geoError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  {userCoords && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '0.75rem 1rem',
                      background: 'rgba(124, 58, 237, 0.06)',
                      border: '1px solid rgba(124, 58, 237, 0.12)',
                      borderRadius: '12px'
                    }}>
                      <MapPin size={16} color="#7c3aed" strokeWidth={2} />
                      <span style={{
                        fontSize: '0.8rem',
                        color: '#7c3aed',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        flex: 1
                      }}>
                        Position activée : les pros les plus proches apparaissent en priorité
                      </span>
                      <button
                        onClick={() => { setUserCoords(null); setSortBy('plan') }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          fontSize: '0.75rem',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Désactiver <X size={14} />
                      </button>
                    </div>
                  )}
                  {geoError && !userCoords && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(220, 38, 38, 0.04)',
                      border: '1px solid rgba(220, 38, 38, 0.1)',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      color: '#dc2626',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertTriangle size={14} strokeWidth={1.5} />
                      Géolocalisation refusée ou indisponible. Sélectionnez une ville manuellement.
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  margin: '0 0 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'rgba(124, 58, 237, 0.08)',
                    border: '1px solid rgba(124, 58, 237, 0.12)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#7c3aed',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {filtered.length}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500
                  }}>
                    professionnel{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
                    {category !== 'all' && (
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>
                        {' '}· {CATEGORIES.find(c => c.id === category)?.label}
                      </span>
                    )}
                    {city !== 'Toutes les villes' && ` · ${city}`}
                    {availableNow && (
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}> · Mis en avant</span>
                    )}
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(''); setCategory('all'); setCity('Toutes les villes'); setAvailableNow(false) }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      color: '#6B7280',
                      fontSize: '0.8rem',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.4rem 0.75rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'
                      e.currentTarget.style.color = '#7c3aed'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                      e.currentTarget.style.color = '#6B7280'
                    }}
                  >
                    <X size={14} strokeWidth={2} />
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] } as Transition}
            style={{
              margin: '3rem 0 0',
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '32px',
              padding: 'clamp(2.5rem, 5vw, 4rem)',
              textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <div style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.04) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.15)',
                color: '#7c3aed',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.4rem 0.9rem',
                borderRadius: '100px',
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: '1.5rem'
              }}>
                <Sparkles size={12} strokeWidth={2} />
                Pour les professionnels
              </div>
              <h2 style={{
                fontFamily: "'Clash Display', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                letterSpacing: '-0.02em',
                color: '#0B0F19',
                marginBottom: '1rem',
                lineHeight: 1.15,
                paddingRight: '0.05em',
                overflow: 'visible',
              }}>
                Développez votre activité.
                <br />
                <span style={{ color: '#6B7280', fontWeight: 500, fontSize: '0.65em' }}>
                  Commencez gratuitement, grandissez à votre rythme.
                </span>
              </h2>
              <p style={{
                color: '#6B7280',
                fontSize: '1rem',
                fontFamily: "'DM Sans', sans-serif",
                maxWidth: '480px',
                margin: '0 auto 2rem',
                lineHeight: 1.7
              }}>
                Inscrivez votre activité, soyez visible sur la marketplace, et commencez à recevoir des réservations en ligne dès aujourd&apos;hui.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/sign-up"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '1rem 2.25rem',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                    color: 'white',
                    borderRadius: '100px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: '0 8px 28px rgba(124, 58, 237, 0.35)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 36px rgba(124, 58, 237, 0.45)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = ''
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(124, 58, 237, 0.35)'
                  }}
                >
                  Rejoindre CalendaPro — c&apos;est gratuit
                  <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
                <Link
                  href="/#pricing"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '1rem 2rem',
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: '#4B5563',
                    borderRadius: '100px',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'
                    e.currentTarget.style.color = '#7c3aed'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.color = '#4B5563'
                    e.currentTarget.style.transform = ''
                  }}
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ── FOOTER ── */}
          <div style={{
            padding: '2rem 0',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginTop: '3rem'
          }}>
            <BrandLogo />
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <Link href="/marketplace" style={{
                fontSize: '0.85rem',
                color: '#6B7280',
                textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                transition: 'color 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'} onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
                Marketplace
              </Link>
              <Link href="/#pricing" style={{
                fontSize: '0.85rem',
                color: '#6B7280',
                textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                transition: 'color 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'} onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
                Tarifs
              </Link>
              <span style={{
                fontSize: '0.8rem',
                color: '#9CA3AF',
                fontFamily: "'DM Sans', sans-serif"
              }}>
                © 2026 CalendaPro
              </span>
            </div>
          </div>

        </div>

        <InfinityMatch userCoords={userCoords} />
      </div>
    </>
  )
}
