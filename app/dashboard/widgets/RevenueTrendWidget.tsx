'use client'

interface RevenueTrendWidgetProps {
  todayRevenue?: number
  yesterdayRevenue?: number
  weekRevenue?: number
  lastWeekRevenue?: number
}

export function RevenueTrendWidget({
  todayRevenue = 0,
  yesterdayRevenue = 0,
  weekRevenue = 0,
  lastWeekRevenue = 0
}: RevenueTrendWidgetProps) {
  const dayChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : 0
  const weekChange = lastWeekRevenue > 0 
    ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
    : 0

  const formatCurrency = (value: number) => {
    if (value === 0) return '—'
    return `${value.toLocaleString('fr-FR')} €`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Today vs Yesterday */}
      <div style={{
        padding: '16px',
        background: 'white',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
              Aujourd'hui
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              {formatCurrency(todayRevenue)}
            </div>
          </div>
          {dayChange !== 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: dayChange > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: dayChange > 0 ? '#059669' : '#dc2626',
            }}>
              <span>{dayChange > 0 ? '↑' : '↓'}</span>
              {Math.abs(dayChange).toFixed(1)}%
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Hier: {formatCurrency(yesterdayRevenue)}
        </div>
      </div>

      {/* Week comparison */}
      <div style={{
        padding: '16px',
        background: 'white',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
              Cette semaine
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              {formatCurrency(weekRevenue)}
            </div>
          </div>
          {weekChange !== 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: weekChange > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: weekChange > 0 ? '#059669' : '#dc2626',
            }}>
              <span>{weekChange > 0 ? '↑' : '↓'}</span>
              {Math.abs(weekChange).toFixed(1)}%
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Semaine dernière: {formatCurrency(lastWeekRevenue)}
        </div>
      </div>

      {/* Projection */}
      {weekRevenue > 0 && (
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(124, 58, 237, 0.02))',
          borderRadius: '14px',
          border: '1px solid rgba(124, 58, 237, 0.15)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginBottom: '4px', fontWeight: 500 }}>
            Projection fin de mois
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#7c3aed' }}>
            ~{(weekRevenue * 4.3).toLocaleString('fr-FR')} €
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            Basé sur la tendance actuelle
          </div>
        </div>
      )}
    </div>
  )
}
