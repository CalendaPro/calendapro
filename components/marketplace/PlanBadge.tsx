import type { CSSProperties } from 'react'

export type MarketplacePlan = 'starter' | 'premium' | 'infinity'

const base: CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '0.25rem 0.65rem',
  borderRadius: '100px',
  fontFamily: "'DM Sans', sans-serif",
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
}

export function PlanBadge({
  plan,
  variant = 'default',
}: {
  plan: MarketplacePlan
  variant?: 'default' | 'compact'
}) {
  const small = variant === 'compact'
  const fs = small ? '0.6rem' : base.fontSize
  const pad = small ? '0.18rem 0.5rem' : base.padding

  if (plan === 'infinity') {
    return (
      <span
        style={{
          ...base,
          fontSize: fs,
          padding: pad,
          background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
          color: 'white',
          boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
        }}
      >
        Infinity
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
          background: 'rgba(124, 58, 237, 0.08)',
          color: '#7c3aed',
          border: '1px solid rgba(124, 58, 237, 0.15)',
        }}
      >
        Premium
      </span>
    )
  }
  return null
}
