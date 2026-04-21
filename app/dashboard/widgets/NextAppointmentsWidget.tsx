'use client'

import Link from 'next/link'

interface Appointment {
  id: string
  title: string
  clientName: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled'
  service?: string
}

interface NextAppointmentsWidgetProps {
  appointments: Appointment[]
}

export function NextAppointmentsWidget({ appointments }: NextAppointmentsWidgetProps) {
  const hasAppointments = appointments.length > 0

  return (
    <div>
      {!hasAppointments ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          color: 'var(--dl-text-muted, #94a3b8)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div style={{ fontSize: '0.9rem' }}>Aucun rendez-vous aujourd'hui</div>
          <Link 
            href="/dashboard/appointments"
            style={{
              display: 'inline-block',
              marginTop: '12px',
              fontSize: '0.8rem',
              color: 'var(--dl-accent, #7c3aed)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            + Créer un rendez-vous
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {appointments.slice(0, 3).map((apt, index) => (
            <div
              key={apt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--dl-card-bg, white)',
                borderRadius: '12px',
                border: '1px solid var(--dl-card-border, rgba(0,0,0,0.04))',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Time indicator */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '50px',
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--dl-text-primary, #0f172a)',
                }}>
                  {apt.time}
                </div>
                {index === 0 && (
                  <div style={{
                    fontSize: '0.6rem',
                    color: '#7c3aed',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Prochain
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{
                width: '2px',
                height: '36px',
                borderRadius: '1px',
                background: apt.status === 'confirmed' 
                  ? 'linear-gradient(180deg, #10b981, #059669)' 
                  : 'linear-gradient(180deg, #f59e0b, #d97706)',
              }} />

              {/* Appointment details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {apt.title}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span>{apt.clientName}</span>
                  {apt.service && (
                    <>
                      <span>·</span>
                      <span style={{ opacity: 0.7 }}>{apt.service}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                background: apt.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: apt.status === 'confirmed' ? '#059669' : '#d97706',
              }}>
                {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
              </div>
            </div>
          ))}

          {appointments.length > 3 && (
            <Link
              href="/dashboard/appointments"
              style={{
                textAlign: 'center',
                padding: '10px',
                fontSize: '0.8rem',
                color: '#7c3aed',
                textDecoration: 'none',
                fontWeight: 500,
                borderRadius: '10px',
                background: 'rgba(124, 58, 237, 0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              Voir les {appointments.length - 3} autres rendez-vous →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
