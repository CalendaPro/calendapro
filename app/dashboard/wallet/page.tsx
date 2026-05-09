'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { PaymentStatusBadge } from '@/components/ui/PaymentStatusBadge'
import { logger } from '@/lib/logger'

const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectStatus {
  connected: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  onboarding_complete: boolean
  stripe_connect_id?: string
}

interface Balance {
  available: number
  pending: number
  currency: string
  connect_configured: boolean
}

interface Transaction {
  id: string
  stripe_payment_id: string
  amount: number
  platform_fee: number
  net_amount: number
  status: string
  client_name: string | null
  client_email: string | null
  payment_type: string
  created_at: string
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function fmtEur(cents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'year'

function statusLabel(s: string) {
  return s === 'succeeded' ? 'Delivre' : s === 'pending' ? 'En attente' : s === 'refunded' ? 'Rembourse' : s
}

function statusColor(s: string) {
  if (s === 'succeeded') return { bg: '#dcfce7', color: '#166534' }
  if (s === 'pending') return { bg: '#ffedd5', color: '#9a3412' }
  if (s === 'refunded') return { bg: '#fee2e2', color: '#991b1b' }
  return { bg: '#f3f4f6', color: '#374151' }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'infinity'>('free')
  const [chartPeriod, setChartPeriod] = useState<Period>('month')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [sRes, bRes, tRes, planRes] = await Promise.all([
      fetch('/api/stripe/connect/status').then(r => r.json()).catch(() => null),
      fetch('/api/stripe/connect/balance').then(r => r.json()).catch(() => null),
      fetch(`/api/stripe/connect/transactions?page=${txPage}&limit=20`).then(r => r.json()).catch(() => null),
      fetch('/api/profile').then(r => r.json()).catch(() => null),
    ])
    if (sRes) setStatus(sRes)
    if (bRes) setBalance(bRes)
    if (tRes) {
      setTransactions(tRes.transactions || [])
      setTxTotal(tRes.total || 0)
    }
    if (planRes?.plan) setUserPlan(planRes.plan as 'free' | 'premium' | 'infinity')
    setLoading(false)
  }, [txPage])

  useEffect(() => { void loadData() }, [loadData])

  const startOnboarding = async () => {
    setOnboardingLoading(true)
    try {
      const res = await fetch('/api/stripe/connect/onboarding', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      logger.error('Erreur onboarding')
    }
    setOnboardingLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(txTotal / 10))

  // ─── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(async () => {
    try {
      // Fetch all transactions (not just current page)
      const res = await fetch('/api/stripe/connect/transactions?limit=1000')
      const data = await res.json()
      const allTx = data.transactions || []

      const headers = ['Date', 'Client', 'Email', 'Montant', 'Commission', 'Net', 'Statut', 'ID Stripe']
      const rows = allTx.map((tx: Transaction) => [
        new Date(tx.created_at).toLocaleDateString('fr-FR'),
        tx.client_name || '',
        tx.client_email || '',
        (tx.amount / 100).toFixed(2),
        (tx.platform_fee / 100).toFixed(2),
        (tx.net_amount / 100).toFixed(2),
        tx.status,
        tx.stripe_payment_id || '',
      ])

      const csv = [headers.join(','), ...rows.map((r: (string | number)[]) => r.map(x => `"${x}"`).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `calendapro-transactions-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      logger.error('Erreur export CSV:', err)
      alert('Erreur lors de l\'export CSV')
    }
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px 32px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 140, borderRadius: 20, background: 'var(--dl-card-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  const isConfigured = status?.onboarding_complete

  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&f[]=cabinet-grotesk@400,500,700,800&display=swap');

        .wallet-page {
          padding: 28px 32px;
          font-family: 'DM Sans', sans-serif;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Ultra-glassmorphism cards */
        .wallet-glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.45) 100%);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 24px;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.02),
            0 10px 15px -3px rgba(0,0,0,0.04),
            0 25px 50px -12px rgba(124,58,237,0.1),
            inset 0 1px 0 rgba(255,255,255,0.6);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .wallet-glass:hover {
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.02),
            0 10px 15px -3px rgba(0,0,0,0.04),
            0 30px 60px -12px rgba(124,58,237,0.15),
            inset 0 1px 0 rgba(255,255,255,0.6);
        }

        /* Premium balance card with gradient depth */
        .wallet-balance-card {
          background:
            linear-gradient(135deg, rgba(124,58,237,0.03) 0%, rgba(236,72,153,0.02) 50%, rgba(99,102,241,0.02) 100%),
            linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid rgba(124,58,237,0.15);
          border-radius: 28px;
          padding: 32px 36px;
          box-shadow:
            0 2px 4px -1px rgba(0,0,0,0.02),
            0 8px 16px -4px rgba(124,58,237,0.08),
            0 24px 48px -12px rgba(124,58,237,0.12);
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .wallet-balance-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 2px 4px -1px rgba(0,0,0,0.02),
            0 12px 24px -6px rgba(124,58,237,0.1),
            0 32px 64px -16px rgba(124,58,237,0.16);
        }

        /* Animated gradient orbs */
        .wallet-balance-card::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 60%);
          animation: float 8s ease-in-out infinite;
        }

        .wallet-balance-card::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -80px;
          width: 250px; height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 60%);
          animation: float 10s ease-in-out infinite reverse;
        }

        /* Shimmer animation for pending amounts */
        @keyframes shimmer {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        /* Floating animation for orbs */
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Pulse glow for active elements */
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.2); }
          50% { box-shadow: 0 0 40px rgba(124,58,237,0.4); }
        }

        /* Infinity glow animation */
        @keyframes infinity-glow {
          0%, 100% {
            background-position: 0% 50%;
            box-shadow: 0 0 20px rgba(124,58,237,0.3);
          }
          50% {
            background-position: 100% 50%;
            box-shadow: 0 0 40px rgba(236,72,153,0.4);
          }
        }

        /* Card entrance animation */
        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-enter {
          animation: card-enter 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Stagger delays for children */
        .animate-enter:nth-child(1) { animation-delay: 0ms; }
        .animate-enter:nth-child(2) { animation-delay: 100ms; }
        .animate-enter:nth-child(3) { animation-delay: 200ms; }
        .animate-enter:nth-child(4) { animation-delay: 300ms; }
      `}</style>

      <div className="wallet-page">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Cabinet Grotesk', 'Clash Display', sans-serif", letterSpacing: '-0.02em' }}>
            Portefeuille
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--dl-text-muted)', margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            Gerez vos encaissements et suivez vos revenus en temps reel
          </p>
        </div>

        {/* Setup banner if not configured — Ultra-premium 20M style */}
        {!isConfigured && (
          <div className="animate-enter" style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '24px 28px', marginBottom: 32, borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(254,243,199,0.9) 0%, rgba(253,230,138,0.8) 50%, rgba(251,191,36,0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(251,191,36,0.3)',
            boxShadow: '0 8px 32px rgba(251,191,36,0.15), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated background glow */}
            <div style={{
              position: 'absolute', top: '-50%', right: '-20%',
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(217,119,6,0.2), rgba(251,191,36,0.3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(217,119,6,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', margin: 0, fontFamily: "'Cabinet Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
                Configurez vos paiements pour commencer à encaisser
              </p>
              <p style={{ fontSize: '0.75rem', color: '#a16207', margin: '4px 0 0', lineHeight: 1.5 }}>
                Connectez votre compte Stripe pour recevoir les paiements clients directement sur votre compte bancaire.
              </p>
            </div>
            <button
              type="button"
              onClick={startOnboarding}
              disabled={onboardingLoading}
              style={{
                padding: '12px 24px', borderRadius: 14, fontSize: '0.85rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%)',
                backgroundSize: '200% 200%',
                color: 'white',
                border: 'none',
                cursor: onboardingLoading ? 'not-allowed' : 'pointer',
                opacity: onboardingLoading ? 0.6 : 1,
                fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
                animation: onboardingLoading ? 'none' : 'infinity-glow 3s ease-in-out infinite',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {onboardingLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Redirection...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Configurer Stripe
                </span>
              )}
            </button>
          </div>
        )}

        {/* Balance Cards */}
        <div className="wallet-balance-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, position: 'relative' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: 'var(--dl-text-primary)' }}>
              Solde Stripe Connect
            </span>
            {isConfigured && (
              <span style={{
                marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700,
                padding: '4px 10px', borderRadius: 100,
                background: 'rgba(16,185,129,0.1)', color: '#059669',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Connecte
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, position: 'relative' }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>
                Solde disponible
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Satoshi', 'Clash Display', sans-serif", letterSpacing: '-0.03em', lineHeight: 1 }}>
                {fmtEur(balance?.available || 0)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif" }}>
                Virements en attente
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: 0, fontFamily: "'Satoshi', 'Clash Display', sans-serif", letterSpacing: '-0.03em', lineHeight: 1, animation: balance?.pending ? 'shimmer 2s infinite' : 'none' }}>
                {fmtEur(balance?.pending || 0)}
              </p>
            </div>
          </div>

          {/* Platform commission note */}
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.1)', position: 'relative' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--dl-text-muted)', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Commission CalendaPro : <strong style={{ color: '#7c3aed' }}>{userPlan === 'free' ? '5%' : '0%'}</strong>
              {userPlan === 'free' ? ' (plan Starter) prelevee sur chaque transaction.' : ' (plan ' + (userPlan === 'premium' ? 'Premium' : 'Infinity') + ') — aucune commission.'}
              {' '}Le reste est verse directement sur votre compte.
            </p>
          </div>
        </div>

        {/* Revenue Chart */}
        {transactions.length > 0 && (
          <RevenueChart
            transactions={transactions}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        )}

        {/* Revenue Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {(() => {
            const totalRevenue = transactions.reduce((sum, t) => sum + (t.status === 'succeeded' ? t.amount : 0), 0)
            const totalCommission = transactions.reduce((sum, t) => sum + (t.status === 'succeeded' ? t.platform_fee : 0), 0)
            const totalNet = transactions.reduce((sum, t) => sum + (t.status === 'succeeded' ? t.net_amount : 0), 0)
            const thisMonth = transactions
              .filter(t => new Date(t.created_at).getMonth() === new Date().getMonth())
              .reduce((sum, t) => sum + (t.status === 'succeeded' ? t.net_amount : 0), 0)

            return [
 { label: 'Revenus totaux', value: fmtEur(totalRevenue), color: '#7c3aed', icon: '' },
 { label: 'Net reçu', value: fmtEur(totalNet), color: '#059669', icon: '' },
 { label: 'Ce mois-ci', value: fmtEur(thisMonth), color: '#2563eb', icon: '' },
            ].map((stat, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: 14, background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--dl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Sans', sans-serif" }}>
                    {stat.label}
                  </span>
                </div>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: stat.color, margin: 0, fontFamily: "'Satoshi', 'Clash Display', sans-serif" }}>
                  {stat.value}
                </p>
              </div>
            ))
          })()}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Link
            href="/dashboard/payments-reservations"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderRadius: 14,
              background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>Paiements & Reservations</span>
          </Link>
          <Link
            href="/dashboard/settings?section=integrations"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderRadius: 14,
              background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>Parametres Stripe</span>
          </Link>
        </div>

        {/* Transactions */}
        <div className="wallet-glass" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(124,58,237,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Cabinet Grotesk', 'Clash Display', sans-serif", letterSpacing: '-0.01em' }}>
              Dernieres transactions
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--dl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
              {txTotal} transaction{txTotal !== 1 ? 's' : ''}
            </span>
            <button
              onClick={exportCSV}
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                fontSize: '0.72rem', fontWeight: 600, color: '#7c3aed',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter CSV
            </button>
          </div>
          </div>

          {transactions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
                background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--dl-text-muted)', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                Aucune transaction pour le moment
              </p>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ background: 'rgba(124,58,237,0.03)' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commission</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net recu</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                      <tr key={tx.id} style={{ borderTop: '1px solid var(--dl-card-border)' }}>
                        <td style={{ padding: '12px 20px', color: 'var(--dl-text-primary)', fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 500 }}>
                          {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--dl-text-primary)' }}>
                          {tx.client_name || tx.client_email || 'Client'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'Satoshi', sans-serif", fontWeight: 600, color: 'var(--dl-text-primary)' }}>
                          {fmtEur(tx.amount)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'Satoshi', sans-serif", fontWeight: 500, color: '#ef4444', fontSize: '0.75rem' }}>
                          -{fmtEur(tx.platform_fee)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'Satoshi', sans-serif", fontWeight: 700, color: '#059669' }}>
                          {fmtEur(tx.net_amount)}
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                          <PaymentStatusBadge
                            status={tx.status === 'succeeded' ? 'paid' : tx.status === 'refunded' ? 'refunded' : tx.status === 'pending' ? 'pending' : 'failed'}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--dl-card-border)' }}>
                  <button
                    type="button"
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)',
                      cursor: txPage === 1 ? 'not-allowed' : 'pointer', opacity: txPage === 1 ? 0.5 : 1,
                      color: 'var(--dl-text-primary)',
                    }}
                  >
                    Precedent
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'var(--dl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    {txPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                    disabled={txPage === totalPages}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)',
                      cursor: txPage === totalPages ? 'not-allowed' : 'pointer', opacity: txPage === totalPages ? 0.5 : 1,
                      color: 'var(--dl-text-primary)',
                    }}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
