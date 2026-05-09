'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowDownLeft, ArrowUpRight, RefreshCcw, RotateCcw,
  CalendarDays, ShieldCheck, Clock, ArrowRight, Receipt,
  CreditCard, ExternalLink, Wallet,
} from 'lucide-react'

interface Transaction {
  id: string
  booking_id: string | null
  pro_id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded'
  description: string
  receipt_url: string | null
  stripe_payment_intent_id: string | null
  refunded_amount: number
  created_at: string
}

const TRANSACTION_CONFIG = {
  succeeded:          { label: 'Paiement',        color: '#BE123C', icon: <ArrowUpRight  size={14} strokeWidth={2} />, bg: '#FFF1F2',  border: '#FECDD3' },
  refunded:           { label: 'Remboursé',       color: '#15803D', icon: <ArrowDownLeft size={14} strokeWidth={2} />, bg: '#F0FDF4',  border: '#BBF7D0' },
  partially_refunded: { label: 'Partiellement remboursé', color: '#1D4ED8', icon: <RotateCcw    size={14} strokeWidth={2} />, bg: '#EFF6FF',  border: '#BFDBFE' },
  failed:             { label: 'Échoué',          color: '#6B7280', icon: <RefreshCcw   size={14} strokeWidth={2} />, bg: '#F3F4F6',  border: '#E5E7EB' },
  pending:            { label: 'En cours',        color: '#D97706', icon: <Clock   size={14} strokeWidth={2} />, bg: '#FFFBEB',  border: '#FDE68A' },
}

interface WalletData {
  transactions: Transaction[]
  totalCount: number
  totalSpent: number
  totalRefunded: number
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/client/transactions')
      .then(r => r.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Impossible de charger vos transactions')
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

  const totalSpent = data?.totalSpent || 0
  const totalRefunded = data?.totalRefunded || 0
  const transactions = data?.transactions || []

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--cl-accent)', marginBottom: '0.3rem', fontFamily: "'DM Sans', sans-serif" }}>Finance</div>
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', fontWeight: 700, color: 'var(--cl-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Mon porte-monnaie</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--cl-text-muted)', marginTop: '0.4rem', fontFamily: "'DM Sans', sans-serif" }}>Consultez votre solde et l'historique de vos transactions.</p>
      </div>

      {/* Summary Card */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5, #6366f1)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.75rem', boxShadow: '0 8px 32px rgba(79,70,229,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
            <Wallet size={24} strokeWidth={1.5} style={{ color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}>Total dépensé sur CalendaPro</p>
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: 'white' }}>
              {(totalSpent / 100).toFixed(2)}€
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.12)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif" }}>Transactions</p>
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'white' }}>{data?.totalCount || 0}</p>
          </div>
          <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.12)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif" }}>Remboursé</p>
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#86efac' }}>
              +{(totalRefunded / 100).toFixed(2)}€
            </p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {[
          {
            icon: <CreditCard size={16} strokeWidth={1.5} />,
            iconBg: '#FFF1F2', iconBorder: '#FECDD3', iconColor: '#BE123C',
            label: 'Paiements Stripe',
            value: 'Sécurisés',
            valueColor: '#BE123C',
          },
          {
            icon: <ShieldCheck size={16} strokeWidth={1.5} />,
            iconBg: '#F5F3FF', iconBorder: '#DDD6FE', iconColor: '#7C3AED',
            label: 'Protection',
            value: 'PCI DSS',
            valueColor: '#7C3AED',
          },
          {
            icon: <Receipt size={16} strokeWidth={1.5} />,
            iconBg: '#F0FDF4', iconBorder: '#BBF7D0', iconColor: '#15803D',
            label: 'Reçus',
            value: 'Téléchargeables',
            valueColor: '#15803D',
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
              const conf = TRANSACTION_CONFIG[t.status] ?? { label: t.status, color: 'var(--cl-text-muted)', icon: <RefreshCcw size={14} />, bg: 'var(--cl-bg)', border: 'var(--cl-border)' }
              const isDebit = t.status === 'succeeded' || t.status === 'partially_refunded'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.2rem', borderBottom: i < transactions.length - 1 ? '1px solid var(--cl-border)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: conf.bg, border: `1px solid ${conf.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: conf.color, flexShrink: 0 }}>
                    {conf.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--cl-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{t.description || conf.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--cl-text-muted)', marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>
                      {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {t.stripe_payment_intent_id && (
                        <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                          • {t.stripe_payment_intent_id.slice(-8)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: isDebit ? '#BE123C' : '#15803D' }}>
                      {isDebit ? '-' : '+'}{Math.abs(t.amount / 100).toFixed(2)}€
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: 100, background: conf.bg, border: `1px solid ${conf.border}`, color: conf.color, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{conf.label}</span>
                      {t.receipt_url && (
                        <a
                          href={t.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 100, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Receipt size={10} strokeWidth={2} />
                          Reçu
                        </a>
                      )}
                    </div>
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
