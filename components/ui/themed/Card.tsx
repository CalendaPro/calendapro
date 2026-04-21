'use client'

import React from 'react'
const CARD_HOVER_CSS = `
  .themed-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
`

interface CardProps {
  children: React.ReactNode
  title?: string
  headerAction?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export function Card({ children, title, headerAction, style, className }: CardProps) {
  const cardStyles: React.CSSProperties = {
    borderRadius: '16px',
    background: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '24px',
    border: 'none',
    transition: 'all 0.2s ease',
  }

  return (
    <>
      <style>{CARD_HOVER_CSS}</style>
      <div className={`themed-card ${className || ''}`} style={{ ...cardStyles, ...style }}>
        {(title || headerAction) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: title ? '16px' : '0' }}>
            {title && (
              <h3 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                {title}
              </h3>
            )}
            {headerAction}
          </div>
        )}
        {children}
      </div>
    </>
  )
}
