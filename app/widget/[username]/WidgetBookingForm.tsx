'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BookingPaymentSettings } from '@/lib/booking-payment-settings'

type PublicBookingSettings = BookingPaymentSettings & {
  username: string
  professionalName?: string | null
}

export default function WidgetBookingForm({
  username,
  professionalName,
}: {
  username: string
  professionalName: string
}) {
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', date: '', notes: '' })
  const [estimatedEur, setEstimatedEur] = useState('')
  const [settings, setSettings] = useState<PublicBookingSettings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [paymentChoice, setPaymentChoice] = useState<'deposit' | 'full'>('deposit')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [successKind, setSuccessKind] = useState<'direct' | 'stripe' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('booking') === 'success') {
      setStatus('success')
      setSuccessKind('stripe')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingSettings(true)
    fetch(`/api/public/booking-settings?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data?.error) {
          setSettingsError(data.error)
          setSettings(null)
        } else {
          setSettingsError(null)
          setSettings(data as PublicBookingSettings)
        }
        setLoadingSettings(false)
      })
      .catch(() => {
        if (!cancelled) {
          setSettingsError('Chargement impossible.')
          setLoadingSettings(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [username])

  useEffect(() => {
    if (!settings) return
    if (!settings.deposit_required && settings.allow_full_online_payment) setPaymentChoice('full')
    else setPaymentChoice('deposit')
  }, [settings])

  const needsEstimated = useMemo(() => {
    if (!settings?.online_payment_enabled) return false
    const s = settings
    if (s.deposit_required && s.deposit_type === 'percent') {
      if (!s.allow_full_online_payment) return true
      return paymentChoice === 'deposit'
    }
    if (s.allow_full_online_payment && (!s.deposit_required || paymentChoice === 'full')) return true
    return false
  }, [settings, paymentChoice])

  const canPayOnline =
    !!settings?.online_payment_enabled && (!!settings?.deposit_required || !!settings?.allow_full_online_payment)

  const primaryLabel = useMemo(() => {
    if (!settings) return '...'
    if (!settings.online_payment_enabled || !canPayOnline) return 'Demander un rendez-vous'
    if (!settings.deposit_required && settings.allow_full_online_payment) return 'Payer en ligne et réserver'
    if (settings.deposit_required && !settings.allow_full_online_payment) return "Payer l'acompte et réserver"
    return paymentChoice === 'full' ? 'Payer le montant total' : "Payer l'acompte"
  }, [settings, canPayOnline, paymentChoice])

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'Inter, sans-serif',
    background: '#f8fafc',
    color: '#0f172a',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '4px',
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px',
          }}
        >
          ✓
        </div>
        <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '16px' }}>Demande enregistrée !</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
          {successKind === 'stripe'
            ? 'Paiement confirmé. Rendez-vous enregistré.'
            : `${professionalName} a reçu votre demande. Règlement direct avec le professionnel.`}
        </p>
        <button
          onClick={() => {
            setStatus('idle')
            setSuccessKind(null)
            setForm({ clientName: '', clientEmail: '', clientPhone: '', date: '', notes: '' })
            setEstimatedEur('')
          }}
          style={{
            marginTop: '16px',
            background: 'none',
            border: 'none',
            color: '#7c3aed',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Nouvelle demande
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {loadingSettings && <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Chargement...</p>}
      {settingsError && !loadingSettings && (
        <p style={{ fontSize: '12px', color: '#b45309', background: '#fffbeb', padding: '8px 10px', borderRadius: '8px', margin: 0 }}>
          {settingsError}
        </p>
      )}
      {settings && !settings.online_payment_enabled && (
        <p style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', margin: 0 }}>
          Réservation sans paiement ici : règlement avec {professionalName}.
        </p>
      )}

      <div>
        <label style={labelStyle}>Votre nom *</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Marie Dupont"
          value={form.clientName}
          onChange={e => setForm({ ...form, clientName: e.target.value })}
        />
      </div>
      <div>
        <label style={labelStyle}>Votre email *</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="marie@email.com"
          value={form.clientEmail}
          onChange={e => setForm({ ...form, clientEmail: e.target.value })}
        />
      </div>
      <div>
        <label style={labelStyle}>Téléphone (SMS si activé)</label>
        <input
          style={inputStyle}
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={form.clientPhone}
          onChange={e => setForm({ ...form, clientPhone: e.target.value })}
        />
      </div>
      <div>
        <label style={labelStyle}>Date et heure *</label>
        <input
          style={inputStyle}
          type="datetime-local"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
        />
      </div>

      {needsEstimated && (
        <div>
          <label style={labelStyle}>Montant estimé (€) *</label>
          <input
            style={inputStyle}
            type="number"
            inputMode="decimal"
            min={0.5}
            step={0.01}
            placeholder="80"
            value={estimatedEur}
            onChange={e => setEstimatedEur(e.target.value)}
          />
        </div>
      )}

      {settings?.online_payment_enabled && settings.deposit_required && settings.allow_full_online_payment && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#334155' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Paiement</div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
            <input type="radio" name="wpay" checked={paymentChoice === 'deposit'} onChange={() => setPaymentChoice('deposit')} />
            Acompte
            {settings.deposit_type === 'percent' ? ` (${settings.deposit_value}%)` : ` (${settings.deposit_value} €)`}
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input type="radio" name="wpay" checked={paymentChoice === 'full'} onChange={() => setPaymentChoice('full')} />
            Total en ligne
          </label>
        </div>
      )}

      <div>
        <label style={labelStyle}>Message</label>
        <textarea
          style={{ ...inputStyle, resize: 'none' }}
          placeholder="Décrivez votre besoin..."
          rows={3}
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: '#ef4444', fontSize: '12px', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>
          Erreur. Vérifiez les champs.
        </p>
      )}

      <button
        onClick={async () => {
          if (!form.clientName || !form.date || !form.clientEmail) return
          if (needsEstimated) {
            const n = Number(estimatedEur.replace(',', '.'))
            if (!Number.isFinite(n) || n < 0.5) {
              setStatus('error')
              return
            }
          }
          if (!settings) return

          if (!settings.online_payment_enabled || !canPayOnline) {
            setStatus('loading')
            try {
              const res = await fetch('/api/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, ...form }),
              })
              if (res.ok) {
                setSuccessKind('direct')
                setStatus('success')
              } else setStatus('error')
            } catch {
              setStatus('error')
            }
            return
          }

          setStatus('loading')
          try {
            const res = await fetch('/api/stripe/booking-checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username,
                ...form,
                estimatedServiceTotalEur: needsEstimated ? Number(String(estimatedEur).replace(',', '.')) : undefined,
                paymentChoice,
              }),
            })
            const data = await res.json()
            if (res.ok && data?.url) {
              window.location.href = data.url
              return
            }
            setStatus('error')
          } catch {
            setStatus('error')
          }
        }}
        disabled={status === 'loading' || loadingSettings}
        style={{
          width: '100%',
          padding: '12px',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '14px',
          cursor: status === 'loading' || loadingSettings ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' || loadingSettings ? 0.7 : 1,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {status === 'loading' ? 'Patientez...' : primaryLabel}
      </button>

      <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', margin: 0 }}>
        Propulsé par <strong style={{ color: '#7c3aed' }}>CalendaPro</strong>
      </p>
    </div>
  )
}
