'use client'

import React, { useState, useCallback } from 'react'
import { useLayout, type DashboardLayoutId } from '@/lib/layout-provider'
import { generatePalette } from '@/lib/themes-complete'

interface DesignTheme {
  id: DashboardLayoutId
  name: string
  description: string
  colors: string[]
  accent: string
  previewBg: string
  idealFor: string
}

const DESIGN_THEMES: DesignTheme[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Elegant avec degrades et animations fluides',
    colors: ['#7c3aed', '#ec4899', '#f59e0b'],
    accent: '#7c3aed',
    previewBg: 'linear-gradient(135deg, #fafaf8 0%, #ffffff 100%)',
    idealFor: 'Tous les secteurs'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Style terminal financier, sobre et professionnel',
    colors: ['#0f172a', '#1e293b', '#64748b'],
    accent: '#0f172a',
    previewBg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    idealFor: 'Finance, consulting, juridique'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Epure, editorial, beaucoup d espace blanc',
    colors: ['#000000', '#374151', '#9ca3af'],
    accent: '#000000',
    previewBg: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    idealFor: 'Agences creatives, design'
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense, efficace, sidebar icones uniquement',
    colors: ['#7c3aed', '#4b5563', '#1f2937'],
    accent: '#7c3aed',
    previewBg: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
    idealFor: 'Power users, admins'
  },
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    description: 'Sombre avec effets neon violets',
    colors: ['#7c3aed', '#06b6d4', '#f59e0b'],
    accent: '#7c3aed',
    previewBg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    idealFor: 'Tech, dev, gaming'
  }
]

export function DesignSystemPicker() {
  const { dashboardLayout, setDashboardLayout, isLoading } = useLayout()
  const [selectedAccent, setSelectedAccent] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const currentTheme = DESIGN_THEMES.find(t => t.id === dashboardLayout) || DESIGN_THEMES[0]
  const palette = generatePalette(selectedAccent || currentTheme.accent)

  const handleSelect = useCallback(async (theme: DesignTheme) => {
    if (theme.id === dashboardLayout || saving) return
    
    setSaving(true)
    setSelectedAccent(null)
    await setDashboardLayout(theme.id)
    setSaving(false)
  }, [dashboardLayout, saving, setDashboardLayout])

  const handleAccentChange = useCallback((color: string) => {
    setSelectedAccent(color)
  }, [])

  return (
    <div>
      <h3 style={{ 
        fontSize: '0.9rem', 
        fontWeight: 600, 
        marginBottom: 16,
        color: 'var(--dl-text-primary, #0f172a)',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        Theme de design du dashboard
      </h3>
      
      {/* Layout Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        {DESIGN_THEMES.map((theme) => {
          const isActive = dashboardLayout === theme.id
          
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme)}
              disabled={saving || isLoading}
              style={{
                borderRadius: 12,
                border: '2px solid ' + (isActive ? theme.accent : 'var(--dl-card-border, #e7e5e4)'),
                background: isActive ? theme.previewBg : 'var(--dl-card-bg, #ffffff)',
                cursor: saving || isLoading ? 'wait' : 'pointer',
                transition: 'all 0.18s ease',
                overflow: 'hidden',
                position: 'relative',
                padding: 0,
                textAlign: 'left',
                opacity: saving && !isActive ? 0.6 : 1,
              }}
            >
              {/* Preview */}
              <div style={{ 
                height: 80, 
                background: theme.previewBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '0 16px',
              }}>
                {/* Mini layout preview */}
                <div style={{
                  width: 60,
                  height: 40,
                  background: theme.id === 'dark-pro' ? '#1a1a2e' : theme.id === 'compact' ? '#2d2d44' : '#ffffff',
                  borderRadius: 4,
                  display: 'flex',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  {/* Sidebar preview */}
                  <div style={{
                    width: theme.id === 'compact' ? 12 : theme.id === 'minimalist' ? 16 : 20,
                    height: '100%',
                    background: theme.accent,
                    opacity: theme.id === 'pro' ? 0 : 1
                  }} />
                  {/* Content preview */}
                  <div style={{ flex: 1, padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ height: 3, background: theme.colors[1] || theme.accent, borderRadius: 1, opacity: 0.3 }} />
                    <div style={{ height: 3, background: theme.colors[1] || theme.accent, borderRadius: 1, opacity: 0.2, width: '80%' }} />
                    <div style={{ height: 3, background: theme.colors[1] || theme.accent, borderRadius: 1, opacity: 0.15, width: '60%' }} />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: isActive ? theme.accent : 'var(--dl-text-primary, #0f172a)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {theme.name}
                  </span>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                
                <p style={{
                  fontSize: '0.72rem',
                  color: 'var(--dl-text-muted, #64748b)',
                  margin: '0 0 4px 0',
                  fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1.3,
                }}>
                  {theme.description}
                </p>
                
                <p style={{
                  fontSize: '0.65rem',
                  color: 'var(--dl-text-muted, #64748b)',
                  margin: 0,
                  fontFamily: 'DM Sans, sans-serif',
                  fontStyle: 'italic'
                }}>
                  Ideal pour: {theme.idealFor}
                </p>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: theme.accent,
                  boxShadow: '0 0 0 2px white',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Accent Color Selection */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          fontWeight: 600, 
          marginBottom: 12,
          color: 'var(--dl-text-primary, #0f172a)',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Couleurs du theme {currentTheme.name}
        </h4>
        
        {/* Color swatches */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {currentTheme.colors.map((color, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAccentChange(color)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: color,
                border: selectedAccent === color ? '3px solid white' : '2px solid transparent',
                boxShadow: selectedAccent === color ? '0 0 0 2px ' + color + ', 0 4px 12px ' + color + '40' : '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: selectedAccent === color ? 'scale(1.1)' : 'scale(1)'
              }}
              title={'Utiliser ' + color}
            />
          ))}
        </div>

        {/* Palette Preview */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(to right, ' + palette[50] + ', ' + palette[100] + ', ' + palette[200] + ', ' + palette[300] + ', ' + palette[400] + ', ' + palette[500] + ', ' + palette[600] + ', ' + palette[700] + ', ' + palette[800] + ', ' + palette[900] + ')',
              marginBottom: 8,
              border: '1px solid var(--dl-card-border, #e7e5e4)',
            }}
          />
          <p style={{
            fontSize: '0.65rem',
            color: 'var(--dl-text-muted, #64748b)',
            margin: 0,
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Palette generee a partir de la couleur selectionnee
          </p>
        </div>
      </div>

      {/* Loading state */}
      {(saving || isLoading) && (
        <div style={{
          marginTop: 12,
          fontSize: '0.75rem',
          color: 'var(--dl-text-muted, #64748b)',
          fontFamily: 'DM Sans, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            border: '2px solid var(--dl-card-border)', 
            borderTopColor: currentTheme.accent,
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite'
          }} />
          {saving ? 'Enregistrement...' : 'Chargement...'}
        </div>
      )}

      <style>{'@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
    </div>
  )
}
