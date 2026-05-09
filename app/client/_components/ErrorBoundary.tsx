'use client'

import { Component, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error('[CalendaPro] Client error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem', textAlign: 'center',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '1rem',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#fef2f2', border: '1.5px solid #fecdd3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '1rem', fontWeight: 700,
            color: '#0f172a', margin: 0,
          }}>
            Une erreur est survenue
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.82rem', color: '#94a3b8', margin: 0,
          }}>
            Veuillez rafraichir la page. Si le probleme persiste,
            contactez le support.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.55rem 1.25rem',
              background: 'linear-gradient(135deg, #4F46E5, #6366f1)',
              color: 'white', border: 'none', borderRadius: 12,
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Rafraichir la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
