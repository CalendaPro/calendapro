'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface QuickIntel {
  avgBasket: number
  lostRevenue: number
  predictedRevenue: number
  topServices: { name: string; totalRevenue: number }[]
  confirmationRate: number
}

export function FinancialIntelligenceWidget() {
  const [data, setData] = useState<QuickIntel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/intelligence', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {loading ? (
        [...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
        ))
      ) : !data ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>Donnees indisponibles</p>
      ) : (
        <>
          {[
            { label: 'Panier moyen', value: fmt(data.avgBasket), color: '#a78bfa' },
            { label: 'CA perdu', value: fmt(data.lostRevenue), color: '#f87171' },
            { label: 'Prediction 7j', value: fmt(data.predictedRevenue), color: '#34d399' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif" }}>
                {label}
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color, fontFamily: "'Clash Display', sans-serif" }}>
                {value}
              </span>
            </div>
          ))}

          {data.topServices[0] && (
            <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(124,58,237,0.15)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.25)' }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.1rem' }}>Top service</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'white' }}>
                {data.topServices[0].name} — {fmt(data.topServices[0].totalRevenue)}
              </div>
            </div>
          )}

          <Link
            href="/dashboard/intelligence"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.55rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, color: 'white', textDecoration: 'none', marginTop: '0.25rem' }}
          >
            Voir l'analyse complete
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </>
      )}
    </div>
  )
}
