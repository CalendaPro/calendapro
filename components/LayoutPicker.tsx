'use client'

import React from 'react'
import type { LayoutConfig } from '@/lib/layouts'

interface Props {
  layouts: LayoutConfig[]
  selected: string
  onSelect: (id: string) => void
  variant?: 'pro' | 'client'
  saving?: boolean
  compact?: boolean
}

const DEFAULT_PREVIEW = { bg: '#f8f7f4', sidebar: '#ffffff', card: '#ffffff', accent: '#7c3aed', text: '#0f172a', textMuted: '#94a3b8' }

function LayoutMiniPreview({ layout, variant }: { layout: LayoutConfig; variant: 'pro' | 'client' }) {
  const { bg, sidebar, card, accent, text, textMuted } = layout.preview ?? DEFAULT_PREVIEW

  if (variant === 'client') {
    return (
      <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: bg, position: 'relative', flexShrink: 0 }}>
        {/* Orb */}
        <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: accent, opacity: 0.3, filter: 'blur(20px)' }} />
        {/* Sidebar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '28%', background: sidebar, backdropFilter: 'blur(8px)', borderRight: `1px solid ${accent}22`, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 4px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 4, borderRadius: 3, background: i === 1 ? accent : `${text}22`, margin: '0 4px' }} />
          ))}
        </div>
        {/* Content */}
        <div style={{ position: 'absolute', left: '30%', right: 0, top: 0, bottom: 0, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ height: 14, borderRadius: 6, background: `${card}`, border: `1px solid ${accent}20`, padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 20, height: 4, borderRadius: 2, background: accent }} />
            <div style={{ width: 12, height: 3, borderRadius: 2, background: `${text}30` }} />
          </div>
          <div style={{ height: 20, borderRadius: 6, background: card, border: `1px solid ${accent}15`, padding: '4px 5px' }}>
            <div style={{ width: '60%', height: 3, borderRadius: 2, background: text, opacity: 0.8 }} />
            <div style={{ width: '40%', height: 2, borderRadius: 2, background: textMuted, marginTop: 3 }} />
          </div>
          <div style={{ flex: 1, borderRadius: 6, background: card, border: `1px solid ${accent}15` }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: bg, display: 'flex', flexShrink: 0 }}>
      {/* Sidebar */}
      <div style={{ width: '26%', background: sidebar, borderRight: `1px solid ${bg === sidebar ? 'transparent' : '#33415520'}`, display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 5px' }}>
        <div style={{ height: 5, width: '70%', borderRadius: 3, background: accent, marginBottom: 4 }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ height: 4, borderRadius: 3, background: i === 2 ? `${accent}22` : `${text}12`, margin: '1px 0' }} />
        ))}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: '7px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ height: 3, width: '45%', borderRadius: 2, background: text, opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ flex: 1, borderRadius: 5, background: card, border: `1px solid ${textMuted}25`, padding: '4px 5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ height: 2, width: '60%', borderRadius: 1, background: textMuted, opacity: 0.7 }} />
              <div style={{ height: 5, width: '80%', borderRadius: 1, background: text, opacity: 0.85 }} />
              <div style={{ height: 2, width: '50%', borderRadius: 1, background: accent, opacity: 0.6 }} />
            </div>
          ))}
        </div>
        <div style={{ height: 12, borderRadius: 5, background: card, border: `1px solid ${textMuted}20` }} />
      </div>
    </div>
  )
}

export default function LayoutPicker({ layouts, selected, onSelect, variant = 'pro', saving, compact }: Props) {
  const isDark = variant === 'client'

  const cardStyle = (isActive: boolean): React.CSSProperties => ({
    borderRadius: 12,
    border: `2px solid ${isActive ? 'var(--accent-primary, #7c3aed)' : (isDark ? 'rgba(255,255,255,0.08)' : 'var(--dl-card-border, #e7e5e4)')}`,
    background: isActive
      ? (isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)')
      : (isDark ? 'rgba(255,255,255,0.03)' : 'var(--dl-card-bg, #ffffff)'),
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    overflow: 'hidden',
    position: 'relative',
  })

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: compact ? 'repeat(5, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: compact ? 8 : 12,
    }}>
      {layouts.map(layout => {
        const isActive = selected === layout.id
        return (
          <button
            key={layout.id}
            type="button"
            onClick={() => onSelect(layout.id)}
            style={cardStyle(isActive)}
          >
            {/* Preview */}
            <div style={{ padding: 8, paddingBottom: 0 }}>
              <LayoutMiniPreview layout={layout} variant={variant} />
            </div>

            {/* Info */}
            <div style={{ padding: compact ? '6px 8px 8px' : '8px 10px 10px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{
                  fontSize: compact ? '0.72rem' : '0.8rem',
                  fontWeight: 700,
                  color: isActive
                    ? 'var(--accent-primary, #7c3aed)'
                    : (isDark ? '#f1f5f9' : 'var(--dl-text-primary, #0f172a)'),
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {layout.name}
                </span>
                {isActive && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary, #7c3aed)" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              {!compact && (
                <p style={{
                  fontSize: '0.62rem',
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'var(--dl-text-muted, #94a3b8)',
                  margin: 0,
                  fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1.4,
                }}>
                  {layout.description}
                </p>
              )}
            </div>

            {/* Active indicator dot */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent-primary, #7c3aed)',
                boxShadow: '0 0 0 2px white',
              }} />
            )}
          </button>
        )
      })}
      {saving && (
        <div style={{
          position: 'absolute',
          fontSize: '0.65rem',
          color: isDark ? 'rgba(255,255,255,0.4)' : 'var(--dl-text-muted)',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Enregistrement…
        </div>
      )}
    </div>
  )
}
