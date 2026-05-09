'use client'

import React from 'react'
import { useLayout } from '@/lib/layout-provider'

interface StatCardProps {
  value: string | number
  label: string
  change?: number
  changeLabel?: string
  sparklineData?: number[]
  color?: string
  compact?: boolean
}

export function StatCard({ 
  value, 
  label, 
  change, 
  changeLabel,
  sparklineData,
  color = '#7c3aed',
  compact = false
}: StatCardProps) {
  const { dashboardLayout: layoutId } = useLayout()
  
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  // MINIMALIST - Un seul chiffre énorme centré
  if (layoutId === 'minimalist') {
    return (
      <div style={{
        padding: '48px 0',
        borderTop: '1px solid #f0f0f0',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 'clamp(5rem, 8vw, 9rem)',
          fontWeight: 200,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          color: '#000000',
          fontFamily: '"DM Sans", sans-serif',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: '#64748b',
          marginTop: 16,
          fontFamily: '"DM Sans", sans-serif',
        }}>
          {label}
        </div>
      </div>
    )
  }

  // PRO - Style Bloomberg/terminal financier
  if (layoutId === 'pro') {
    const changeColor = isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#64748b'
    
    return (
      <div style={{
        background: 'transparent',
        padding: '16px 20px',
        border: '1px solid #e2e8f0',
        borderRadius: 0,
      }}>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#64748b',
          marginBottom: 8,
          fontFamily: '"IBM Plex Mono", monospace',
        }}>
          {label}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
        }}>
          <div style={{
            fontSize: '1.6rem',
            fontWeight: 500,
            color: '#0f172a',
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: '-0.02em',
          }}>
            {value}
          </div>
          {change !== undefined && (
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: changeColor,
              fontFamily: '"IBM Plex Mono", monospace',
            }}>
              {isPositive ? '+' : ''}{change}%
            </div>
          )}
        </div>
      </div>
    )
  }

  // COMPACT - Stats sur une ligne
  if (layoutId === 'compact') {
    return (
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        padding: '12px 16px',
        minWidth: 120,
      }}>
        <div style={{
          fontSize: '1.2rem',
          fontWeight: 600,
          color: '#1f2937',
          fontFamily: '"Inter", sans-serif',
          lineHeight: 1.2,
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '0.6rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6b7280',
          marginTop: 4,
          fontFamily: '"Inter", sans-serif',
        }}>
          {label}
        </div>
        {change !== undefined && (
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 500,
            color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#6b7280',
            marginTop: 2,
            fontFamily: '"Inter", sans-serif',
          }}>
            {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}%
          </div>
        )}
      </div>
    )
  }

  // DARK PRO - Style crypto avec néons
  if (layoutId === 'dark-pro') {
    const neonColor = color || '#7c3aed'
    
    // Mini sparkline SVG
    const sparklineSvg = sparklineData && sparklineData.length > 1 ? (
      <svg 
        width="60" 
        height="20" 
        viewBox={`0 0 ${sparklineData.length - 1} 20`}
        style={{ marginTop: 8 }}
      >
        <polyline
          fill="none"
          stroke={neonColor}
          strokeWidth="1.5"
          points={sparklineData.map((v, i) => `${i},${20 - (v / Math.max(...sparklineData) * 20)}`).join(' ')}
        />
      </svg>
    ) : null

    return (
      <div style={{
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)`,
          opacity: 0.5,
        }} />
        
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#9ca3af',
          marginBottom: 8,
          fontFamily: '"Space Grotesk", sans-serif',
        }}>
          {label}
        </div>
        
        <div style={{
          fontSize: '1.75rem',
          fontWeight: 600,
          color: neonColor,
          fontFamily: '"Space Grotesk", sans-serif',
          textShadow: `0 0 20px ${neonColor}40`,
        }}>
          {value}
        </div>
        
        {sparklineSvg}
        
        {change !== undefined && (
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isPositive ? '#34d399' : isNegative ? '#f87171' : '#9ca3af',
            marginTop: 8,
            fontFamily: '"Space Grotesk", sans-serif',
          }}>
            {isPositive ? '▲' : isNegative ? '▼' : '—'} {Math.abs(change)}%
          </div>
        )}
      </div>
    )
  }

  // MODERN - Style par défaut avec dégradés
  return (
    <div style={{
      background: '#ffffff',
      border: 'none',
      borderRadius: 16,
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        fontSize: '0.875rem',
        color: '#64748b',
        marginBottom: 8,
        fontFamily: '"DM Sans", sans-serif',
      }}>
        {label}
      </div>

      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: '#0f172a',
        fontFamily: '"DM Sans", sans-serif',
      }}>
        {value}
      </div>

      {change !== undefined && (
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: isPositive ? '#10b981' : isNegative ? '#ef4444' : '#64748b',
          marginTop: 8,
          fontFamily: '"DM Sans", sans-serif',
        }}>
          {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}%
          {changeLabel && <span style={{ marginLeft: 4, opacity: 0.7 }}>{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
