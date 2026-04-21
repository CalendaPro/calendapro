'use client'

interface QuickStatsWidgetProps {
  confirmRate?: number
  noShowRate?: number
  avgCart?: number
  newClientsThisMonth?: number
}

export function QuickStatsWidget({
  confirmRate = 92,
  noShowRate = 3,
  avgCart = 45,
  newClientsThisMonth = 12
}: QuickStatsWidgetProps) {
  const stats = [
    { 
      label: 'Taux de confirmation', 
      value: `${confirmRate}%`, 
      icon: '✓',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    { 
      label: 'Taux de no-show', 
      value: `${noShowRate}%`, 
      icon: '✕',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    { 
      label: 'Panier moyen', 
      value: `${avgCart}€`, 
      icon: '€',
      color: '#7c3aed',
      bgColor: 'rgba(124, 58, 237, 0.1)'
    },
    { 
      label: 'Nouveaux ce mois', 
      value: newClientsThisMonth, 
      icon: '+',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: 'white',
            borderRadius: '14px',
            padding: '1rem',
            border: '1px solid rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.2s ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLDivElement
            target.style.transform = 'translateY(-2px)'
            target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLDivElement
            target.style.transform = 'translateY(0)'
            target.style.boxShadow = 'none'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: stat.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            color: stat.color,
            fontWeight: 600,
          }}>
            {stat.icon}
          </div>
          <div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: '#64748b',
            }}>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
