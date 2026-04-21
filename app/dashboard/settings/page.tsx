'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePlan } from '@/lib/hooks/usePlan'
import FeatureGate from '@/components/dashboard/FeatureGate'

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

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative', width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: checked ? '#7c3aed' : 'var(--dl-card-border)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 20 : 3,
        width: 16, height: 16, borderRadius: '50%', background: 'white',
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

function Input({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 9,
        border: '1.5px solid var(--dl-card-border)',
        background: disabled ? 'var(--dl-card-border)' : 'var(--dl-sidebar-bg)',
        color: 'var(--dl-text-primary)',
        fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif',
        outline: 'none', boxSizing: 'border-box', opacity: disabled ? 0.6 : 1,
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
      style={{
        padding: '9px 18px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
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
      style={{
        width: '100%', display: 'flex', alignItems: 'center', padding: '9px 12px',
        borderRadius: 9, border: `1px solid ${active ? 'var(--dl-accent-border)' : 'transparent'}`,
        background: active ? 'var(--dl-accent-light)' : 'transparent',
        color: active ? 'var(--dl-accent)' : 'var(--dl-text-muted)',
        fontSize: '0.82rem', fontWeight: active ? 700 : 500,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { plan, has } = usePlan()
  const [active, setActive] = useState<Section>('notifications')
  const [saved, setSaved] = useState(false)
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
      console.error('Failed to save notifications', e)
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
    <div style={{ padding: '28px 32px', fontFamily: 'DM Sans, sans-serif', maxWidth: 960 }}>

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
              <SectionCard title="Calendriers" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Google Calendar</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>Synchronisez vos reservations automatiquement</p>
                  </div>
                  <ActionButton variant="secondary" disabled>Bientot disponible</ActionButton>
                </div>
              </SectionCard>

              <SectionCard title="Paiements" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dl-text-primary)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Stripe</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--dl-text-muted)', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>Configurez les paiements en ligne</p>
                  </div>
                  <ActionButton variant="secondary">Configurer Stripe</ActionButton>
                </div>
              </SectionCard>

              <SectionCard title="Webhooks" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}>
                {has('infinity') ? (
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--dl-text-muted)', margin: '0 0 12px', fontFamily: 'DM Sans, sans-serif' }}>
                      Connectez CalendaPro a Zapier, Make ou votre propre systeme.
                    </p>
                    <ActionButton variant="secondary">Ajouter un webhook</ActionButton>
                  </div>
                ) : (
                  <FeatureGate required="infinity" current={plan}>
                    <div style={{ height: 60 }} />
                  </FeatureGate>
                )}
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
