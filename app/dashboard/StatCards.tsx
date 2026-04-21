'use client'

import { useLayout } from '@/lib/layout-provider'

interface StatCardsProps {
  todayCount: number
  weekCount: number
  clientsCount: number
  pendingCount: number
  revenue?: number
  revenueChange?: number
}

// Icon components
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const WeekIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

// Modern Stat Card with gradient icon, hover effects
function ModernStatCard({ 
  value, 
  label, 
  change,
  icon: Icon,
  accent = '#7c3aed'
}: { 
  value: number | string
  label: string
  change?: number
  icon: React.ComponentType
  accent?: string
}) {
  const changePositive = change && change > 0
  const changeNegative = change && change < 0
  
  return (
    <div 
      className="modern-stat-card"
      style={{
        background: 'var(--dl-card-bg, white)',
        borderRadius: '20px',
        padding: '1.6rem 1.8rem',
        border: '1px solid var(--dl-card-border, rgba(0,0,0,0.04))',
        boxShadow: 'var(--dl-card-shadow, 0 4px 20px rgba(0,0,0,0.05))',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLDivElement
        target.style.transform = 'translateY(-6px)'
        target.style.boxShadow = 'var(--dl-card-shadow-hover, 0 20px 40px rgba(0,0,0,0.1))'
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLDivElement
        target.style.transform = 'translateY(0)'
        target.style.boxShadow = 'var(--dl-card-shadow, 0 4px 20px rgba(0,0,0,0.05))'
      }}
    >
      {/* Gradient background effect on hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
      }} className="stat-card-accent-line" />
      
      {/* Icon in gradient circle */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${accent}15, ${accent}08)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accent,
        marginBottom: '1.2rem',
        transition: 'all 0.3s ease',
      }} className="stat-icon-wrapper">
        <Icon />
      </div>
      
      {/* Large elegant number */}
      <div style={{
        fontSize: '3rem',
        fontWeight: 600,
        color: 'var(--dl-text-primary, #0f172a)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
        marginBottom: '0.5rem',
        fontFamily: "'Inter', -apple-system, sans-serif",
        transition: 'transform 0.3s ease',
      }} className="stat-value">
        {value}
      </div>
      
      {/* Label */}
      <div style={{
        fontSize: '0.9rem',
        fontWeight: 400,
        color: 'var(--dl-text-muted, #64748b)',
        marginBottom: '0.9rem',
      }}>
        {label}
      </div>
      
      {/* Change indicator */}
      {change !== undefined && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: changePositive ? '#10b981' : changeNegative ? '#ef4444' : '#64748b',
          background: changePositive ? 'rgba(16, 185, 129, 0.1)' : changeNegative ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          padding: '0.35rem 0.85rem',
          borderRadius: '100px',
        }}>
          <span style={{ fontSize: '0.9rem' }}>
            {changePositive ? '↑' : changeNegative ? '↓' : '→'}
          </span>
          {Math.abs(change)}%
          <span style={{ fontWeight: 400, opacity: 0.7 }}>vs hier</span>
        </div>
      )}
    </div>
  )
}

// Simple clean stat card component (fallback)
function SimpleStatCard({ 
  value, 
  label, 
  change,
  accent = '#7c3aed'
}: { 
  value: number | string
  label: string
  change?: number
  accent?: string
}) {
  const changePositive = change && change > 0
  const changeNegative = change && change < 0
  
  return (
    <div style={{
      background: 'var(--dl-card-bg, white)',
      borderRadius: '16px',
      padding: '1.4rem 1.5rem',
      border: '1px solid var(--dl-card-border, #e5e7eb)',
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}>
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--dl-text-muted, #6b7280)',
        marginBottom: '0.75rem',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '2.4rem',
        fontWeight: 700,
        color: 'var(--dl-text-primary, #111827)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        marginBottom: '0.5rem',
      }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: changePositive ? '#059669' : changeNegative ? '#dc2626' : '#6b7280',
          background: changePositive ? '#f0fdf4' : changeNegative ? '#fef2f2' : '#f3f4f6',
          padding: '0.25rem 0.6rem',
          borderRadius: '100px',
        }}>
          {changePositive ? '↑' : changeNegative ? '↓' : '→'} {Math.abs(change)}%
        </div>
      )}
    </div>
  )
}

export function StatCards({ 
  todayCount, 
  weekCount, 
  clientsCount, 
  pendingCount,
  revenue = 12450,
  revenueChange = 2.3
}: StatCardsProps) {
  const { dashboardLayout: layoutId } = useLayout()

  // Style PRO - 2 colonnes denses avec monospace
  if (layoutId === 'pro') {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1px',
        border: '1px solid #0f172a',
        backgroundColor: '#0f172a',
        fontFamily: "'IBM Plex Mono', monospace",
        marginBottom: '1.5rem'
      }}>
        <div style={{ background: '#f8fafc', padding: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>RDV Aujourd'hui</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a' }}>{todayCount}</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Cette semaine</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a' }}>{weekCount}</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Clients</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a' }}>{clientsCount}</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>En attente</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a' }}>{pendingCount}</div>
        </div>
      </div>
    )
  }

  // Style MINIMALIST - 4 stat cards avec beaucoup d'espace blanc
  if (layoutId === 'minimalist') {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 24,
        marginBottom: '2rem',
        padding: '2rem 0',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '1rem' }}>Aujourd'hui</div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: '#111827', fontFamily: "'Playfair Display', serif" }}>{todayCount}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '1rem' }}>Cette semaine</div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: '#111827', fontFamily: "'Playfair Display', serif" }}>{weekCount}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '1rem' }}>Clients</div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: '#111827', fontFamily: "'Playfair Display', serif" }}>{clientsCount}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '1rem' }}>En attente</div>
          <div style={{ fontSize: '2rem', fontWeight: 300, color: '#111827', fontFamily: "'Playfair Display', serif" }}>{pendingCount}</div>
        </div>
      </div>
    )
  }

  // Style COMPACT - Une ligne horizontale dense
  if (layoutId === 'compact') {
    return (
      <div style={{ 
        display: 'flex', 
        gap: 0, 
        overflowX: 'auto',
        border: '1px solid #334155',
        borderRadius: 6,
        marginBottom: '1rem',
        background: '#1e293b'
      }}>
        <div style={{ padding: '0.5rem 1rem', borderRight: '1px solid #334155', minWidth: '100px' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Aujourd'hui</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>{todayCount}</div>
        </div>
        <div style={{ padding: '0.5rem 1rem', borderRight: '1px solid #334155', minWidth: '100px' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Semaine</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>{weekCount}</div>
        </div>
        <div style={{ padding: '0.5rem 1rem', borderRight: '1px solid #334155', minWidth: '100px' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Clients</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>{clientsCount}</div>
        </div>
        <div style={{ padding: '0.5rem 1rem', borderRight: '1px solid #334155', minWidth: '100px' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Attente</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>{pendingCount}</div>
        </div>
        <div style={{ padding: '0.5rem 1rem', minWidth: '100px' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>CA</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>{revenue}€</div>
        </div>
      </div>
    )
  }

  // Style DARK PRO - Sobre, professionnel, pas de néon
  if (layoutId === 'dark-pro') {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 16,
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: '#0f172a',
          borderRadius: '8px',
          padding: '1.2rem',
          border: '1px solid #1e293b',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>RDV aujourd'hui</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#f1f5f9' }}>{todayCount}</div>
        </div>
        <div style={{
          background: '#0f172a',
          borderRadius: '8px',
          padding: '1.2rem',
          border: '1px solid #1e293b',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Cette semaine</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#f1f5f9' }}>{weekCount}</div>
        </div>
        <div style={{
          background: '#0f172a',
          borderRadius: '8px',
          padding: '1.2rem',
          border: '1px solid #1e293b',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Clients</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#f1f5f9' }}>{clientsCount}</div>
        </div>
        <div style={{
          background: '#0f172a',
          borderRadius: '8px',
          padding: '1.2rem',
          border: '1px solid #1e293b',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>En attente</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#f1f5f9' }}>{pendingCount}</div>
        </div>
      </div>
    )
  }

  // MODERN (défaut) - 4 colonnes avec design premium
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(4, 1fr)', 
      gap: 20,
      marginBottom: '2rem'
    }}>
      <ModernStatCard 
        value={todayCount || '-'} 
        label="Rendez-vous aujourd'hui" 
        change={5.2} 
        icon={CalendarIcon}
        accent="#7c3aed"
      />
      <ModernStatCard 
        value={weekCount || '-'} 
        label="Cette semaine" 
        change={12.4} 
        icon={WeekIcon}
        accent="#3b82f6"
      />
      <ModernStatCard 
        value={clientsCount || '-'} 
        label="Clients actifs" 
        change={8.4} 
        icon={UsersIcon}
        accent="#10b981"
      />
      <ModernStatCard 
        value={pendingCount || '-'} 
        label="En attente de confirmation" 
        icon={ClockIcon}
        accent="#f59e0b"
      />
    </div>
  )
}
