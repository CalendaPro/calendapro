'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import {
  normalizeBookingPaymentSettings,
  sanitizePaymentSettingsFromForm,
  type BookingPaymentSettings,
  type DepositType,
  type CancellationDelay,
  type CancellationDelayUnit,
  type CustomCancellationDelay,
  DEFAULT_DEPOSIT_PERCENT,
} from '@/lib/booking-payment-settings'
import { usePlan } from '@/lib/hooks/usePlan'
import FeatureGate from '@/components/dashboard/FeatureGate'

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative', width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: checked ? '#7c3aed' : 'var(--dl-card-border)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'background 0.2s',
      }}
    >
      <span style={{ position: 'absolute', top: 4, left: checked ? 22 : 4, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function ToggleRow({ label, desc, checked, onChange, disabled, premiumLocked }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; premiumLocked?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--dl-card-border)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: '0.83rem', fontWeight: 600, color: premiumLocked ? 'var(--dl-text-muted)' : 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{label}</p>
          {premiumLocked && (
            <Link href="/dashboard/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 100,
              background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)',
              border: '1px solid #e9d5ff',
              fontSize: '0.6rem', fontWeight: 700,
              color: '#7c3aed', letterSpacing: '0.03em',
              textTransform: 'uppercase', textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              PREMIUM
            </Link>
          )}
        </div>
        {desc && <p style={{ fontSize: '0.7rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled || premiumLocked} />
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--dl-card-border)', background: 'var(--dl-card-bg)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dl-card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#7c3aed', display: 'flex' }}>{icon}</span>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Clash Display', DM Sans, sans-serif", letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function SaveBanner({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 32, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 12,
      background: '#0f172a', color: 'white',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', fontWeight: 600,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
      Parametres sauvegardes
      <button type="button" onClick={onClose} style={{ marginLeft: 4, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>x</button>
    </div>
  )
}

// ─── Dropdown Component ───────────────────────────────────────────────────────

interface DropdownOption {
  value: string
  label: string
}

function Dropdown({ value, onChange, options, placeholder = 'Selectionner...' }: {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1.5px solid var(--dl-card-border)',
          background: 'var(--dl-card-bg)', color: 'var(--dl-text-primary)',
          fontSize: '0.83rem', fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left', outline: 'none',
        }}
      >
        <span>{selectedLabel}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--dl-text-muted)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)',
          borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50,
          maxHeight: 200, overflowY: 'auto',
        }}>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false) }}
              style={{
                width: '100%', padding: '10px 12px', textAlign: 'left',
                background: value === option.value ? 'rgba(124,58,237,0.08)' : 'transparent',
                color: value === option.value ? '#7c3aed' : 'var(--dl-text-primary)',
                fontSize: '0.83rem', fontFamily: 'DM Sans, sans-serif',
                border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--dl-card-border)',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Transaction History Component ────────────────────────────────────────────

type PaymentStatus = 'paid' | 'pending' | 'refunded'

interface Payment {
  id: string
  date: string
  client_name: string
  client_email: string
  amount: number
  type: 'deposit' | 'full'
  status: PaymentStatus
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
    paid: { bg: '#dcfce7', color: '#166534', label: 'Paye' },
    pending: { bg: '#ffedd5', color: '#9a3412', label: 'En attente' },
    refunded: { bg: '#fee2e2', color: '#991b1b', label: 'Rembourse' },
  }
  const c = config[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
      borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
      background: c.bg, color: c.color, fontFamily: 'DM Sans, sans-serif',
    }}>
      {c.label}
    </span>
  )
}

function TransactionHistoryCard() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')

  const pageSize = 10

  useEffect(() => {
    fetchPayments()
  }, [page, statusFilter])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await fetch(`/api/payments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setTotalPages(Math.ceil((data.total || 0) / pageSize))
      }
    } catch (e) { console.error('Failed to fetch payments', e) }
    setLoading(false)
  }

  const exportCSV = () => {
    const headers = ['Date', 'Client', 'Email', 'Montant', 'Type', 'Statut']
    const rows = payments.map(p => [
      new Date(p.date).toLocaleString('fr-FR'),
      p.client_name,
      p.client_email,
      (p.amount / 100).toFixed(2) + ' €',
      p.type === 'deposit' ? 'Acompte' : 'Paiement complet',
      p.status
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card title="Historique des transactions" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>}>
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: 200 }}>
            <Dropdown
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v as PaymentStatus | 'all'); setPage(1) }}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'paid', label: 'Paye' },
                { value: 'pending', label: 'En attente' },
                { value: 'refunded', label: 'Rembourse' },
              ]}
            />
          </div>
          <button
            onClick={exportCSV}
            disabled={payments.length === 0}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
              background: 'var(--dl-card-bg)', color: '#7c3aed', border: '1.5px solid #7c3aed',
              cursor: payments.length === 0 ? 'not-allowed' : 'pointer', opacity: payments.length === 0 ? 0.5 : 1,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Exporter CSV
          </button>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid var(--dl-card-border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
            <thead>
              <tr style={{ background: 'var(--dl-sidebar-bg)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montant</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--dl-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--dl-text-muted)' }}>Chargement...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--dl-text-muted)' }}>Aucune transaction</td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--dl-card-border)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--dl-text-primary)' }}>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--dl-text-primary)' }}>{p.client_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--dl-text-primary)', fontWeight: 600 }}>{(p.amount / 100).toFixed(2)} €</td>
                    <td style={{ padding: '12px 16px', color: 'var(--dl-text-muted)' }}>{p.type === 'deposit' ? 'Acompte' : 'Paiement complet'}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem',
                background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)',
                cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1,
                color: 'var(--dl-text-primary)',
              }}
            >
              Précédent
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--dl-text-muted)', fontFamily: 'DM Sans, sans-serif' }}>
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem',
                background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1,
                color: 'var(--dl-text-primary)',
              }}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsReservationsPage() {
  const { user } = useUser()
  const { plan, has } = usePlan()

  const [payment, setPayment] = useState<BookingPaymentSettings>({
    online_payment_enabled: false,
    deposit_required: false,
    deposit_type: 'percent',
    deposit_value: DEFAULT_DEPOSIT_PERCENT,
    allow_full_online_payment: false,
    allow_cancellations: true,
    cancellation_delay: '24h',
    cancellation_delay_custom: { value: 24, unit: 'hours' },
    keep_deposit_on_late_cancellation: false,
    allow_reschedule: false,
    // Receipt settings
    auto_send_receipt_to_client: true,
    auto_send_receipt_to_pro: false,
    receipt_custom_message: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [cancellationSaving, setCancellationSaving] = useState(false)
  const [receiptSaving, setReceiptSaving] = useState(false)

  // Load
  const loadAll = useCallback(async () => {
    const res = await fetch('/api/pro/site-settings').then(r => r.json()).catch(() => null)
    if (res?.profile) {
      const pay = normalizeBookingPaymentSettings(res.profile)
      setPayment(pay)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { void loadAll() }, [loadAll])

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  // Save payment settings
  const savePayment = async () => {
    setSaving(true); setSaveError(null)
    try {
      const safe = sanitizePaymentSettingsFromForm(payment)
      const res = await fetch('/api/pro/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          online_payment_enabled: safe.online_payment_enabled,
          deposit_required: safe.deposit_required,
          deposit_type: safe.deposit_type,
          deposit_value: safe.deposit_value,
          allow_full_online_payment: safe.allow_full_online_payment,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur')
      showSaved()
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Erreur')
    }
    setSaving(false)
  }

  // Save cancellation policy settings
  const saveCancellationPolicy = async () => {
    setCancellationSaving(true)
    try {
      const body: Record<string, unknown> = {
        allow_cancellations: payment.allow_cancellations,
        cancellation_delay: payment.cancellation_delay,
        keep_deposit_on_late_cancellation: payment.keep_deposit_on_late_cancellation,
        allow_reschedule: payment.allow_reschedule,
      }
      // Include custom delay if selected
      if (payment.cancellation_delay === 'custom' && payment.cancellation_delay_custom) {
        body.cancellation_delay_custom_value = payment.cancellation_delay_custom.value
        body.cancellation_delay_custom_unit = payment.cancellation_delay_custom.unit
      }
      const res = await fetch('/api/pro/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur')
      showSaved()
    } catch { /* silent */ }
    setCancellationSaving(false)
  }

  // Save receipt settings
  const saveReceiptSettings = async () => {
    setReceiptSaving(true)
    try {
      const res = await fetch('/api/pro/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_send_receipt_to_client: payment.auto_send_receipt_to_client,
          auto_send_receipt_to_pro: payment.auto_send_receipt_to_pro,
          receipt_custom_message: payment.receipt_custom_message,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur')
      showSaved()
    } catch { /* silent */ }
    setReceiptSaving(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 32px', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 160, borderRadius: 16, background: 'var(--dl-card-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'DM Sans, sans-serif', maxWidth: 900 }}>
      <SaveBanner show={saved} onClose={() => setSaved(false)} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Clash Display', DM Sans, sans-serif", letterSpacing: '-0.02em' }}>
          Paiements & Reservations
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--dl-text-muted)', margin: '4px 0 0' }}>
          Configurez vos methodes de paiement, acomptes et politique d'annulation
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Payment settings ── */}
        <Card title="Paiement en ligne" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}>
          <FeatureGate required="premium" current={plan}>
            <div>
              <ToggleRow
                label="Activer le paiement en ligne"
                desc="Vos clients pourront payer au moment de la reservation"
                checked={payment.online_payment_enabled}
                onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, online_payment_enabled: v }) }))}
              />

              {payment.online_payment_enabled && (
                <>
                  <ToggleRow
                    label="Exiger un acompte"
                    desc="Un acompte partiel est preleve a la reservation"
                    checked={payment.deposit_required && has('premium')}
                    onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, deposit_required: v }) }))}
                    premiumLocked={!has('premium')}
                  />
                  {payment.deposit_required && has('premium') && (
                    <div style={{ padding: '12px 0' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 10px', fontFamily: 'DM Sans, sans-serif' }}>
                        Montant de l'acompte
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(['percent', 'fixed'] as DepositType[]).map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, deposit_type: t }) }))}
                              disabled={!has('premium')}
                              style={{
                                padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                                border: `1.5px solid ${payment.deposit_type === t ? '#7c3aed' : 'var(--dl-card-border)'}`,
                                background: payment.deposit_type === t ? 'rgba(124,58,237,0.08)' : 'var(--dl-card-bg)',
                                color: payment.deposit_type === t ? '#7c3aed' : 'var(--dl-text-muted)',
                                cursor: !has('premium') ? 'not-allowed' : 'pointer',
                                opacity: !has('premium') ? 0.5 : 1,
                              }}
                            >
                              {t === 'percent' ? 'Pourcentage' : 'Montant fixe'}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min={payment.deposit_type === 'percent' ? 1 : 0.5}
                            max={payment.deposit_type === 'percent' ? 100 : 10000}
                            step={payment.deposit_type === 'percent' ? 1 : 0.5}
                            value={payment.deposit_value}
                            onChange={e => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, deposit_value: Number(e.target.value) }) }))}
                            disabled={!has('premium')}
                            style={{
                              width: 80, padding: '7px 10px', borderRadius: 8,
                              border: '1.5px solid var(--dl-card-border)',
                              background: 'var(--dl-card-bg)', color: 'var(--dl-text-primary)',
                              fontSize: '0.83rem', fontFamily: 'DM Sans, sans-serif', outline: 'none',
                              opacity: !has('premium') ? 0.5 : 1,
                            }}
                          />
                          <span style={{ fontSize: '0.82rem', color: 'var(--dl-text-muted)', fontFamily: 'DM Sans, sans-serif' }}>
                            {payment.deposit_type === 'percent' ? '%' : '€'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <ToggleRow
                    label="Autoriser le paiement integral"
                    desc="Le client peut payer l'integralite du montant a la reservation"
                    checked={payment.allow_full_online_payment && has('premium')}
                    onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, allow_full_online_payment: v }) }))}
                    premiumLocked={!has('premium')}
                  />
                </>
              )}

              {saveError && (
                <p style={{ fontSize: '0.72rem', color: '#ef4444', margin: '8px 0 0', fontFamily: 'DM Sans, sans-serif' }}>{saveError}</p>
              )}

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => void savePayment()}
                  disabled={saving}
                  style={{
                    padding: '9px 22px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white',
                    border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </FeatureGate>
        </Card>

        {/* ── Cancellation Policy ── */}
        <Card title="Politique d'annulation" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}>
          <div>
            <ToggleRow
              label="Autoriser les annulations"
              desc="Permettre aux clients d'annuler leur rendez-vous"
              checked={payment.allow_cancellations ?? true}
              onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, allow_cancellations: v }) }))}
            />

            {payment.allow_cancellations && (
              <>
                <div style={{ padding: '12px 0', borderBottom: '1px solid var(--dl-card-border)' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 10px', fontFamily: 'DM Sans, sans-serif' }}>
                    Delai gratuit d'annulation
                  </p>
                  <Dropdown
                    value={payment.cancellation_delay ?? '24h'}
                    onChange={(value) => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, cancellation_delay: value as CancellationDelay }) }))}
                    options={[
                      { value: '1h', label: '1 heure avant le RDV' },
                      { value: '6h', label: '6 heures avant le RDV' },
                      { value: '24h', label: '24 heures avant le RDV' },
                      { value: '48h', label: '48 heures avant le RDV' },
                      { value: '72h', label: '72 heures avant le RDV' },
                      { value: 'custom', label: 'Personnalise' },
                    ]}
                  />
                  {payment.cancellation_delay === 'custom' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={payment.cancellation_delay_custom?.value ?? 24}
                        onChange={e => setPayment(p => ({
                          ...normalizeBookingPaymentSettings({
                            ...p,
                            cancellation_delay_custom_value: Number(e.target.value) || 1,
                            cancellation_delay_custom_unit: p.cancellation_delay_custom?.unit || 'hours'
                          })
                        }))}
                        style={{
                          width: 70, padding: '8px 10px', borderRadius: 8,
                          border: '1.5px solid var(--dl-card-border)',
                          background: 'var(--dl-card-bg)', color: 'var(--dl-text-primary)',
                          fontSize: '0.83rem', fontFamily: 'DM Sans, sans-serif', outline: 'none',
                        }}
                      />
                      <Dropdown
                        value={payment.cancellation_delay_custom?.unit ?? 'hours'}
                        onChange={(value) => setPayment(p => ({
                          ...normalizeBookingPaymentSettings({
                            ...p,
                            cancellation_delay_custom_value: p.cancellation_delay_custom?.value || 24,
                            cancellation_delay_custom_unit: value as CancellationDelayUnit
                          })
                        }))}
                        options={[
                          { value: 'hours', label: 'heures' },
                          { value: 'days', label: 'jours' },
                        ]}
                      />
                    </div>
                  )}
                </div>

                <ToggleRow
                  label="Conserver l'acompte si annulation tardive"
                  desc="Si le client annule apres le delai, l'acompte ne sera pas rembourse"
                  checked={payment.keep_deposit_on_late_cancellation ?? false}
                  onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, keep_deposit_on_late_cancellation: v }) }))}
                />

                <ToggleRow
                  label="Permettre le report de RDV"
                  desc="Le client peut deplacer son RDV sans perdre son acompte"
                  checked={payment.allow_reschedule ?? false}
                  onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, allow_reschedule: v }) }))}
                />
              </>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => void saveCancellationPolicy()}
                disabled={cancellationSaving}
                style={{
                  padding: '9px 22px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white',
                  border: 'none', cursor: cancellationSaving ? 'not-allowed' : 'pointer', opacity: cancellationSaving ? 0.6 : 1,
                }}
              >
                {cancellationSaving ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </Card>

        {/* ── Automatic Receipts ── */}
        <Card title="Recus automatiques" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}>
          <div>
            <ToggleRow
              label="Envoyer un recu PDF au client apres chaque paiement"
              desc="Le client recevra automatiquement un recu par email"
              checked={payment.auto_send_receipt_to_client ?? true}
              onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, auto_send_receipt_to_client: v }) }))}
            />

            <ToggleRow
              label="Envoyer un recapitulatif au professionnel"
              desc="Vous recevrez une copie du recu pour chaque transaction"
              checked={payment.auto_send_receipt_to_pro ?? false}
              onChange={v => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, auto_send_receipt_to_pro: v }) }))}
            />

            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--dl-card-border)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 10px', fontFamily: 'DM Sans, sans-serif' }}>
                Message personnalise sur le recu
              </p>
              <input
                type="text"
                value={payment.receipt_custom_message ?? ''}
                onChange={e => setPayment(p => ({ ...normalizeBookingPaymentSettings({ ...p, receipt_custom_message: e.target.value }) }))}
                placeholder="Merci pour votre confiance !"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1.5px solid var(--dl-card-border)',
                  background: 'var(--dl-card-bg)', color: 'var(--dl-text-primary)',
                  fontSize: '0.83rem', fontFamily: 'DM Sans, sans-serif', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => void saveReceiptSettings()}
                disabled={receiptSaving}
                style={{
                  padding: '9px 22px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white',
                  border: 'none', cursor: receiptSaving ? 'not-allowed' : 'pointer', opacity: receiptSaving ? 0.6 : 1,
                }}
              >
                {receiptSaving ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </Card>

        {/* ── Transaction History ── */}
        <TransactionHistoryCard />

      </div>
    </div>
  )
}
