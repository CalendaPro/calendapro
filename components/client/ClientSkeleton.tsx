// ═══════════════════════════════════════════════════════════════════════════════
// #45 - Skeleton loading pour les pages client
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react'

export function DashboardSkeleton() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: 32, width: 200, background: '#f1f5f9', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 16, width: 300, background: '#f1f5f9', borderRadius: 4 }} />
      </div>

      {/* KPI Cards skeleton */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, minWidth: 200, height: 120, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.2rem' }}>
            <div style={{ height: 12, width: 80, background: '#e2e8f0', borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 32, width: 60, background: '#e2e8f0', borderRadius: 8, marginBottom: 8 }} />
            <div style={{ height: 16, width: 100, background: '#e2e8f0', borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 72, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e2e8f0' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, width: 200, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 12, width: 150, background: '#e2e8f0', borderRadius: 4 }} />
            </div>
            <div style={{ width: 80, height: 24, background: '#e2e8f0', borderRadius: 100 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppointmentsSkeleton() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: 28, width: 180, background: '#f1f5f9', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 14, width: 250, background: '#f1f5f9', borderRadius: 4 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 36, width: 100, background: '#f1f5f9', borderRadius: 8 }} />
        ))}
      </div>

      {/* Appointment cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0' }} />
                <div>
                  <div style={{ height: 18, width: 180, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 14, width: 120, background: '#e2e8f0', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ width: 80, height: 24, background: '#e2e8f0', borderRadius: 100 }} />
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ height: 14, width: 100, background: '#e2e8f0', borderRadius: 4 }} />
              <div style={{ height: 14, width: 80, background: '#e2e8f0', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WalletSkeleton() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: 28, width: 150, background: '#f1f5f9', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 14, width: 200, background: '#f1f5f9', borderRadius: 4 }} />
      </div>

      {/* Balance card */}
      <div style={{ height: 140, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', borderRadius: 20, marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ height: 14, width: 100, background: 'rgba(255,255,255,0.5)', borderRadius: 4, marginBottom: 16 }} />
        <div style={{ height: 40, width: 150, background: 'rgba(255,255,255,0.5)', borderRadius: 8, marginBottom: 16 }} />
        <div style={{ height: 14, width: 200, background: 'rgba(255,255,255,0.3)', borderRadius: 4 }} />
      </div>

      {/* Transactions */}
      <div style={{ height: 24, width: 120, background: '#f1f5f9', borderRadius: 4, marginBottom: '1rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 64, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0' }} />
              <div>
                <div style={{ height: 16, width: 180, background: '#e2e8f0', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 12, width: 100, background: '#e2e8f0', borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ height: 20, width: 80, background: '#e2e8f0', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FavoritesSkeleton() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: 28, width: 120, background: '#f1f5f9', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 14, width: 200, background: '#f1f5f9', borderRadius: 4 }} />
      </div>

      {/* Favorites grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ height: 120, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', gap: '1rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 18, width: 150, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 14, width: 100, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 28, width: 120, background: '#e2e8f0', borderRadius: 100, marginTop: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ height: 28, width: 150, background: '#f1f5f9', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 14, width: 250, background: '#f1f5f9', borderRadius: 4 }} />
      </div>

      {/* Settings sections */}
      {[1, 2, 3, 4].map(section => (
        <div key={section} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e2e8f0' }} />
            <div style={{ height: 18, width: 150, background: '#e2e8f0', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 16, width: 200, background: '#e2e8f0', borderRadius: 4, marginBottom: 4 }} />
                  <div style={{ height: 12, width: 150, background: '#e2e8f0', borderRadius: 4 }} />
                </div>
                <div style={{ width: 44, height: 24, background: '#e2e8f0', borderRadius: 100 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
