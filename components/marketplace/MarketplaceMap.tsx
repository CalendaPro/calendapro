'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PlanBadge, type MarketplacePlan } from './PlanBadge'

export type MapPro = {
  id: string
  username: string
  full_name: string
  plan: MarketplacePlan
  latitude: number | null
  longitude: number | null
  avatar_url: string | null
  category: string | null
  city: string | null
  distance?: number
}

type Cat = { id: string; emoji: string; color: string; label: string }

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

function normalize(v: number, max: number, fallback: number) {
  if (!Number.isFinite(v) || max <= 0) return fallback
  return Math.max(0.12, Math.min(0.95, v / max))
}

export default function MarketplaceMap({
  pros,
  userCoords,
  categories,
}: {
  pros: MapPro[]
  userCoords: { lat: number; lng: number } | null
  categories: Cat[]
}) {
  const radarPros = useMemo(() => pros.slice(0, 24), [pros])

  const projected = useMemo(() => {
    const withCoords = radarPros.filter(
      p => p.latitude != null && p.longitude != null && !Number.isNaN(Number(p.latitude)) && !Number.isNaN(Number(p.longitude))
    )
    const hasUserCoords = !!userCoords

    if (hasUserCoords) {
      const maxDistance = Math.max(1, ...radarPros.map(p => p.distance ?? 1))
      return radarPros.map((pro, idx) => {
        const ratio = normalize(pro.distance ?? maxDistance * 0.7, maxDistance, 0.66)
        const angle = ((idx + 1) / Math.max(1, radarPros.length)) * Math.PI * 2
        return { pro, ratio, angle }
      })
    }

    if (withCoords.length === 0) {
      return radarPros.map((pro, idx) => {
        const ringOffset = (idx % 3) * 0.18
        const ratio = 0.25 + ringOffset + (idx % 2) * 0.07
        const angle = ((idx + 1) / Math.max(1, radarPros.length)) * Math.PI * 2
        return { pro, ratio: Math.min(0.9, ratio), angle }
      })
    }

    const avgLat = withCoords.reduce((acc, p) => acc + Number(p.latitude), 0) / withCoords.length
    const avgLng = withCoords.reduce((acc, p) => acc + Number(p.longitude), 0) / withCoords.length
    const distances = withCoords.map(p => {
      const dLat = Number(p.latitude) - avgLat
      const dLng = Number(p.longitude) - avgLng
      return Math.sqrt(dLat * dLat + dLng * dLng)
    })
    const maxPseudoDistance = Math.max(...distances, 0.0001)

    return withCoords.map((pro, idx) => {
      const dLat = Number(pro.latitude) - avgLat
      const dLng = Number(pro.longitude) - avgLng
      const angle = Math.atan2(dLat, dLng)
      const pseudoDistance = Math.sqrt(dLat * dLat + dLng * dLng)
      return {
        pro,
        ratio: normalize(pseudoDistance, maxPseudoDistance, 0.58),
        angle: Number.isFinite(angle) ? angle : (idx / Math.max(1, withCoords.length)) * Math.PI * 2,
      }
    })
  }, [radarPros, userCoords])

  return (
    <>
      <style>{`
        @keyframes radar-wave {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes radar-sweep {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes radar-blip {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(236,72,153,0.45); }
          50% { transform: scale(1.12); box-shadow: 0 0 0 12px rgba(236,72,153,0); }
        }
        .cp-radar-layout {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          gap: 16px;
          align-items: stretch;
        }
        @media (max-width: 980px) {
          .cp-radar-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div
        className="cp-radar-layout"
        style={{
          gap: 16,
        }}
      >
        <div
          style={{
            background: 'white',
            border: '1.5px solid #efeafc',
            borderRadius: 20,
            padding: '1rem',
            boxShadow: '0 8px 28px rgba(124,58,237,0.08)',
            overflow: 'auto',
          }}
        >
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0f0a1e', marginBottom: 10 }}>
            Radar de Proximite
          </div>
          <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: 12, lineHeight: 1.55 }}>
            {userCoords
              ? 'Tri en direct selon votre position. Les points proches remontent au centre.'
              : 'Activez la geolocalisation pour un radar precis. Sinon, projection intelligente des resultats.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {radarPros.slice(0, 8).map(pro => {
              const cat = categories.find(c => c.id === pro.category)
              return (
                <div
                  key={pro.id}
                  style={{
                    border: '1px solid #f0ebfa',
                    borderRadius: 12,
                    padding: 10,
                    background: '#fcfbff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e1336' }}>{pro.full_name || pro.username}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <PlanBadge plan={pro.plan} variant="compact" />
                        {cat && <span style={{ fontSize: 11, color: cat.color }}>{cat.emoji} {cat.label}</span>}
                      </div>
                      {pro.distance != null && <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>A {formatDistance(pro.distance)}</div>}
                    </div>
                    <Link href={`/${pro.username}`} style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Voir
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            minHeight: 560,
            borderRadius: 22,
            border: '1.5px solid #e8e4ff',
            overflow: 'hidden',
            background: 'radial-gradient(circle at center, #1b1230 0%, #120b22 60%, #0d0818 100%)',
            boxShadow: '0 20px 60px rgba(15,10,30,0.35)',
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid rgba(167,139,250,0.55)',
                animation: `radar-wave 3.5s linear infinite`,
                animationDelay: `${i * 1.1}s`,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '75%',
              height: '75%',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(124,58,237,0.45), rgba(124,58,237,0.02) 45%, transparent 100%)',
              filter: 'blur(1px)',
              transformOrigin: 'center',
              animation: 'radar-sweep 6s linear infinite',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 38,
              height: 38,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: '3px solid #fff',
              boxShadow: '0 0 32px rgba(124,58,237,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            VOUS
          </div>

          {projected.map((entry, idx) => {
            const radiusPct = entry.ratio * 42
            const x = Math.cos(entry.angle) * radiusPct
            const y = Math.sin(entry.angle) * radiusPct
            const cat = categories.find(c => c.id === entry.pro.category)
            const size = entry.pro.plan === 'infinity' ? 22 : entry.pro.plan === 'premium' ? 18 : 14
            return (
              <Link
                key={entry.pro.id}
                href={`/${entry.pro.username}`}
                title={entry.pro.full_name || entry.pro.username}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${x}%)`,
                  top: `calc(50% + ${y}%)`,
                  transform: 'translate(-50%, -50%)',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: entry.pro.plan === 'infinity' ? '#f59e0b' : entry.pro.plan === 'premium' ? '#ec4899' : '#22d3ee',
                  border: '2px solid rgba(255,255,255,0.95)',
                  boxShadow: '0 0 0 4px rgba(236,72,153,0.14)',
                  animation: 'radar-blip 2.1s ease-in-out infinite',
                  animationDelay: `${(idx % 6) * 0.2}s`,
                  textDecoration: 'none',
                  zIndex: 5,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: -18,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 11,
                    color: '#ddd6fe',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {cat?.emoji ?? '✦'}
                </span>
              </Link>
            )
          })}

          {radarPros.length === 0 && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 320,
                maxWidth: '85%',
                textAlign: 'center',
                color: '#c4b5fd',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
              }}
            >
              Aucun professionnel disponible avec les filtres actuels.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
