'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { usePlan } from '@/lib/hooks/usePlan'
import FeatureGate from '@/components/dashboard/FeatureGate'
import { logger } from '@/lib/logger'

const AppearanceSettings = dynamic(() => import('@/components/AppearanceSettings'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'notifications' | 'security' | 'integrations' | 'appearance' | 'contact'

interface NotifSettings {
  email_new_booking: boolean
  email_reminder_24h: boolean
  email_review_request: boolean
  sms_confirmations: boolean
  sms_reminders: boolean
}

interface GoogleCalStatus {
  connected: boolean
  provider_email?: string
  sync_enabled?: boolean
  last_synced_at?: string
  watch_active?: boolean
  blocked_events_count?: number
  recent_syncs?: { status: string; events_synced: number; started_at: string }[]
}

interface StripeSettings {
  online_payment_enabled: boolean
  deposit_required: boolean
  deposit_type: 'percent' | 'fixed'
  deposit_value: number
  allow_full_online_payment: boolean
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="touch-target"
      style={{
        position: 'relative', width: 48, height: 26, borderRadius: 13, flexShrink: 0,
        background: checked ? '#7c3aed' : 'var(--dl-card-border)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'background 0.2s',
        minWidth: 48, minHeight: 26,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function ToggleRow({ label, desc, checked, onChange, locked, lockLabel }: {
  label: string; desc?: string; checked: boolean
  onChange: (v: boolean) => void; locked?: boolean; lockLabel?: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '12px 0', borderBottom: '1px solid var(--dl-card-border)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{label}</p>
          {locked && lockLabel && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 800, color: '#7c3aed', background: 'rgba(124,58,237,0.1)',
              padding: '2px 7px', borderRadius: 100, letterSpacing: '0.05em', textTransform: 'uppercase',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {lockLabel}
            </span>
          )}
        </div>
        {desc && <p style={{ fontSize: '0.7rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={locked} />
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--dl-card-border)', background: 'var(--dl-card-bg)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dl-card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#7c3aed' }}>{icon}</span>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Clash Display', DM Sans, sans-serif", letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled, inputMode }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; inputMode?: string
}) {
  return (
    <input
      type={type}
      inputMode={inputMode as any}  // reason: React types lag behind HTML spec for inputMode values
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '12px', borderRadius: 9,
        border: '1.5px solid var(--dl-card-border)',
        background: disabled ? 'var(--dl-card-border)' : 'var(--dl-sidebar-bg)',
        color: 'var(--dl-text-primary)',
        fontSize: '16px', fontFamily: 'DM Sans, sans-serif',
        outline: 'none', boxSizing: 'border-box', opacity: disabled ? 0.6 : 1,
        minHeight: 44,
      }}
    />
  )
}

function ActionButton({ children, onClick, variant = 'secondary', disabled }: {
  children: React.ReactNode; onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', border: 'none' },
    secondary: { background: 'var(--dl-card-bg)', color: 'var(--dl-text-primary)', border: '1.5px solid var(--dl-card-border)' },
    danger: { background: 'var(--dl-card-bg)', color: '#ef4444', border: '1.5px solid #fecaca' },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="touch-target"
      style={{
        padding: '12px 18px', borderRadius: 9, fontSize: '0.875rem', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
        minHeight: 44,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  )
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ id, label, active, onClick }: { id: Section; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="touch-target"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', padding: '12px',
        borderRadius: 9, border: `1px solid ${active ? 'var(--dl-accent-border)' : 'transparent'}`,
        background: active ? 'var(--dl-accent-light)' : 'transparent',
        color: active ? 'var(--dl-accent)' : 'var(--dl-text-muted)',
        fontSize: '0.875rem', fontWeight: active ? 700 : 500,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif',
        transition: 'all 0.15s',
        minHeight: 44,
      }}
    >
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { plan, has } = usePlan()
  const searchParams = useSearchParams()
  const syncSuccess = searchParams.get('sync_success')
  const syncError = searchParams.get('sync_error')
  const sectionParam = searchParams.get('section')
  const connectSuccess = searchParams.get('connect_success')
  const connectIncomplete = searchParams.get('connect_incomplete')
  const connectError = searchParams.get('connect_error')
  const [active, setActive] = useState<Section>(
    sectionParam === 'integrations' || syncSuccess || syncError || connectSuccess || connectIncomplete || connectError
      ? 'integrations'
      : 'notifications'
  )
  const [saved, setSaved] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    connectSuccess ? { type: 'success', text: 'Stripe Connect configure avec succes ! Vos paiements arrivent directement sur votre compte.' } :
    connectIncomplete ? { type: 'error', text: 'Onboarding Stripe incomplet. Cliquez sur "Configurer Stripe" pour continuer.' } :
    connectError ? { type: 'error', text: `Erreur Stripe Connect : ${connectError}` } :
    syncSuccess ? { type: 'success', text: 'Google Calendar connecte avec succes !' } :
    syncError ? { type: 'error', text: `Erreur de connexion : ${syncError}` } : null
  )

  useEffect(() => {
    if (syncMsg) {
      const t = setTimeout(() => setSyncMsg(null), 6000)
      return () => clearTimeout(t)
    }
  }, [syncMsg])
  const [notif, setNotif] = useState<NotifSettings>({
    email_new_booking: true,
    email_reminder_24h: true,
    email_review_request: true,
    sms_confirmations: false,
    sms_reminders: false,
  })
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)

  // Google Calendar state
  const [gcal, setGcal] = useState<GoogleCalStatus>({ connected: false })
  const [gcalLoading, setGcalLoading] = useState(true)
  const [gcalDisconnecting, setGcalDisconnecting] = useState(false)

  // Stripe payment settings state
  const [stripe, setStripe] = useState<StripeSettings>({
    online_payment_enabled: false,
    deposit_required: false,
    deposit_type: 'percent',
    deposit_value: 25,
    allow_full_online_payment: false,
  })
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [savingStripe, setSavingStripe] = useState(false)

  // User plan for commission display
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'infinity'>('free')

  // Stripe Connect state
  const [connectStatus, setConnectStatus] = useState<{
    connected: boolean; charges_enabled: boolean; payouts_enabled: boolean; onboarding_complete: boolean; stripe_connect_id?: string
  }>({ connected: false, charges_enabled: false, payouts_enabled: false, onboarding_complete: false })
  const [connectLoading, setConnectLoading] = useState(true)
  const [connectOnboarding, setConnectOnboarding] = useState(false)

  // Load profile data
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: { email?: string; phone?: string; email_contact?: string }) => {
        setContactEmail(d.email_contact ?? d.email ?? '')
        setContactPhone(d.phone ?? '')
        setProfileLoaded(true)
      })
      .catch(() => setProfileLoaded(true))
  }, [])

  // Load notification settings
  useEffect(() => {
    fetch('/api/user/preferences')
      .then(r => r.json())
      .then((d: Partial<NotifSettings>) => {
        setNotif(prev => ({
          email_new_booking: d.email_new_booking ?? prev.email_new_booking,
          email_reminder_24h: d.email_reminder_24h ?? prev.email_reminder_24h,
          email_review_request: d.email_review_request ?? prev.email_review_request,
          sms_confirmations: d.sms_confirmations ?? prev.sms_confirmations,
          sms_reminders: d.sms_reminders ?? prev.sms_reminders,
        }))
      })
      .catch(() => {})
  }, [])

  // Load Google Calendar status
  useEffect(() => {
    fetch('/api/calendar/google/status')
      .then(r => r.json())
      .then((d: GoogleCalStatus) => setGcal(d))
      .catch(() => {})
      .finally(() => setGcalLoading(false))
  }, [])

  // Load Stripe payment settings from profile
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: Record<string, unknown>) => {
        setStripe({
          online_payment_enabled: d.online_payment_enabled === true,
          deposit_required: d.deposit_required === true,
          deposit_type: d.deposit_type === 'fixed' ? 'fixed' : 'percent',
          deposit_value: Number(d.deposit_value) || 25,
          allow_full_online_payment: d.allow_full_online_payment === true,
        })
        if (d.plan && typeof d.plan === 'string') {
          setUserPlan(d.plan as 'free' | 'premium' | 'infinity')
        }
        setStripeLoaded(true)
      })
      .catch(() => setStripeLoaded(true))
  }, [])

  // Load Stripe Connect status
  useEffect(() => {
    fetch('/api/stripe/connect/status')
      .then(r => r.json())
      .then(d => setConnectStatus(d))
      .catch(() => {})
      .finally(() => setConnectLoading(false))
  }, [])

  const startConnectOnboarding = useCallback(async () => {
    setConnectOnboarding(true)
    try {
      const res = await fetch('/api/stripe/connect/onboarding', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { /* silent */ }
    setConnectOnboarding(false)
  }, [])

  const disconnectGcal = useCallback(async () => {
    setGcalDisconnecting(true)
    try {
      await fetch('/api/calendar/google/disconnect', { method: 'POST' })
      setGcal({ connected: false })
    } catch {}
    setGcalDisconnecting(false)
  }, [])

  const saveStripeSettings = useCallback(async () => {
    setSavingStripe(true)
    try {
      await fetch('/api/pro/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          online_payment_enabled: stripe.online_payment_enabled,
          deposit_required: stripe.deposit_required,
          deposit_type: stripe.deposit_type,
          deposit_value: stripe.deposit_value,
          allow_full_online_payment: stripe.allow_full_online_payment,
        }),
      })
      showSaved()
    } catch (e) {
      logger.error('Failed to save Stripe settings', e)
    }
    setSavingStripe(false)
  }, [stripe])

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const saveNotifications = useCallback(async () => {
    setSavingNotif(true)
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
      })
      showSaved()
    } catch (e) {
      logger.error('Failed to save notifications', e)
    }
    setSavingNotif(false)
  }, [notif])

  const saveContact = useCallback(async () => {
    await fetch('/api/pro/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_contact: contactEmail, phone: contactPhone }),
    })
    showSaved()
  }, [contactEmail, contactPhone])

  const NAV: { id: Section; label: string }[] = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'appearance',    label: 'Apparence' },
    { id: 'contact',       label: 'Contact & coordonnees' },
    { id: 'integrations',  label: 'Integrations' },
    { id: 'security',      label: 'Securite' },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Clash Display', DM Sans, sans-serif", letterSpacing: '-0.02em' }}>
          Parametres
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--dl-text-muted)', margin: '4px 0 0' }}>
          Gerez votre compte, vos notifications et vos integrations
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>

        {/* Sidebar nav */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(n => (
              <NavItem key={n.id} id={n.id} label={n.label} active={active === n.id} onClick={() => setActive(n.id)} />
            ))}
          </nav>

          {saved && (
            <div style={{
              marginTop: 16, padding: '8px 12px', borderRadius: 9,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              fontSize: '0.7rem', fontWeight: 700, color: '#10b981',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Enregistre
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Sync message banner */}
          {syncMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 10,
              background: syncMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${syncMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              fontSize: '0.78rem', fontWeight: 600,
              color: syncMsg.type === 'success' ? '#059669' : '#dc2626',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {syncMsg.type === 'success'
                  ? <polyline points="20 6 9 17 4 12" />
                  : <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
              </svg>
              {syncMsg.text}
              <button
                type="button"
                onClick={() => setSyncMsg(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.9rem', lineHeight: 1 }}
              >
                x
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {active === 'notifications' && (
            <SectionCard title="Notifications" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 8px', fontFamily: 'DM Sans, sans-serif' }}>Email</p>
                <ToggleRow
                  label="Nouvelle reservation"
                  desc="Email des qu'un client reserve"
                  checked={notif.email_new_booking}
                  onChange={v => setNotif(n => ({ ...n, email_new_booking: v }))}
                />
                <ToggleRow
                  label="Rappel 24h avant"
                  desc="Email la veille du rendez-vous"
                  checked={notif.email_reminder_24h}
                  onChange={v => setNotif(n => ({ ...n, email_reminder_24h: v }))}
                />
                <ToggleRow
                  label="Demande d'evaluation"
                  desc="Email apres un RDV complete"
                  checked={notif.email_review_request}
                  onChange={v => setNotif(n => ({ ...n, email_review_request: v }))}
                />
              </div>
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 8px', fontFamily: 'DM Sans, sans-serif' }}>SMS</p>
                <ToggleRow
                  label="Confirmations SMS"
                  desc="SMS envoye au client a la reservation"
                  checked={notif.sms_confirmations}
                  onChange={v => setNotif(n => ({ ...n, sms_confirmations: v }))}
                  locked={!has('premium')}
                  lockLabel="Premium"
                />
                <ToggleRow
                  label="Rappels SMS"
                  desc="SMS de rappel 24h avant le RDV"
                  checked={notif.sms_reminders}
                  onChange={v => setNotif(n => ({ ...n, sms_reminders: v }))}
                  locked={!has('premium')}
                  lockLabel="Premium"
                />
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <ActionButton variant="primary" onClick={saveNotifications} disabled={savingNotif}>
                  {savingNotif ? 'Enregistrement...' : 'Enregistrer les preferences'}
                </ActionButton>
              </div>
            </SectionCard>
          )}

          {/* ── APPEARANCE ── */}
          {active === 'appearance' && (
            <SectionCard title="Apparence" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
              <AppearanceSettings variant="pro" />
            </SectionCard>
          )}

          {/* ── CONTACT ── */}
          {active === 'contact' && (
            <SectionCard title="Contact & coordonnees" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z"/></svg>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 6px', fontFamily: 'DM Sans, sans-serif' }}>
                    Email de contact public
                  </p>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={setContactEmail}
                    placeholder="contact@exemple.com"
                    disabled={!profileLoaded}
                  />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 6px', fontFamily: 'DM Sans, sans-serif' }}>
                    Telephone
                  </p>
                  <Input
                    type="tel"
                    value={contactPhone}
                    onChange={setContactPhone}
                    placeholder="+33 6 00 00 00 00"
                    disabled={!profileLoaded}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ActionButton variant="primary" onClick={saveContact}>Enregistrer</ActionButton>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── INTEGRATIONS ── */}
          {active === 'integrations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ─── GOOGLE CALENDAR ─── */}
              <SectionCard title="Google Calendar" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
                {gcalLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--dl-card-border)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--dl-text-muted)', fontFamily: 'DM Sans, sans-serif' }}>Chargement...</span>
                  </div>
                ) : gcal.connected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
                          Connecte
                        </p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '1px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                          {gcal.provider_email || 'Compte Google'}
                        </p>
                      </div>
                      {gcal.watch_active && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', padding: '3px 8px', borderRadius: 100, fontFamily: 'DM Sans, sans-serif' }}>
                          Sync temps reel
                        </span>
                      )}
                    </div>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 8, background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 4px', fontFamily: 'DM Sans, sans-serif' }}>Evenements bloques</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Clash Display', sans-serif" }}>{gcal.blocked_events_count ?? 0}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 8, background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 4px', fontFamily: 'DM Sans, sans-serif' }}>Derniere synchro</p>
                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
                          {gcal.last_synced_at
                            ? new Date(gcal.last_synced_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Jamais'}
                        </p>
                      </div>
                    </div>
                    {/* Recent syncs */}
                    {gcal.recent_syncs && gcal.recent_syncs.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 6px', fontFamily: 'DM Sans, sans-serif' }}>Historique recent</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {gcal.recent_syncs.slice(0, 3).map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', fontFamily: 'DM Sans, sans-serif', color: 'var(--dl-text-muted)' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.status === 'success' ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                              <span>{s.events_synced} evenement{s.events_synced !== 1 ? 's' : ''}</span>
                              <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                                {new Date(s.started_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Disconnect */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <ActionButton variant="danger" onClick={disconnectGcal} disabled={gcalDisconnecting}>
                        {gcalDisconnecting ? 'Deconnexion...' : 'Deconnecter Google Calendar'}
                      </ActionButton>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Google Calendar</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                        Synchronisez vos evenements Google pour bloquer automatiquement les creneaux occupes
                      </p>
                    </div>
                    <a
                      href="/api/calendar/google/connect"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 700,
                        fontFamily: 'DM Sans, sans-serif', textDecoration: 'none',
                        background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', border: 'none',
                        cursor: 'pointer', transition: 'opacity 0.15s',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                      Connecter Google
                    </a>
                  </div>
                )}
              </SectionCard>

              {/* ─── STRIPE CONNECT ─── */}
              <SectionCard title="Stripe Connect — Encaissement direct" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>}>
                {connectLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--dl-card-border)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--dl-text-muted)', fontFamily: 'DM Sans, sans-serif' }}>Verification du compte Stripe...</span>
                  </div>
                ) : connectStatus.onboarding_complete ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Connected badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
                          Stripe Connect actif
                        </p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '1px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                          Les paiements arrivent directement sur votre compte.
                          Commission CalendaPro : {userPlan === 'free' ? '5% (Starter)' : '0% (' + (userPlan === 'premium' ? 'Premium' : 'Infinity') + ')'}
                        </p>
                      </div>
                      {connectStatus.stripe_connect_id && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', padding: '3px 8px', borderRadius: 100, fontFamily: 'DM Sans, sans-serif' }}>
                          {connectStatus.stripe_connect_id.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 4px', fontFamily: 'DM Sans, sans-serif' }}>Paiements</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: connectStatus.charges_enabled ? '#10b981' : '#ef4444', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
                          {connectStatus.charges_enabled ? 'Actifs' : 'Inactifs'}
                        </p>
                      </div>
                      <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dl-text-muted)', margin: '0 0 4px', fontFamily: 'DM Sans, sans-serif' }}>Virements</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: connectStatus.payouts_enabled ? '#10b981' : '#ef4444', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
                          {connectStatus.payouts_enabled ? 'Actifs' : 'Inactifs'}
                        </p>
                      </div>
                    </div>
                    {/* Link to wallet */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <a
                        href="/dashboard/wallet"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 700,
                          fontFamily: 'DM Sans, sans-serif', textDecoration: 'none',
                          background: 'var(--dl-card-bg)', color: '#7c3aed', border: '1.5px solid rgba(124,58,237,0.2)',
                        }}
                      >
                        Voir le portefeuille →
                      </a>
                      <a
                        href="/dashboard/payments-reservations"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 700,
                          fontFamily: 'DM Sans, sans-serif', textDecoration: 'none',
                          background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', border: 'none',
                        }}
                      >
                        Gérer les paiements
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Encaissez directement</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                        Connectez votre compte Stripe pour recevoir les paiements clients directement.
                        {userPlan === 'free'
                          ? ' CalendaPro preleve 5% de commission (gratuit pour les abonnements Premium/Infinity).'
                          : ' Aucune commission CalendaPro avec votre abonnement ' + (userPlan === 'premium' ? 'Premium' : 'Infinity') + '.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startConnectOnboarding}
                      disabled={connectOnboarding}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
                        padding: '9px 18px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 700,
                        fontFamily: 'DM Sans, sans-serif',
                        background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white', border: 'none',
                        cursor: connectOnboarding ? 'not-allowed' : 'pointer', opacity: connectOnboarding ? 0.6 : 1,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                      {connectOnboarding ? 'Redirection...' : 'Configurer Stripe'}
                    </button>
                  </div>
                )}
              </SectionCard>

              {/* ─── WEBHOOKS ─── */}
              <SectionCard title="Webhooks" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(124,58,237,0.06)', borderRadius: 12, border: '1px dashed rgba(124,58,237,0.25)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7c3aed', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
                      Bientôt disponible
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                      Les webhooks arrivent bientôt avec le plan Infinity. Automatisez vos workflows avec Zapier, Make et plus.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SECURITY ── */}
          {active === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionCard title="Securite du compte" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--dl-card-border)' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Mot de passe</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>Modifiez votre mot de passe depuis Clerk</p>
                    </div>
                    <ActionButton variant="secondary">Modifier</ActionButton>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--dl-card-border)' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Double authentification (2FA)</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>Protegez votre compte avec une application d'authentification</p>
                    </div>
                    <ActionButton variant="secondary">Activer 2FA</ActionButton>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Supprimer le compte</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>Action irreversible — toutes vos donnees seront supprimees</p>
                    </div>
                    <ActionButton variant="danger">Supprimer</ActionButton>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Sessions actives" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}>
                <p style={{ fontSize: '0.78rem', color: 'var(--dl-text-muted)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
                  Gerez vos sessions depuis les parametres Clerk. Cliquez sur votre avatar en bas de la barre laterale.
                </p>
              </SectionCard>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
