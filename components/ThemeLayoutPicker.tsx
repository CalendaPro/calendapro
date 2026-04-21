'use client'

import React, { useState } from 'react'
import { useLayout, type DashboardLayoutId } from '@/lib/layout-provider'

const LAYOUT_OPTIONS: { id: DashboardLayoutId; name: string; description: string }[] = [
  { id: 'modern',    name: 'Modern',    description: 'Élégant avec dégradés et animations fluides' },
  { id: 'pro',       name: 'Pro',       description: 'Style terminal financier, sobre et professionnel' },
  { id: 'minimalist',name: 'Minimalist',description: "Épuré, éditorial, beaucoup d'espace blanc" },
  { id: 'compact',   name: 'Compact',   description: 'Dense, efficace, sidebar icônes uniquement' },
  { id: 'dark-pro',  name: 'Dark Pro',  description: 'Sombre avec effets néon violets et animations glow' },
]

export function ThemeLayoutPicker() {
  const { dashboardLayout, setDashboardLayout, isLoading } = useLayout()
  const [saving, setSaving] = useState(false)

  const handleSelect = async (id: DashboardLayoutId) => {
    if (id === dashboardLayout || saving) return
    
    setSaving(true)
    await setDashboardLayout(id)
    setSaving(false)
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ 
        fontSize: '0.9rem', 
        fontWeight: 600, 
        marginBottom: 16,
        color: 'var(--dl-text-primary, #0f172a)'
      }}>
        Thème de design du dashboard
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
      }}>
        {LAYOUT_OPTIONS.map((option) => {
          const isActive = dashboardLayout === option.id
          
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={saving || isLoading}
              style={{
                borderRadius: 12,
                border: `2px solid ${isActive ? 'var(--accent-primary, #7c3aed)' : 'var(--dl-card-border, #e7e5e4)'}`,
                background: isActive 
                  ? 'rgba(124,58,237,0.06)' 
                  : 'var(--dl-card-bg, #ffffff)',
                cursor: saving || isLoading ? 'wait' : 'pointer',
                transition: 'all 0.18s ease',
                overflow: 'hidden',
                position: 'relative',
                padding: 16,
                textAlign: 'left',
                opacity: saving && !isActive ? 0.6 : 1,
              }}
            >
              {/* Preview mini basé sur le layout */}
              <div style={{ 
                height: 60, 
                borderRadius: 8, 
                marginBottom: 12,
                background: getPreviewBackground(option.id),
                border: '1px solid var(--dl-card-border, #e7e5e4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '0 8px',
              }}>
                {getPreviewElements(option.id)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isActive 
                    ? 'var(--accent-primary, #7c3aed)' 
                    : 'var(--dl-text-primary, #0f172a)',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {option.name}
                </span>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary, #7c3aed)" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              
              <p style={{
                fontSize: '0.72rem',
                color: 'var(--dl-text-muted, #64748b)',
                margin: 0,
                fontFamily: 'DM Sans, sans-serif',
                lineHeight: 1.4,
              }}>
                {option.description}
              </p>

              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--accent-primary, #7c3aed)',
                  boxShadow: '0 0 0 2px white',
                }} />
              )}
            </button>
          )
        })}
      </div>
      
      {(saving || isLoading) && (
        <div style={{
          marginTop: 12,
          fontSize: '0.75rem',
          color: 'var(--dl-text-muted, #64748b)',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {saving ? 'Enregistrement…' : 'Chargement…'}
        </div>
      )}
    </div>
  )
}

// Fonctions d'aide pour les previews
function getPreviewBackground(id: string): string {
  switch (id) {
    case 'modern': return 'linear-gradient(135deg, #fafaf8 0%, #ffffff 100%)'
    case 'pro': return '#f8fafc'
    case 'minimalist': return '#ffffff'
    case 'compact': return '#1e1e2e'
    case 'dark-pro': return '#0a0a0a'
    default: return '#fafaf8'
  }
}

function getPreviewElements(id: string): React.ReactNode {
  const baseStyle = (bg: string, width: string): React.CSSProperties => ({
    height: 4,
    borderRadius: 2,
    background: bg,
    width,
  })

  switch (id) {
    case 'modern':
      return (
        <>
          <div style={{ ...baseStyle('#7c3aed', '40%'), borderRadius: 9999 }} />
          <div style={baseStyle('#e5e7eb', '30%')} />
          <div style={{ ...baseStyle('#ec4899', '20%'), borderRadius: 9999 }} />
        </>
      )
    case 'pro':
      return (
        <>
          <div style={{ ...baseStyle('#0f172a', '35%'), height: 3, borderRadius: 1 }} />
          <div style={{ ...baseStyle('#cbd5e1', '25%'), height: 3, borderRadius: 1 }} />
          <div style={{ ...baseStyle('#0f172a', '20%'), height: 3, borderRadius: 1 }} />
        </>
      )
    case 'minimalist':
      return (
        <>
          <div style={{ ...baseStyle('#000000', '45%'), height: 1 }} />
          <div style={{ ...baseStyle('#e0e0e0', '30%'), height: 1 }} />
        </>
      )
    case 'compact':
      return (
        <>
          <div style={{ ...baseStyle('#7c3aed', '40%'), height: 6, borderRadius: 3 }} />
          <div style={{ ...baseStyle('#4b5563', '30%'), height: 6, borderRadius: 3 }} />
          <div style={{ ...baseStyle('#7c3aed', '35%'), height: 6, borderRadius: 3 }} />
        </>
      )
    case 'dark-pro':
      return (
        <>
          <div style={{ ...baseStyle('rgba(124,58,237,0.5)', '30%'), height: 4, borderRadius: 4, boxShadow: '0 0 8px rgba(124,58,237,0.4)' }} />
          <div style={{ ...baseStyle('rgba(255,255,255,0.1)', '20%'), height: 4, borderRadius: 4 }} />
          <div style={{ ...baseStyle('rgba(124,58,237,0.3)', '25%'), height: 4, borderRadius: 4 }} />
        </>
      )
    default:
      return null
  }
}
