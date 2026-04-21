'use client'

import { useEffect, useState, useCallback } from 'react'

interface Stats {
  todayCount: number
  weekCount: number
  pendingCount: number
  weekRevenue: number
  weekRevenuePrevision: number
}

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchStats()
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(fetchStats, 30_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading || !stats) {
    return (
      <div className="db-kpis">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="db-kpi">
            <div className="db-kpi-label">Chargement...</div>
            <div className="db-kpi-value" style={{ color: 'var(--dl-sidebar-border, #e2e8f0)' }}>—</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="db-kpis">
      <div className="db-kpi">
        <div className="db-kpi-label">RDV aujourd'hui</div>
        <div className="db-kpi-value">{stats.todayCount}</div>
        <div className="db-kpi-sub">rendez-vous</div>
        <div className="db-kpi-tag" style={{ background: 'var(--dl-accent-light, #f5f3ff)', color: 'var(--dl-chart-primary, #7c3aed)' }}>
          Planifiés
        </div>
      </div>
      <div className="db-kpi">
        <div className="db-kpi-label">Cette semaine</div>
        <div className="db-kpi-value">{stats.weekCount}</div>
        <div className="db-kpi-sub">rendez-vous</div>
        <div className="db-kpi-tag" style={{ background: 'rgba(16, 163, 74, 0.15)', color: '#22c55e' }}>
          En cours
        </div>
      </div>
      <div className="db-kpi">
        <div className="db-kpi-label">En attente</div>
        <div className="db-kpi-value">{stats.pendingCount}</div>
        <div className="db-kpi-sub">à confirmer</div>
        <div
          className="db-kpi-tag"
          style={{
            background: stats.pendingCount > 0 ? 'rgba(217, 119, 6, 0.15)' : 'var(--dl-sidebar-bg, #f8fafc)',
            color: stats.pendingCount > 0 ? '#f59e0b' : 'var(--dl-text-muted, #94a3b8)',
          }}
        >
          {stats.pendingCount > 0 ? 'Action requise' : 'Tout bon'}
        </div>
      </div>
      <div className="db-kpi">
        <div className="db-kpi-label">CA semaine</div>
        <div className="db-kpi-value" style={{ color: '#22c55e' }}>
          {stats.weekRevenue.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          })}
        </div>
        <div className="db-kpi-sub">
          {stats.weekRevenuePrevision > stats.weekRevenue
            ? `+ ${(stats.weekRevenuePrevision - stats.weekRevenue).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              })} previsionnel`
            : 'encaisse et depots'}
        </div>
        <div className="db-kpi-tag" style={{ background: 'rgba(16, 163, 74, 0.15)', color: '#22c55e' }}>
          {stats.weekRevenuePrevision > stats.weekRevenue ? 'Partiel' : 'Confirme'}
        </div>
      </div>
    </div>
  )
}
