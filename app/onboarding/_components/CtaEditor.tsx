'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface CtaConfig {
  text: string
  style: 'gradient' | 'solid' | 'outline' | 'glassmorphic'
  action: 'modal' | 'scroll' | 'whatsapp' | 'custom'
  customUrl: string
}

export const DEFAULT_CTA: CtaConfig = {
  text: 'Réserver maintenant',
  style: 'gradient',
  action: 'modal',
  customUrl: '',
}

const SUGGESTIONS = [
  'Réserver un RDV',
  'Prendre rendez-vous',
  'Me contacter',
  'Découvrir mes services',
  'Réserver maintenant',
  'Voir mes disponibilités',
]

const ACTIONS: { id: CtaConfig['action']; label: string; icon: string }[] = [
 { id: 'modal', label: 'Ouvrir réservation', icon: '' },
 { id: 'scroll', label: 'Scroller aux services', icon: '⬇' },
 { id: 'whatsapp', label: 'Ouvrir WhatsApp', icon: '' },
 { id: 'custom', label: 'Lien personnalisé', icon: '' },
]

interface Props {
  value: CtaConfig
  onChange: (v: CtaConfig) => void
  accentColor: string
}

export default function CtaEditor({ value, onChange, accentColor }: Props) {
  const radioStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 9,
    border: `1.5px solid ${active ? accentColor : 'rgba(255,255,255,0.09)'}`,
    background: active ? `${accentColor}18` : 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  const STYLES: { id: CtaConfig['style']; label: string }[] = [
    { id: 'gradient',     label: 'Gradient' },
    { id: 'solid',        label: 'Solid' },
    { id: 'outline',      label: 'Outline' },
    { id: 'glassmorphic', label: 'Glass' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Text */}
      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Texte du bouton</div>
        <input
          value={value.text}
          onChange={e => onChange({ ...value, text: e.target.value })}
          style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.85)', padding: '7px 10px', fontSize: '0.77rem', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
          {SUGGESTIONS.filter(s => s !== value.text).slice(0, 4).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...value, text: s })}
              style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '0.63rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Style</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {STYLES.map(s => (
            <motion.button
              key={s.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ ...value, style: s.id })}
              style={radioStyle(value.style === s.id)}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: value.style === s.id ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif' }}>{s.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Aperçu</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: value.style === 'glassmorphic' ? 14 : value.style === 'solid' || value.style === 'outline' ? 10 : 999,
            ...(value.style === 'gradient'     ? { background: `linear-gradient(135deg,${accentColor},${accentColor}bb)`, color: '#fff', border: 'none' } :
               value.style === 'solid'        ? { background: accentColor, color: '#fff', border: 'none' } :
               value.style === 'outline'      ? { background: 'transparent', color: accentColor, border: `2px solid ${accentColor}` } :
               /* glassmorphic */               { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }),
            fontWeight: 700,
            fontSize: '0.82rem',
            fontFamily: 'DM Sans,sans-serif',
            boxShadow: value.style === 'gradient' ? `0 8px 24px ${accentColor}44` : 'none',
            transition: 'all 0.3s',
          }}>
            {value.text || 'Réserver'}
          </div>
        </div>
      </div>

      {/* Action */}
      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Action au clic</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ACTIONS.map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange({ ...value, action: a.id })}
              style={radioStyle(value.action === a.id)}
            >
              <span style={{ fontSize: '0.85rem' }}>{a.icon}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: value.action === a.id ? 'white' : 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans,sans-serif' }}>{a.label}</span>
              {value.action === a.id && <svg style={{ marginLeft: 'auto', color: accentColor }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
        {value.action === 'custom' && (
          <input
            type="url"
            placeholder="https://..."
            value={value.customUrl}
            onChange={e => onChange({ ...value, customUrl: e.target.value })}
            style={{ marginTop: 6, width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.85)', padding: '6px 10px', fontSize: '0.75rem', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
          />
        )}
      </div>
    </div>
  )
}
