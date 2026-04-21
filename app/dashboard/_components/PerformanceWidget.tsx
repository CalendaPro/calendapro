'use client'

import { useEffect, useState } from 'react'

interface IntelligenceData {
  avgBasket: number
  confirmationRate: number
  noShowRate: number
  lostRevenue: number
  uniqueClientCount: number
  totalBookings90d: number
  noShowCount?: number
  confirmationRatePrev?: number
  totalBookingsPrev?: number
}

// Composant Trend pour afficher la tendance vs période précédente
function Trend({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null
  const delta = current - prev
  const pct = Math.round(Math.abs(delta / prev) * 100)
  if (pct < 2) return (
    <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>stable</span>
  )
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 700,
      color: delta > 0 ? '#10b981' : '#ef4444',
    }}>
      {delta > 0 ? '+' : '-'}{pct}%
    </span>
  )
}

export function PerformanceWidget() {
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/intelligence', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  if (loading) {
    return (
      <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 48, borderRadius: 8, background: 'var(--dl-sidebar-bg, #f4f2ee)' }} />
        ))}
      </div>
    )
  }

  if (!data) return null

  const metrics = [
    {
      label: 'Taux confirmation',
      value: `${data.confirmationRate.toFixed(1)}%`,
      sub: `${data.totalBookings90d} RDV / 90j`,
      positive: data.confirmationRate >= 85,
      hasTrend: true,
      current: data.confirmationRate,
      prev: data.confirmationRatePrev ?? 0,
    },
    {
      label: 'Taux no-show',
      value: `${data.noShowRate.toFixed(1)}%`,
      sub: `${data.noShowCount ?? 0} absences`,
      positive: data.noShowRate <= 5,
      hasTrend: false,
    },
    {
      label: 'Panier moyen',
      value: fmt(data.avgBasket),
      sub: `${data.uniqueClientCount} clients actifs`,
      positive: true,
      hasTrend: false,
    },
    {
      label: 'Nouveaux / 90j',
      value: String(data.uniqueClientCount),
      sub: 'clients uniques',
      positive: true,
      hasTrend: true,
      current: data.totalBookings90d,
      prev: data.totalBookingsPrev ?? 0,
    },
  ]

  return (
    <div style={{ padding: '0.5rem 1rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
      {metrics.map(({ label, value, sub, positive, hasTrend, current, prev }) => (
        <div
          key={label}
          style={{
            padding: '0.6rem 0.75rem',
            borderRadius: 10,
            background: 'var(--dl-sidebar-bg, #f8f7f4)',
            border: '1px solid var(--dl-card-border, #ede9e3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--dl-text-muted, #94a3b8)' }}>
              {label}
            </span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: positive ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dl-text-primary, #0f172a)', fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.02em' }}>
            {value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--dl-text-muted, #94a3b8)' }}>{sub}</span>
            {hasTrend && current !== undefined && prev !== undefined && (
              <Trend current={current} prev={prev} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
