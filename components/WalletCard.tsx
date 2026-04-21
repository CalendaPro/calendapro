'use client'

import { Wallet, ArrowRight, Coins } from 'lucide-react'

interface WalletCardProps {
  balance: number
  currency?: string
  onUseForNextBooking?: () => void
  className?: string
}

export function WalletCard({
  balance,
  currency = '€',
  onUseForNextBooking,
  className = '',
}: WalletCardProps) {
  const formattedBalance = balance.toFixed(2)
  const hasBalance = balance > 0

  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 40%, #065f46 100%)',
        boxShadow: '0 24px 56px rgba(5,150,105,0.35), 0 4px 16px rgba(5,150,105,0.2)',
        transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
        e.currentTarget.style.boxShadow = '0 32px 72px rgba(5,150,105,0.45), 0 8px 24px rgba(5,150,105,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = '0 24px 56px rgba(5,150,105,0.35), 0 4px 16px rgba(5,150,105,0.2)'
      }}
    >
      {/* Continuous shimmer sweep — transform-based to match shimmer-sweep keyframe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '40%',
            height: '100%',
            background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer-sweep 2.8s ease-in-out infinite',
          }}
        />
      </div>

      {/* Subtle light reflection top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 40%)',
        }}
      />

      {/* Decorative circle */}
      <div
        className="absolute -top-12 -right-12 pointer-events-none"
        style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      />
      <div
        className="absolute -bottom-8 -left-8 pointer-events-none"
        style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}
      />

      {/* Content */}
      <div style={{ position: 'relative', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={22} strokeWidth={1.5} style={{ color: 'white' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Sans', sans-serif" }}>
                Porte-monnaie
              </p>
              <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                CalendaPay
              </p>
            </div>
          </div>
          <span style={{
            padding: '0.2rem 0.7rem',
            borderRadius: 100,
            fontSize: '0.68rem',
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            background: hasBalance ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
            color: hasBalance ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            {hasBalance ? '● Actif' : '○ Vide'}
          </span>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.35rem', fontFamily: "'DM Sans', sans-serif" }}>
            Solde disponible
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '3.2rem', fontWeight: 700, color: 'white', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 2px 24px rgba(0,0,0,0.2)' }}>
              {formattedBalance}
            </span>
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {currency}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: hasBalance && onUseForNextBooking ? '1.5rem' : 0 }}>
          <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 100, width: hasBalance ? `${Math.min((balance / 100) * 100, 100)}%` : '0%', background: 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))', transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)', boxShadow: '0 0 8px rgba(255,255,255,0.4)' }} />
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontFamily: "'DM Sans', sans-serif" }}>
            {hasBalance ? 'Utilisable pour votre prochaine réservation' : 'Aucun fonds disponible'}
          </p>
        </div>

        {/* CTA */}
        {hasBalance && onUseForNextBooking && (
          <button
            onClick={onUseForNextBooking}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.18)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.26)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
          >
            <Coins size={16} strokeWidth={1.5} />
            Utiliser pour ma prochaine réservation
            <ArrowRight size={14} strokeWidth={2} style={{ marginLeft: 'auto' }} />
          </button>
        )}
      </div>
    </div>
  )
}

export function WalletBadge({
  balance,
  currency = '€',
  onClick,
}: {
  balance: number
  currency?: string
  onClick?: () => void
}) {
  const hasBalance = balance > 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.4rem 0.75rem', borderRadius: 10,
        background: hasBalance ? 'linear-gradient(135deg, #059669, #047857)' : 'var(--cl-surface)',
        border: hasBalance ? 'none' : '1.5px solid var(--cl-border)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <Wallet size={14} strokeWidth={1.5} style={{ color: hasBalance ? 'rgba(255,255,255,0.85)' : 'var(--cl-text-muted)' }} />
      <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.82rem', color: hasBalance ? 'white' : 'var(--cl-text-primary)' }}>
        {balance.toFixed(2)} {currency}
      </span>
    </button>
  )
}
