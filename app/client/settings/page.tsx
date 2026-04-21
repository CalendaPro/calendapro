'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import {
  Bell, Palette, Search, CreditCard, Lock, Globe, Shield,
  LogOut, Clock, User, Trash2, Download, Mail, Smartphone,
  FileText, KeyRound, CheckCircle2, AlertTriangle,
} from 'lucide-react'
const AppearanceSettings = dynamic(() => import('@/components/AppearanceSettings'), { ssr: false })

type Section = 'notifications' | 'search' | 'payment' | 'privacy' | 'language' | 'security' | 'appearance'

interface ReminderSettings {
  email_24h: boolean
  email_1h: boolean
  sms_24h: boolean
  sms_1h: boolean
  sms_phone: string | null
  push_notifications: boolean
  email_frequency: 'immediate' | 'daily' | 'off'
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ position: 'relative', width: 44, height: 24, borderRadius: 100, flexShrink: 0, transition: 'background 0.25s', background: checked ? 'var(--cl-accent)' : '#E2E8F0', border: 'none', cursor: 'pointer' }}
    >
      <div style={{ position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(15,23,42,0.15)', transition: 'left 0.25s' }} />
    </button>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--cl-surface)', border: '1.5px solid var(--cl-border)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--cl-shadow-soft)' }}>
      <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--cl-border)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--cl-accent-soft)', border: '1px solid var(--cl-accent-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cl-accent)', flexShrink: 0 }}>
          {icon}
        </div>
        <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--cl-text-primary)' }}>{title}</h2>
      </div>
      <div style={{ padding: '1.25rem 1.4rem' }}>{children}</div>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--cl-border)' }} className="last:border-0">
      <div>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function ClientSettingsPage() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [activeSection, setActiveSection] = useState<Section>('notifications')
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Reminder / notification settings
  const [reminders, setReminders] = useState<ReminderSettings>({
    email_24h: true,
    email_1h: false,
    sms_24h: false,
    sms_1h: false,
    sms_phone: null,
    push_notifications: true,
    email_frequency: 'immediate',
  })
  const [remindersLoading, setRemindersLoading] = useState(true)

  // Search history
  const [searchHistory, setSearchHistory] = useState<{ id: string; query: string; created_at: string }[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Privacy
  const [profileVisible, setProfileVisible] = useState(true)
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState(true)
  const [shareLocation, setShareLocation] = useState(true)

  const loadReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders/settings')
      if (res.ok) setReminders(await res.json())
    } finally { setRemindersLoading(false) }
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/search/history?limit=10')
      if (res.ok) setSearchHistory(await res.json())
    } finally { setHistoryLoading(false) }
  }, [])

  useEffect(() => { void loadReminders() }, [loadReminders])

  useEffect(() => {
    if (activeSection === 'search') void loadHistory()
  }, [activeSection, loadHistory])

  const saveReminders = async () => {
    await fetch('/api/reminders/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminders),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const clearHistory = async () => {
    await fetch('/api/search/history', { method: 'DELETE' })
    setSearchHistory([])
  }

  const handleSignOut = () => signOut({ redirectUrl: '/' })

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'notifications', label: 'Notifications',  icon: <Bell        size={15} strokeWidth={1.5} /> },
    { id: 'appearance',    label: 'Apparence',       icon: <Palette     size={15} strokeWidth={1.5} /> },
    { id: 'search',        label: 'Recherche',       icon: <Search      size={15} strokeWidth={1.5} /> },
    { id: 'payment',       label: 'Paiement',        icon: <CreditCard  size={15} strokeWidth={1.5} /> },
    { id: 'privacy',       label: 'Confidentialité', icon: <Lock        size={15} strokeWidth={1.5} /> },
    { id: 'language',      label: 'Langue',          icon: <Globe       size={15} strokeWidth={1.5} /> },
    { id: 'security',      label: 'Sécurité',       icon: <Shield      size={15} strokeWidth={1.5} /> },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--cl-accent)', marginBottom: '0.3rem', fontFamily: "'DM Sans', sans-serif" }}>Compte</div>
        <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.5rem, 2.2vw, 1.9rem)', fontWeight: 700, color: 'var(--cl-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Paramètres</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--cl-text-muted)', marginTop: '0.4rem', fontFamily: "'DM Sans', sans-serif" }}>Gérez votre compte et vos préférences</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* Sidebar nav */}
        <div style={{ width: 216, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.52rem 0.75rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 500,
                  transition: 'all 0.18s', textAlign: 'left' as const,
                  border: activeSection === s.id ? '1px solid var(--cl-accent-20)' : '1px solid transparent',
                  background: activeSection === s.id ? 'var(--cl-accent-soft)' : 'transparent',
                  color: activeSection === s.id ? 'var(--cl-accent)' : 'var(--cl-text-muted)',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => { if (activeSection !== s.id) { e.currentTarget.style.background = 'var(--cl-surface)'; e.currentTarget.style.color = 'var(--cl-text-primary)' } }}
                onMouseLeave={e => { if (activeSection !== s.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cl-text-muted)' } }}
              >
                <span style={{ color: activeSection === s.id ? 'var(--cl-accent)' : 'currentColor', opacity: activeSection === s.id ? 1 : 0.6, display: 'flex' }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--cl-border)' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.52rem 0.75rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 500,
                border: '1px solid transparent', background: 'transparent', color: '#ef4444',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut size={15} strokeWidth={1.5} style={{ opacity: 0.7 }} />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── APPEARANCE ── */}
          {activeSection === 'appearance' && (
            <SectionCard title="Apparence" icon={<Palette size={15} strokeWidth={1.5} />}>
              <AppearanceSettings variant="client" />
            </SectionCard>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === 'notifications' && (
            <>
              <SectionCard title="Email" icon={<Mail size={15} strokeWidth={1.5} />}>
                {remindersLoading ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Chargement…</div>
                ) : (
                  <>
                    <ToggleRow label="Réservation confirmée" desc="Email dès qu'une réservation est créée" checked={true} onChange={() => {}} />
                    <ToggleRow label="Rappel 24h avant" desc="Email la veille de votre RDV" checked={reminders.email_24h} onChange={v => setReminders(r => ({ ...r, email_24h: v }))} />
                    <ToggleRow label="Rappel 1h avant" desc="Email 1 heure avant votre RDV" checked={reminders.email_1h} onChange={v => setReminders(r => ({ ...r, email_1h: v }))} />
                    <ToggleRow label="Demande d'évaluation" desc="Email après un RDV complété" checked={true} onChange={() => {}} />
                    <ToggleRow label="Updates favoris" desc="Quand un pro favori a de nouveaux créneaux" checked={reminders.push_notifications} onChange={v => setReminders(r => ({ ...r, push_notifications: v }))} />
                    <div style={{ paddingTop: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cl-text-primary)', marginBottom: '0.4rem', fontFamily: "'DM Sans', sans-serif" }}>Fréquence des emails</label>
                      <select
                        value={reminders.email_frequency}
                        onChange={e => setReminders(r => ({ ...r, email_frequency: e.target.value as 'immediate' | 'daily' | 'off' }))}
                        style={{ width: '100%', padding: '0.48rem 0.8rem', border: '1.5px solid var(--cl-border)', borderRadius: 10, fontSize: '0.78rem', outline: 'none', background: 'var(--cl-surface)', color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <option value="immediate">Immédiat</option>
                        <option value="daily">Quotidien (digest)</option>
                        <option value="off">Désactiver tous les emails</option>
                      </select>
                    </div>
                  </>
                )}
              </SectionCard>

              <SectionCard title="SMS" icon={<Smartphone size={15} strokeWidth={1.5} />}>
                <ToggleRow label="Rappel SMS 24h avant" desc="Message texte la veille de votre RDV" checked={reminders.sms_24h} onChange={v => setReminders(r => ({ ...r, sms_24h: v }))} />
                <ToggleRow label="Rappel SMS 1h avant" desc="Message texte 1 heure avant" checked={reminders.sms_1h} onChange={v => setReminders(r => ({ ...r, sms_1h: v }))} />
                {(reminders.sms_24h || reminders.sms_1h) && (
                  <div style={{ paddingTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cl-text-primary)', marginBottom: '0.4rem', fontFamily: "'DM Sans', sans-serif" }}>Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={reminders.sms_phone ?? ''}
                      onChange={e => setReminders(r => ({ ...r, sms_phone: e.target.value || null }))}
                      placeholder="+33 6 00 00 00 00"
                      style={{ width: '100%', padding: '0.48rem 0.8rem', border: '1.5px solid var(--cl-border)', borderRadius: 10, fontSize: '0.78rem', outline: 'none', background: 'var(--cl-surface)', color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                )}
              </SectionCard>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={saveReminders}
                  className="btn-glow"
                  style={{ padding: '0.55rem 1.25rem', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: 'white', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}
                >
                  Enregistrer
                </button>
                {saved && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#15803D', fontSize: '0.82rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    <CheckCircle2 size={14} strokeWidth={2} /> Sauvegardé
                  </span>
                )}
              </div>
            </>
          )}

          {/* ── RECHERCHE ── */}
          {activeSection === 'search' && (
            <SectionCard title="Historique de recherche" icon={<Clock size={15} strokeWidth={1.5} />}>
              {historyLoading ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Chargement…</div>
              ) : searchHistory.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Aucune recherche récente.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '1rem' }}>
                    {searchHistory.map(h => (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--cl-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                          <Clock size={12} strokeWidth={1.5} style={{ color: 'var(--cl-text-muted)', flexShrink: 0 }} />
                          {h.query}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                          {new Date(h.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={clearHistory}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <Trash2 size={13} strokeWidth={1.5} /> Effacer l'historique
                  </button>
                </>
              )}
            </SectionCard>
          )}

          {/* ── PAIEMENT ── */}
          {activeSection === 'payment' && (
            <>
              <SectionCard title="Méthode de paiement" icon={<CreditCard size={15} strokeWidth={1.5} />}>
                <p style={{ fontSize: '0.82rem', color: 'var(--cl-text-muted)', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" }}>Gérez vos cartes de paiement via Stripe.</p>
                <button
                  onClick={() => window.open('https://billing.stripe.com/p/login', '_blank')}
                  style={{ padding: '0.52rem 1.1rem', border: '1.5px solid var(--cl-accent-20)', background: 'var(--cl-accent-soft)', color: 'var(--cl-accent)', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Gérer mes paiements →
                </button>
              </SectionCard>
              <SectionCard title="Facturation" icon={<FileText size={15} strokeWidth={1.5} />}>
                <div style={{ fontSize: '0.82rem', color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--cl-border)' }}>
                    <span style={{ color: 'var(--cl-text-muted)' }}>Email de facturation</span>
                    <span style={{ fontWeight: 600 }}>{user?.emailAddresses?.[0]?.emailAddress}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', marginTop: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>Les reçus sont envoyés automatiquement par email après chaque paiement.</p>
              </SectionCard>
            </>
          )}

          {/* ── CONFIDENTIALITÉ ── */}
          {activeSection === 'privacy' && (
            <>
              <SectionCard title="Données personnelles" icon={<User size={15} strokeWidth={1.5} />}>
                <ToggleRow label="Profil visible pour les pros" desc="Les professionnels peuvent voir votre profil" checked={profileVisible} onChange={setProfileVisible} />
                <ToggleRow label="Suggestions personnalisées" desc="Recommandations basées sur vos préférences" checked={personalizedSuggestions} onChange={setPersonalizedSuggestions} />
                <ToggleRow label="Partager ma localisation" desc="Améliorer les résultats de recherche géolocalisés" checked={shareLocation} onChange={setShareLocation} />
              </SectionCard>
              <SectionCard title="Données & Export" icon={<Download size={15} strokeWidth={1.5} />}>
                <p style={{ fontSize: '0.82rem', color: 'var(--cl-text-muted)', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" }}>Téléchargez toutes vos données personnelles (réservations, favoris, historique) au format JSON.</p>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.52rem 1.1rem', border: '1.5px solid var(--cl-border)', background: 'var(--cl-surface)', color: 'var(--cl-text-primary)', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  <Download size={14} strokeWidth={1.5} /> Télécharger mes données
                </button>
              </SectionCard>
              <SectionCard title="Suppression du compte" icon={<AlertTriangle size={15} strokeWidth={1.5} />}>
                <p style={{ fontSize: '0.82rem', color: 'var(--cl-text-muted)', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" }}>Cette action est irréversible. Toutes vos données seront définitivement supprimées.</p>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.52rem 1.1rem', border: '1.5px solid #fecdd3', background: '#fff1f2', color: '#be123c', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} /> Supprimer mon compte
                  </button>
                ) : (
                  <div style={{ padding: '1rem', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 12 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#be123c', marginBottom: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>Êtes-vous sûr ? Cette action est définitive.</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Confirmer la suppression</button>
                      <button onClick={() => setDeleteConfirm(false)} style={{ padding: '0.5rem 1rem', border: '1.5px solid var(--cl-border)', background: 'var(--cl-surface)', color: 'var(--cl-text-muted)', borderRadius: 10, fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Annuler</button>
                    </div>
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* ── LANGUE ── */}
          {activeSection === 'language' && (
            <SectionCard title="Langue & Région" icon={<Globe size={15} strokeWidth={1.5} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[{ label: 'Langue', opts: [{ v: 'fr', l: 'Français' }, { v: 'en', l: 'English' }, { v: 'es', l: 'Español' }] }, { label: 'Fuseau horaire', opts: [{ v: 'Europe/Paris', l: 'Europe/Paris (UTC+1)' }, { v: 'Europe/London', l: 'Europe/London (UTC+0)' }, { v: 'America/New_York', l: 'America/New_York (UTC-5)' }] }, { label: 'Format de date', opts: [{ v: 'DD/MM/YYYY', l: 'JJ/MM/AAAA' }, { v: 'MM/DD/YYYY', l: 'MM/JJ/AAAA' }, { v: 'YYYY-MM-DD', l: 'AAAA-MM-JJ' }] }].map(({ label, opts }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cl-text-primary)', marginBottom: '0.4rem', fontFamily: "'DM Sans', sans-serif" }}>{label}</label>
                    <select style={{ width: '100%', padding: '0.48rem 0.8rem', border: '1.5px solid var(--cl-border)', borderRadius: 10, fontSize: '0.78rem', outline: 'none', background: 'var(--cl-surface)', color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
                      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
                <button className="btn-glow" style={{ width: 'fit-content', padding: '0.55rem 1.25rem', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: 'white', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}>Enregistrer</button>
              </div>
            </SectionCard>
          )}

          {/* ── SÉCURITÉ ── */}
          {activeSection === 'security' && (
            <>
              <SectionCard title="Connexion & Mot de passe" icon={<KeyRound size={15} strokeWidth={1.5} />}>
                <p style={{ fontSize: '0.82rem', color: 'var(--cl-text-muted)', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" }}>Gérez votre mot de passe et votre sécurité de compte via Clerk.</p>
                <button
                  onClick={() => openUserProfile()}
                  className="btn-glow"
                  style={{ padding: '0.52rem 1.1rem', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: 'white', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}
                >
                  Gérer mon compte →
                </button>
              </SectionCard>
              <SectionCard title="Informations du compte" icon={<User size={15} strokeWidth={1.5} />}>
                <div style={{ fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif" }}>
                  {[{ label: 'Nom', value: user?.fullName ?? '-' }, { label: 'Email', value: user?.emailAddresses?.[0]?.emailAddress ?? '-' }, { label: 'Compte créé le', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-' }].map(({ label, value }, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: i < 2 ? '1px solid var(--cl-border)' : 'none' }}>
                      <span style={{ color: 'var(--cl-text-muted)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--cl-text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
