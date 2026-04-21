'use client'

import React from 'react'
import Link from 'next/link'
import type { Plan } from '@/lib/hooks/usePlan'

const PLAN_RANK: Record<Plan, number> = { free: 0, premium: 1, infinity: 2 }

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Starter',
  premium: 'Premium',
  infinity: 'Infinity+',
}

const PLAN_PRICES: Record<Plan, string> = {
  free: '0',
  premium: '19',
  infinity: '49',
}

interface Props {
  required: Plan
  current: Plan | null
  children: React.ReactNode
  inline?: boolean
}

export default function FeatureGate({ required, current, children, inline }: Props) {
  const currentRank = current !== null ? PLAN_RANK[current] : -1
  const requiredRank = PLAN_RANK[required]

  // Plan still loading — render children optimistically to avoid flash
  if (current === null) return <>{children}</>

  if (currentRank >= requiredRank) return <>{children}</>

  if (inline) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 100,
          background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)',
          border: '1px solid #e9d5ff',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#7c3aed',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'default',
        }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        {PLAN_LABELS[required]}+
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1.5px dashed #e9d5ff',
        background: 'linear-gradient(135deg, #fdfbff 0%, #fef9ff 100%)',
      }}
    >
      <div style={{ filter: 'blur(2px)', pointerEvents: 'none', opacity: 0.35 }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <p style={{ fontSize: '0.87rem', fontWeight: 700, color: '#0f172a', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
            Fonctionnalite {PLAN_LABELS[required]}+
          </p>
          <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
            A partir de {PLAN_PRICES[required]}€/mois
          </p>
        </div>
        <Link
          href="/dashboard/pricing"
          style={{
            display: 'inline-block',
            padding: '8px 18px',
            borderRadius: 9,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          Passer au plan {PLAN_LABELS[required]}
        </Link>
      </div>
    </div>
  )
}
