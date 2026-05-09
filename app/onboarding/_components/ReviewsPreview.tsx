'use client'

import React, { useEffect, useState } from 'react'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  client_name?: string
}

interface ReviewsData {
  reviews: Review[]
  rating: number | null
  review_count: number
}

interface Props {
  username: string
  accentColor: string
  maxVisible: number
  onMaxVisibleChange: (n: number) => void
  sortMode: 'recent' | 'top'
  onSortModeChange: (m: 'recent' | 'top') => void
}

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <span style={{ color }}>
      {[1, 2, 3, 4, 5].map(i => (
 <span key={i} style={{ opacity: i <= Math.round(rating) ? 1 : 0.25, fontSize: '0.8rem' }}></span>
      ))}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return "auj."
  if (d < 7) return `il y a ${d}j`
  if (d < 30) return `il y a ${Math.floor(d / 7)} sem.`
  return `il y a ${Math.floor(d / 30)} mois`
}

export default function ReviewsPreview({ username, accentColor, maxVisible, onMaxVisibleChange, sortMode, onSortModeChange }: Props) {
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    fetch(`/api/public/${username}`)
      .then(r => r.json())
      .then((d: ReviewsData) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [username])

  const sorted = data
    ? [...data.reviews].sort((a, b) =>
        sortMode === 'top' ? b.rating - a.rating : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, maxVisible)
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Summary */}
      {data && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', fontFamily: 'DM Sans,sans-serif', lineHeight: 1 }}>
            {data.rating?.toFixed(1) ?? '—'}
          </div>
          <div>
            {data.rating && <Stars rating={data.rating} color={accentColor} />}
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans,sans-serif', marginTop: 2 }}>
              {data.review_count} avis
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.76rem', fontFamily: 'DM Sans,sans-serif' }}>Chargement…</div>
      )}

      {!loading && data && data.review_count === 0 && (
        <div style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.76rem', fontFamily: 'DM Sans,sans-serif' }}>Aucun avis pour l'instant</div>
      )}

      {/* Sort + count controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {(['recent', 'top'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onSortModeChange(m)}
            style={{ padding: '3px 9px', borderRadius: 999, border: `1px solid ${sortMode === m ? accentColor : 'rgba(255,255,255,0.12)'}`, background: sortMode === m ? `${accentColor}20` : 'transparent', color: sortMode === m ? 'white' : 'rgba(255,255,255,0.45)', fontSize: '0.64rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
          >
            {m === 'recent' ? 'Récents' : 'Top notes'}
          </button>
        ))}
        <select
          value={maxVisible}
          onChange={e => onMaxVisibleChange(Number(e.target.value))}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.65)', padding: '3px 6px', fontSize: '0.65rem', fontFamily: 'DM Sans,sans-serif' }}
        >
          {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} avis</option>)}
        </select>
      </div>

      {/* Reviews list */}
      {sorted.map(r => (
        <div key={r.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Stars rating={r.rating} color={accentColor} />
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans,sans-serif' }}>{timeAgo(r.created_at)}</span>
          </div>
          {r.comment && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0, fontFamily: 'DM Sans,sans-serif' }}>
              "{r.comment}"
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
