'use client'

import { useEffect, useState } from 'react'

const PERIOD_OPTIONS = [30, 90, 180] as const
type PeriodDays = typeof PERIOD_OPTIONS[number]

interface TopService {
  name: string
  totalRevenue: number
  bookingCount: number
  avgPrice: number
}

interface PredictionDay {
  date: string
  label: string
  bookingCount: number
  expectedRevenue: number
}

interface TopSlot {
  slot: string
  count: number
}

interface IntelligenceData {
  avgBasket: number
  uniqueClientCount: number
  lostRevenue: number
  cancelledCount: number
  noShowCount: number
  topServices: TopService[]
  predictedRevenue: number
  confirmedUpcomingRevenue: number
  predictionByDay: PredictionDay[]
  completionRate: number
  confirmationRate: number
  noShowRate: number
  totalBookings90d: number
  topSlots?: TopSlot[]
}

function formatEur(n: number, decimals = 0) {
  return n.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: decimals,
  })
}

function StatBlock({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1.5px solid #ede9e3',
        borderRadius: 16,
        padding: '1.2rem 1.4rem',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: accent || '#0f172a', fontFamily: "'Clash Display', sans-serif", lineHeight: 1, marginBottom: '0.25rem' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub}</div>}
    </div>
  )
}

export default function IntelligencePage() {
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState<PeriodDays>(90)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setRefreshing(true)
    try {
      const r = await fetch(
        `/api/dashboard/intelligence?days=${period}`,
        { cache: 'no-store' }
      )
      if (!r.ok) throw new Error('API error')
      const d = await r.json()
      setData(d)
      setLastRefresh(new Date())
    } catch {
      setError(true)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [period])

  const handleExportCSV = () => {
    if (!data) return
    const rows = [
      ['Metrique', 'Valeur'],
      ['Panier moyen', data.avgBasket.toFixed(2)],
      ['CA perdu', data.lostRevenue.toFixed(2)],
      ['Taux confirmation', data.confirmationRate.toFixed(1) + '%'],
      ['Taux no-show', data.noShowRate.toFixed(1) + '%'],
      ['Prediction 7j', data.predictedRevenue.toFixed(2)],
      ...data.topServices.map(s => [s.name, s.totalRevenue.toFixed(2)]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intelligence-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.9rem' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: 96, borderRadius: 16, background: 'linear-gradient(90deg, #f4f2ee, #ede9e3, #f4f2ee)', backgroundSize: '400%', animation: 'shimmer 1.6s infinite' }} />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        Impossible de charger les donnees. Veuillez rafraichir la page.
      </div>
    )
  }

  const maxPredicted = Math.max(...data.predictionByDay.map((d) => d.expectedRevenue), 1)
  const maxServiceRev = Math.max(...data.topServices.map((s) => s.totalRevenue), 1)

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: -400% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ padding: '2rem 2.2rem', fontFamily: "'DM Sans', sans-serif", maxWidth: 1400 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.3rem' }}>
              Intelligence Financiere
            </div>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1, margin: 0 }}>
              Analyse de vos performances
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.4rem' }}>
              Basee sur les {period} derniers jours — {data.totalBookings90d} rendez-vous analyses
            </p>
            <span style={{
              fontSize: '0.68rem', color: '#94a3b8',
              fontFamily: "'DM Sans', sans-serif", marginTop: '0.2rem', display: 'block',
            }}>
              Mis à jour {lastRefresh.toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Period selector */}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {PERIOD_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriod(d)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 8, fontSize: '0.72rem', fontWeight: 600,
                    border: period === d ? '1.5px solid #7c3aed' : '1.5px solid #ede9e3',
                    background: period === d ? '#f5f3ff' : 'white',
                    color: period === d ? '#7c3aed' : '#94a3b8',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {d === 180 ? '6 mois' : `${d}j`}
                </button>
              ))}
            </div>
            {/* Export CSV button */}
            {/* Refresh button */}
            <button
              onClick={loadData}
              disabled={refreshing}
              style={{
                padding: '0.5rem',
                border: '1.5px solid #ede9e3',
                borderRadius: 10, background: 'white', cursor: 'pointer',
                color: refreshing ? '#a78bfa' : '#94a3b8',
                display: 'flex', alignItems: 'center',
                transition: 'all 0.18s',
              }}
              title="Actualiser les donnees"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!data}
              style={{
                padding: '0.5rem 1.1rem',
                border: '1.5px solid #ede9e3',
                borderRadius: 12, fontSize: '0.78rem', fontWeight: 600,
                color: '#374151', background: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'all 0.18s', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exporter CSV
            </button>
          </div>
        </div>

        {/* KPI Grid principale */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.9rem', marginBottom: '1.5rem' }}>
          <StatBlock
            label="Panier moyen / client"
            value={formatEur(data.avgBasket)}
            sub={`${data.uniqueClientCount} clients actifs`}
            accent="#7c3aed"
          />
          <StatBlock
            label="CA perdu (annulations)"
            value={formatEur(data.lostRevenue)}
            sub={`${data.cancelledCount} annulations, ${data.noShowCount} no-shows`}
            accent="#ef4444"
          />
          <StatBlock
            label="Taux de confirmation"
            value={`${data.confirmationRate.toFixed(1)}%`}
            sub={`${data.totalBookings90d} RDV sur 90 jours`}
            accent={data.confirmationRate >= 85 ? '#10b981' : '#f59e0b'}
          />
          <StatBlock
            label="Prediction 7 prochains jours"
            value={formatEur(data.predictedRevenue)}
            sub={`Base sur ${data.completionRate}% de completion`}
            accent="#10b981"
          />
        </div>

        {/* Ligne 2 : Prediction par jour + Top services */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Prediction par jour */}
          <div style={{ background: '#fff', border: '1.5px solid #ede9e3', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.2rem' }}>
                  Prediction
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Clash Display', sans-serif" }}>
                  CA prevu — 7 prochains jours
                </div>
              </div>
              <div style={{ padding: '0.35rem 0.9rem', borderRadius: 100, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>
                {formatEur(data.predictedRevenue)} attendus
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 120 }}>
              {data.predictionByDay.map((d) => {
                const h = maxPredicted > 0 ? Math.max(4, (d.expectedRevenue / maxPredicted) * 100) : 4
                return (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    {d.expectedRevenue > 0 && (
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#7c3aed', textAlign: 'center' }}>
                        {formatEur(d.expectedRevenue, 0)}
                      </span>
                    )}
                    <div
                      style={{
                        width: '100%',
                        height: h,
                        borderRadius: '4px 4px 0 0',
                        background: d.expectedRevenue > 0
                          ? 'linear-gradient(180deg, #7c3aed, #a855f7)'
                          : '#f4f2ee',
                        position: 'relative',
                      }}
                    >
                      {d.bookingCount > 0 && (
                        <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: '0.58rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {d.bookingCount} RDV
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>
                      {d.label.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top 3 services */}
          <div style={{ background: '#fff', border: '1.5px solid #ede9e3', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.2rem' }}>
              Rentabilite
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Clash Display', sans-serif", marginBottom: '1.25rem' }}>
              Top 3 services
            </div>

            {data.topServices.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', paddingTop: '2rem' }}>
                Pas encore de donnees suffisantes
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.topServices.map((svc, idx) => {
                  const barWidth = (svc.totalRevenue / maxServiceRev) * 100
                  const rankColors = ['#7c3aed', '#a855f7', '#d8b4fe']
                  return (
                    <div key={svc.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: rankColors[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                            {svc.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: rankColors[idx], flexShrink: 0 }}>
                          {formatEur(svc.totalRevenue)}
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: '#f4f2ee', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: 3, background: rankColors[idx], transition: 'width 0.6s ease' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{svc.bookingCount} reservations</span>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Moy. {formatEur(svc.avgPrice)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ligne 3 : CA perdu detail + Historique taux */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* CA Perdu detail */}
          <div style={{ background: '#fff', border: '1.5px solid #fecdd3', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 24px rgba(239,68,68,0.04)' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.2rem' }}>
              Impact financier
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Clash Display', sans-serif", marginBottom: '1.25rem' }}>
              Analyse des pertes (90 jours)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'CA perdu total', value: formatEur(data.lostRevenue), color: '#ef4444', bg: '#fef2f2', border: '#fecdd3' },
                { label: 'Annulations', value: String(data.cancelledCount), color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                { label: 'No-shows', value: String(data.noShowCount), color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
                { label: 'Taux no-show', value: `${data.noShowRate.toFixed(1)}%`, color: data.noShowRate <= 5 ? '#10b981' : '#ef4444', bg: data.noShowRate <= 5 ? '#f0fdf4' : '#fef2f2', border: data.noShowRate <= 5 ? '#bbf7d0' : '#fecdd3' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ padding: '0.75rem 0.9rem', background: bg, border: `1px solid ${border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color, fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.03em' }}>{value}</div>
                </div>
              ))}
            </div>
            {data.lostRevenue > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.9rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#c2410c' }}>
                  Conseil : Activer les acomptes obligatoires peut reduire vos no-shows de 60 a 80%.
                </div>
              </div>
            )}
          </div>

          {/* Panier moyen et performance */}
          <div style={{ background: '#fff', border: '1.5px solid #ede9e3', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.2rem' }}>
              Clients
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Clash Display', sans-serif", marginBottom: '1.25rem' }}>
              Valeur client et fidelisation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Panier moyen', value: formatEur(data.avgBasket), color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
                { label: 'Clients actifs', value: String(data.uniqueClientCount), color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0' },
                { label: 'Taux confirmation', value: `${data.confirmationRate.toFixed(1)}%`, color: data.confirmationRate >= 85 ? '#10b981' : '#f59e0b', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'RDV analyses', value: String(data.totalBookings90d), color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ padding: '0.75rem 0.9rem', background: bg, border: `1px solid ${border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color, fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.03em' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5 — Analyse des créneaux horaires */}
        {data.topSlots && data.topSlots.length > 0 && (
          <div style={{
            background: '#fff', border: '1.5px solid #ede9e3',
            borderRadius: 20, padding: '1.4rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            marginTop: '1rem',
          }}>
            <div style={{
              fontSize: '0.62rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: '#94a3b8', marginBottom: '0.2rem',
            }}>
              Optimisation
            </div>
            <div style={{
              fontSize: '1rem', fontWeight: 700, color: '#0f172a',
              fontFamily: "'Clash Display', sans-serif", marginBottom: '1.25rem',
            }}>
              Vos creneaux les plus reserves
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {data.topSlots.map((s, idx) => {
                const maxCount = data.topSlots![0].count
                const intensity = s.count / maxCount
                return (
                  <div
                    key={s.slot}
                    style={{
                      flex: '1 1 120px',
                      padding: '1rem',
                      borderRadius: 14,
                      background: idx === 0
                        ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                        : `rgba(124,58,237,${0.08 + intensity * 0.12})`,
                      border: idx === 0
                        ? 'none'
                        : '1.5px solid rgba(124,58,237,0.15)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      fontFamily: "'Clash Display', sans-serif",
                      fontSize: '1.4rem', fontWeight: 700,
                      color: idx === 0 ? 'white' : '#7c3aed',
                      letterSpacing: '-0.03em',
                    }}>
                      {s.slot}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: idx === 0 ? 'rgba(255,255,255,0.8)' : '#64748b',
                      marginTop: '0.2rem', fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {s.count} reservation{s.count > 1 ? 's' : ''}
                    </div>
                    {idx === 0 && (
                      <div style={{
                        fontSize: '0.62rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.9)',
                        marginTop: '0.4rem',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 100, padding: '0.15rem 0.5rem',
                        display: 'inline-block',
                      }}>
                        CRENEAU OR
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p style={{
              fontSize: '0.72rem', color: '#94a3b8',
              marginTop: '0.75rem', fontStyle: 'italic',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Base sur {data.totalBookings90d} reservations analysees.
              Ouvrez ces creneaux en priorite sur votre planning.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
