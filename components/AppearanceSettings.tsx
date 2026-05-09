'use client'

import React, { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/lib/theme-provider'
import { useAccentColor } from '@/lib/accent-color-provider'

const MODES: { value: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'light', label: 'Mode clair',   icon: <Sun className="w-5 h-5" />, desc: 'Fond blanc, texte sombre' },
  { value: 'dark',  label: 'Mode sombre',  icon: <Moon className="w-5 h-5" />, desc: 'Fond tres sombre, texte clair' },
  { value: 'auto',  label: 'Automatique',  icon: <Monitor className="w-5 h-5" />, desc: 'Suit les reglages du systeme' },
]

const ACCENT_COLORS = [
  '#7c3aed', '#6366f1', '#3b82f6', '#0ea5e9',
  '#10b981', '#f59e0b', '#f97316', '#ef4444',
  '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16',
]

interface Props {
  variant?: 'client' | 'pro'
}

export default function AppearanceSettings({ variant = 'pro' }: Props) {
  const { mode, activeMode, setThemeMode } = useTheme()
  const { accentColor, setAccentColor } = useAccentColor()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isDark = variant === 'client'

  const card = isDark
    ? { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.09)', text: '#f1f5f9', muted: 'rgba(255,255,255,0.4)' }
    : { bg: 'var(--dl-card-bg)', border: 'var(--dl-card-border)', text: 'var(--dl-text-primary)', muted: 'var(--dl-text-muted)' }

  useEffect(() => {
    fetch('/api/user/preferences')
      .then(r => r.json())
      .then((d: { theme_mode?: string }) => {
        if (d.theme_mode) setThemeMode(d.theme_mode as ThemeMode)
      })
      .catch(() => {})
  }, [setThemeMode])

  const saveThemeMode = async (newMode: ThemeMode) => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_mode: newMode }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  const handleModeChange = (newMode: ThemeMode) => {
    setThemeMode(newMode)
    void saveThemeMode(newMode)
  }

  const handleAccentChange = (color: string) => {
    setAccentColor(color)
  }

  const sectionTitle = (t: string) => (
    <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: card.muted, marginBottom: 12, fontFamily: 'DM Sans,sans-serif' }}>
      {t}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Mode selector ── */}
      <div>
        {sectionTitle('Theme de l interface')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODES.map(m => {
            const active = mode === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handleModeChange(m.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid ' + (active ? 'var(--accent-500)' : (isDark ? 'rgba(255,255,255,0.1)' : card.border)),
                  background: active ? (isDark ? 'var(--accent-15)' : 'var(--accent-10)') : (isDark ? 'rgba(255,255,255,0.03)' : card.bg),
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <span style={{ color: active ? 'var(--accent-500)' : card.text, display: 'flex', alignItems: 'center' }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? 'var(--accent-500)' : card.text, fontFamily: 'DM Sans,sans-serif' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: card.muted, fontFamily: 'DM Sans,sans-serif', marginTop: 1 }}>
                    {m.desc}
                    {m.value === 'auto' && ' • Actif: ' + (activeMode === 'dark' ? ' sombre' : ' clair')}
                  </div>
                </div>
                {active && (
                  <svg style={{ marginLeft: 'auto', color: 'var(--accent-500)', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Accent color ── */}
      <div>
        {sectionTitle('Couleur d accent')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {ACCENT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => handleAccentChange(color)}
              title={color}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 10,
                background: color,
                border: '2.5px solid ' + (accentColor === color ? 'white' : 'transparent'),
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: accentColor === color ? '0 0 0 2px ' + color : 'none',
                outline: accentColor === color ? '2px solid ' + color : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        {accentColor !== '#7c3aed' && (
          <button
            type="button"
            onClick={() => { setAccentColor('#7c3aed') }}
            style={{ marginTop: 8, fontSize: '0.68rem', color: card.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', textDecoration: 'underline' }}
          >
            Reinitialiser la couleur
          </button>
        )}
      </div>

      {/* ── Save status ── */}
      {(saving || saved) && (
        <div style={{ fontSize: '0.72rem', color: saved ? '#10b981' : card.muted, fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
          {saving
            ? <><span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--accent-20)', borderTopColor: 'var(--accent-500)', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Enregistrement...</>
            : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Preference sauvegardee</>
          }
        </div>
      )}

      <style>{'@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
    </div>
  )
}
