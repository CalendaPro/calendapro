'use client'

import React from 'react'
import { motion } from 'framer-motion'

const SECTION_LABELS: Record<string, string> = {
  about:    'À propos',
  services: 'Services',
  reviews:  'Avis clients',
  schedule: 'Horaires',
  gallery:  'Galerie',
  cta:      'Bouton Réserver',
}

interface Props {
  order: string[]
  onChange: (newOrder: string[]) => void
  accentColor: string
}

export default function SectionReorder({ order, onChange, accentColor }: Props) {
  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...order]
    ;[next[i - 1], next[i]] = [next[i] as string, next[i - 1] as string]
    onChange(next)
  }

  const moveDown = (i: number) => {
    if (i === order.length - 1) return
    const next = [...order]
    ;[next[i], next[i + 1]] = [next[i + 1] as string, next[i] as string]
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {order.map((section, i) => (
        <motion.div
          key={section}
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Drag handle (visual only) */}
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
            {[0, 4, 8].map(y => (
              <React.Fragment key={y}>
                <circle cx="2" cy={2 + y} r="1.2" fill="rgba(255,255,255,0.8)" />
                <circle cx="8" cy={2 + y} r="1.2" fill="rgba(255,255,255,0.8)" />
              </React.Fragment>
            ))}
          </svg>

          <span style={{ flex: 1, fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans,sans-serif' }}>
            {SECTION_LABELS[section] ?? section}
          </span>

          <div style={{ display: 'flex', gap: 3 }}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => moveUp(i)}
              disabled={i === 0}
              style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid rgba(255,255,255,0.12)`, background: i === 0 ? 'transparent' : `${accentColor}18`, color: i === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', fontSize: '0.7rem' }}
            >
              ↑
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => moveDown(i)}
              disabled={i === order.length - 1}
              style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid rgba(255,255,255,0.12)`, background: i === order.length - 1 ? 'transparent' : `${accentColor}18`, color: i === order.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', cursor: i === order.length - 1 ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', fontSize: '0.7rem' }}
            >
              ↓
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
