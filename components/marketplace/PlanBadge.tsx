import type { CSSProperties } from 'react'

export type MarketplacePlan = 'starter' | 'premium' | 'infinity'

const base: CSSProperties = {
  fontSize: '0.58rem',
  fontWeight: 800,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  padding: '0.2rem 0.55rem',
  borderRadius: '100px',
  fontFamily: "'Outfit', sans-serif",
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
}

export function PlanBadge({
  plan,
  variant = 'default',
}: {
  plan: MarketplacePlan
  variant?: 'default' | 'compact'
}) {
  const small = variant === 'compact'
  const fs = small ? '0.52rem' : base.fontSize
  const pad = small ? '0.14rem 0.4rem' : base.padding

  if (plan === 'infinity') {
    return (
      <span
        style={{
          ...base,
          fontSize: fs,
          padding: pad,
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
        }}
      >
        + INFINITY
      </span>
    )
  }
  if (plan === 'premium') {
    return (
      <span
        style={{
          ...base,
          fontSize: fs,
          padding: pad,
          fontWeight: 700,
          letterSpacing: '0.06em',
          background: 'rgba(124,58,237,0.08)',
          color: '#7c3aed',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        Premium
      </span>
    )
  }
  return null
}
