'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WalletCard } from '@/components/WalletCard'
import {
  ArrowDownLeft, ArrowUpRight, RefreshCcw, RotateCcw,
  CalendarDays, ShieldCheck, Clock, ArrowRight,
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'booking_payment' | 'refund' | 'cancellation_refund' | 'manual_credit'
  amount: number
  description: string
  created_at: string
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  metadata?: {
    cancelled_by?: string
    reason?: string
  }
}

interface WalletData {
  wallet: {
    balance: number
    currency: string
    user_id: string
  }
  transactions: Transaction[]
}

const TRANSACTION_CONFIG = {
  booking_payment:     { label: 'Paiement RDV',   color: '#BE123C', icon: <ArrowUpRight  size={14} strokeWidth={2} />, bg: '#FFF1F2',  border: '#FECDD3' },
  refund:              { label: 'Remboursement',   color: '#15803D', icon: <ArrowDownLeft size={14} strokeWidth={2} />, bg: '#F0FDF4',  border: '#BBF7D0' },
  cancellation_refund: { label: 'Annulation',      color: '#1D4ED8', icon: <RotateCcw    size={14} strokeWidth={2} />, bg: '#EFF6FF',  border: '#BFDBFE' },
  manual_credit:       { label: 'Crédit',          color: '#7C3AED', icon: <RefreshCcw   size={14} strokeWidth={2} />, bg: '#F5F3FF',  border: '#DDD6FE' },
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/wallet')
      .then(r => r.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Impossible de charger votre porte-monnaie')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' as const, color: 'var(--cl-text-muted)', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>Chargement…</div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem', textAlign: 'center' as const }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--cl-accent-soft)', border: '1.5px solid var(--cl-accent-20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={22} strokeWidth={1.5} style={{ color: 'var(--cl-accent)' }} />
        </div>
        <p style={{ color: 'var(--cl-text-muted)', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '0.5rem 1rem', background: 'var(--cl-accent)', border: 'none', borderRadius: 10, color: 'var(--cl-text-inverse)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  const balance = data?.wallet?.balance || 0
  const transactions = data?.transactions || []

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--cl-accent)', marginBottom: '0.3rem', fontFamily: "'DM Sans', sans-serif" }}>Finance</div>
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', fontWeight: 700, color: 'var(--cl-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Mon porte-monnaie</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--cl-text-muted)', marginTop: '0.4rem', fontFamily: "'DM Sans', sans-serif" }}>Consultez votre solde et l'historique de vos transactions.</p>
      </div>

      {/* Wallet Card */}
      <div className="max-w-md mx-auto mb-12">
        <WalletCard
          balance={balance}
          onUseForNextBooking={() => {
            window.location.href = '/client/marketplace'
          }}
        />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {[
          {
            icon: <ArrowDownLeft size={16} strokeWidth={1.5} />,
            iconBg: '#F0FDF4', iconBorder: '#BBF7D0', iconColor: '#15803D',
            label: 'Remboursements',
            value: `${transactions.filter(t => t.type === 'refund' || t.type === 'cancellation_refund').reduce((a, t) => a + t.amount, 0).toFixed(2)}€`,
            valueColor: '#15803D',
          },
          {
            icon: <ShieldCheck size={16} strokeWidth={1.5} />,
            iconBg: '#F5F3FF', iconBorder: '#DDD6FE', iconColor: '#7C3AED',
            label: 'Sécurisé',
            value: 'CalendaPay',
            valueColor: '#7C3AED',
          },
          {
            icon: <Clock size={16} strokeWidth={1.5} />,
            iconBg: '#FFFBEB', iconBorder: '#FDE68A', iconColor: '#D97706',
            label: 'Disponible',
            value: 'Instantanément',
            valueColor: '#D97706',
          },
        ].map(({ icon, iconBg, iconBorder, iconColor, label, value, valueColor }) => (
          <div key={label} style={{ padding: '1rem', background: 'var(--cl-surface)', border: '1.5px solid var(--cl-border)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: 'var(--cl-shadow-soft)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--cl-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: valueColor, fontFamily: "'Clash Display', sans-serif" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div style={{ background: 'var(--cl-surface)', border: '1.5px solid var(--cl-border)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--cl-shadow-soft)' }}>
        <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--cl-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: 'var(--cl-text-primary)' }}>Historique des transactions</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--cl-text-muted)', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' as const, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--cl-accent-soft)', border: '1.5px solid var(--cl-accent-20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={22} strokeWidth={1.5} style={{ color: 'var(--cl-accent)' }} />
            </div>
            <p style={{ color: 'var(--cl-text-muted)', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>Aucune transaction pour l’instant.</p>
          </div>
        ) : (
          <div>
            {transactions.map((t, i) => {
              const conf = TRANSACTION_CONFIG[t.type as keyof typeof TRANSACTION_CONFIG] ?? { label: t.type, color: 'var(--cl-text-muted)', icon: <RefreshCcw size={14} />, bg: 'var(--cl-bg)', border: 'var(--cl-border)' }
              const isDebit = t.type === 'booking_payment'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.2rem', borderBottom: i < transactions.length - 1 ? '1px solid var(--cl-border)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: conf.bg, border: `1px solid ${conf.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: conf.color, flexShrink: 0 }}>
                    {conf.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--cl-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{t.description || conf.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--cl-text-muted)', marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: isDebit ? '#BE123C' : '#15803D' }}>
                      {isDebit ? '-' : '+'}{Math.abs(t.amount).toFixed(2)}€
                    </p>
                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: 100, background: conf.bg, border: `1px solid ${conf.border}`, color: conf.color, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{conf.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Back to bookings */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' as const }}>
        <Link href="/client/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--cl-accent)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
          <ArrowRight size={13} strokeWidth={2} style={{ transform: 'rotate(180deg)' }} />
          Retour à mes rendez-vous
        </Link>
      </div>
    </div>
  )
}
