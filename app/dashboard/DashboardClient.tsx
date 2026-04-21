'use client'

import { useEffect, useState } from 'react'

interface ChartPoint {
  day: string
  revenue: number
  rdv: number
}

export default function DashboardClient() {
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, avg: 0, count: 0 })
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const load = () => {
    fetch('/api/dashboard/chart', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: ChartPoint[]) => {
        setChartData(data)
        const total = data.reduce((s, d) => s + d.revenue, 0)
        const count = data.reduce((s, d) => s + d.rdv, 0)
        setSummary({ total, avg: count > 0 ? total / count : 0, count })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'short' })
  const todayShort = today.charAt(0).toUpperCase() + today.slice(1, 3)

  // Calcul de la moyenne pour la ligne de tendance
  const avgRevenue = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.revenue, 0) / chartData.length
    : 0
  const avgLineY = maxRevenue > 0 ? (avgRevenue / maxRevenue) * 120 : 0

  return (
    <div style={{ padding: '0 1.3rem 1.3rem' }}>
      {/* Summary row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          paddingTop: '1rem',
          borderBottom: '1px solid var(--dl-sidebar-border, #f4f2ee)',
          paddingBottom: '1rem',
        }}
      >
        {[
          {
            label: 'Total semaine',
            value: loading
              ? '--'
              : summary.total.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }),
          },
          {
            label: 'Moyenne/jour',
            value: loading
              ? '--'
              : (summary.total / 7).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }),
          },
          { label: 'RDV total', value: loading ? '--' : String(summary.count) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--dl-text-muted, #94a3b8)',
                marginBottom: '0.25rem',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: loading ? 'var(--dl-sidebar-border, #e2e8f0)' : 'var(--dl-text-primary, #0f172a)',
                fontFamily: "'Clash Display', sans-serif",
                letterSpacing: '-0.03em',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {loading ? (
        <div
          style={{
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--dl-text-muted, #cbd5e1)',
            fontSize: '0.8rem',
          }}
        >
          Chargement...
        </div>
      ) : chartData.every((d) => d.revenue === 0) ? (
        <div
          style={{
            height: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--dl-text-muted, #94a3b8)',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
            <line x1="2" y1="20" x2="22" y2="20" />
          </svg>
          <span style={{ fontSize: '0.78rem' }}>Aucune donnée cette semaine</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted, #cbd5e1)' }}>
            Les revenus apparaitront ici
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: 140, position: 'relative' }}>
          {/* Ligne de moyenne */}
          {avgRevenue > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: avgLineY + 20,
                height: 1,
                background: 'repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 4px, transparent 4px, transparent 8px)',
                opacity: 0.5,
                zIndex: 1,
              }}
            />
          )}
          {chartData.map((d) => {
            const isToday = d.day.startsWith(todayShort)
            const height = maxRevenue > 0 ? Math.max(4, (d.revenue / maxRevenue) * 120) : 4
            const isHovered = hoveredDay === d.day
            return (
              <div
                key={d.day}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                  position: 'relative',
                }}
                onMouseEnter={() => setHoveredDay(d.day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Tooltip */}
                {isHovered && d.revenue > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#0f172a', color: 'white',
                    borderRadius: 8, padding: '0.35rem 0.65rem',
                    fontSize: '0.7rem', fontWeight: 600,
                    whiteSpace: 'nowrap', zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    fontFamily: "'DM Sans', sans-serif",
                    marginBottom: '4px',
                  }}>
                    {d.rdv} RDV · {d.revenue.toLocaleString('fr-FR', {
                      style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
                    })}
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%',
                      transform: 'translateX(-50%)',
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '4px solid #0f172a',
                    }} />
                  </div>
                )}
                {d.revenue > 0 && !isHovered && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: isToday ? 'var(--dl-chart-primary, #7c3aed)' : 'var(--dl-text-muted, #64748b)',
                      opacity: isHovered ? 0 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {d.revenue.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    })}
                  </span>
                )}
                <div
                  style={{
                    width: '100%',
                    height,
                    borderRadius: '4px 4px 0 0',
                    background: isToday
                      ? 'linear-gradient(180deg, #7c3aed 0%, #a855f7 100%)'
                      : d.revenue > 0
                      ? 'linear-gradient(180deg, #c4b5fd 0%, #ddd6fe 100%)'
                      : '#f4f2ee',
                    boxShadow: isToday && d.revenue > 0
                      ? '0 4px 16px rgba(124,58,237,0.35)'
                      : 'none',
                    transition: 'height 0.4s ease, box-shadow 0.2s ease',
                    cursor: 'pointer',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--dl-chart-primary, #7c3aed)' : 'var(--dl-text-muted, #94a3b8)',
                  }}
                >
                  {d.day}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
