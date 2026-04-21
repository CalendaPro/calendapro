'use client'

import React from 'react'
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

const BADGE_VARIANTS: Record<BadgeVariant, { background: string; color: string }> = {
  success: { background: 'rgba(16,185,129,0.15)',  color: '#059669' },
  warning: { background: 'rgba(245,158,11,0.15)',  color: '#d97706' },
  error:   { background: 'rgba(239,68,68,0.15)',   color: '#dc2626' },
  info:    { background: 'rgba(59,130,246,0.15)',  color: '#2563eb' },
  default: { background: 'rgba(100,116,139,0.15)', color: '#475569' },
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Badge({ variant = 'default', children, style }: BadgeProps) {
  const v = BADGE_VARIANTS[variant]

  const badgeStyles: React.CSSProperties = {
    borderRadius: '100px',
    padding: '2px 10px',
    fontSize: '0.75rem',
    fontWeight: 500,
    background: v.background,
    color: v.color,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    ...style,
  }

  return <span style={badgeStyles}>{children}</span>
}
