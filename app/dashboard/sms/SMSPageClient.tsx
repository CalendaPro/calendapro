'use client'

import { useState } from 'react'
import Link from 'next/link'
import PurchaseConfirmModal from '@/components/PurchaseConfirmModal'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface SmsLog {
  id: string
  created_at: string
  type: string
  client_name?: string
  credits_used?: number
}

interface NotifSettings {
  smsConfirmation: boolean
  sms24hBefore: boolean
  sms2hBefore: boolean
  smsNoShow: boolean
  smsLastMinute: boolean
  emailConfirmation: boolean
  email24hBefore: boolean
}

const SMS_PREVIEWS: Record<string, { label: string; text: string }> = {
  smsConfirmation: {
    label: 'Confirmation de réservation',
    text: 'Bonjour [Prénom], votre RDV avec [Votre Nom] est confirmé pour le [Date] à [Heure]. Pour annuler : [Lien]',
  },
  sms24hBefore: {
    label: 'Rappel 24h avant',
    text: 'Rappel : votre RDV avec [Votre Nom] est demain [Date] à [Heure]. En cas d\'empêchement, merci de prévenir au plus tôt.',
  },
  sms2hBefore: {
    label: 'Rappel 2h avant',
    text: 'Rappel : votre RDV avec [Votre Nom] est dans 2h, à [Heure]. À tout à l\'heure !',
  },
  smsNoShow: {
    label: 'Alerte no-show',
    text: 'Bonjour [Prénom], nous avons noté votre absence à votre RDV de [Heure]. N\'hésitez pas à reprendre RDV : [Lien]',
  },
  smsLastMinute: {
    label: 'Alerte créneau libéré',
    text: 'Un créneau vient de se libérer chez [Votre Nom] pour aujourd\'hui à [Heure] ! Réservez vite : [Lien]',
  },
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 40, height: 22,
        borderRadius: 100,
        background: checked ? '#7c3aed' : '#e2e8f0',
        border: 'none', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

// ─── PREVIEW MODAL ────────────────────────────────────────────────────────────
function PreviewModal({ notifKey, onClose }: { notifKey: string; onClose: () => void }) {
  const preview = SMS_PREVIEWS[notifKey]
  const charCount = preview?.text.length ?? 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 20, padding: '1.8rem',
          maxWidth: 420, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          border: '1px solid #ede9e3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Aperçu du message SMS
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Phone mockup */}
        <div style={{ background: '#f8f7f4', borderRadius: 14, padding: '1rem', marginBottom: '1rem', border: '1px solid #ede9e3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0f172a', fontFamily: 'DM Sans, sans-serif' }}>CalendaPro</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>SMS · maintenant</div>
            </div>
          </div>
          <div style={{
            background: 'white', borderRadius: '0 12px 12px 12px',
            padding: '0.75rem 0.9rem',
            fontSize: '0.82rem', color: '#0f172a',
            fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6,
            border: '1px solid #f0ede8',
          }}>
            {preview?.text}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>
            {charCount} caractères · 1 SMS
          </div>
          <button onClick={onClose}
            style={{ padding: '0.5rem 1.2rem', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PACK BUTTON ─────────────────────────────────────────────────────────────
function PackButton({ credits, price, popular, priceId }: { credits: number; price: number; popular?: boolean; priceId: string }) {
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleBuy = async () => {
    setShowConfirm(false)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/sms-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, credits }),
      })
      const text = await res.text()
      let data: { url?: string; error?: string } = {}
      try {
        if (text) data = JSON.parse(text)
      } catch {
        console.error('Réponse checkout invalide', res.status, text.slice(0, 120))
        return
      }
      if (!res.ok) {
        console.error(data.error ?? res.statusText)
        return
      }
      if (data.url) window.location.href = data.url
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const centsPerSms = ((price / credits) * 100).toFixed(1)
  const priceLabel = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: popular ? 'linear-gradient(145deg, #f5f3ff, #fdf2f8)' : 'white',
        border: popular
          ? '2px solid #c4b5fd'
          : hovered ? '1.5px solid #c4b5fd' : '1.5px solid #ede9e3',
        borderRadius: 16,
        padding: '1.4rem',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered
          ? '0 12px 32px rgba(124,58,237,0.12)'
          : popular ? '0 4px 20px rgba(124,58,237,0.1)' : 'none',
      }}
    >
      {popular && (
        <div style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          color: 'white', fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '0.22rem 0.9rem', borderRadius: 100, whiteSpace: 'nowrap',
        }}>
          Populaire
        </div>
      )}

      <div style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1, marginBottom: '0.2rem' }}>
        {credits}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', marginBottom: '0.9rem' }}>crédits SMS</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.2rem' }}>
        <span style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed', letterSpacing: '-0.03em' }}>{priceLabel}</span>
      </div>
      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', marginBottom: '1rem' }}>{centsPerSms}cts / SMS</div>

      <button type="button" onClick={() => setShowConfirm(true)} disabled={loading}
        style={{
          width: '100%', padding: '0.6rem',
          background: popular ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : hovered ? '#f5f3ff' : '#f8f7f4',
          color: popular ? 'white' : '#7c3aed',
          border: popular ? 'none' : '1px solid #ede9fe',
          borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
          fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'wait' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {loading ? 'Chargement...' : 'Acheter ce pack'}
      </button>

      <PurchaseConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmer votre achat"
        description={
          <>
            Vous allez acheter <strong>{credits} crédits SMS</strong> pour {priceLabel}. Vous serez redirigé vers la page de paiement sécurisée Stripe. Souhaitez-vous continuer ?
          </>
        }
        onConfirm={handleBuy}
        loading={loading}
      />
    </div>
  )
}

// ─── MAIN CLIENT ──────────────────────────────────────────────────────────────
export default function SMSPageClient({ credits, history }: { credits: number; history: SmsLog[] }) {
  const [notifs, setNotifs] = useState<NotifSettings>({
    smsConfirmation: true,
    sms24hBefore: true,
    sms2hBefore: false,
    smsNoShow: false,
    smsLastMinute: false,
    emailConfirmation: true,
    email24hBefore: true,
  })
  const [previewKey, setPreviewKey] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'rappels' | 'historique'>('rappels')

  const setNotif = (key: keyof NotifSettings, val: boolean) => {
    setNotifs(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  const smsPerRdv =
    (notifs.smsConfirmation ? 1 : 0) +
    (notifs.sms24hBefore ? 1 : 0) +
    (notifs.sms2hBefore ? 1 : 0) +
    (notifs.smsNoShow ? 0.2 : 0) +
    (notifs.smsLastMinute ? 0.3 : 0)

  const estimatedMonthly = Math.round(20 * smsPerRdv)

  const handleSave = async () => {
    // TODO: await fetch('/api/settings', { method: 'POST', body: JSON.stringify(notifs) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isLow = credits > 0 && credits < 10
  const isEmpty = credits === 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        * { box-sizing: border-box; }
        .sp { padding: 2rem 2.4rem 4rem; font-family: 'DM Sans', sans-serif; width: 100%; }

        .sp-breadcrumb { font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.4rem; }
        .sp-breadcrumb a { color: #94a3b8; text-decoration: none; }
        .sp-title { font-family: 'Clash Display', sans-serif; font-size: 1.9rem; font-weight: 700; letter-spacing: -0.04em; color: #0f172a; margin-bottom: 0.3rem; }
        .sp-sub { font-size: 0.83rem; color: #64748b; line-height: 1.6; margin-bottom: 1.8rem; }

        /* BALANCE CARD */
        .sp-balance {
          background: white;
          border: 1px solid #ede9e3;
          border-radius: 18px;
          padding: 1.6rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .sp-balance-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.5rem; }
        .sp-balance-value {
          font-family: 'Clash Display', sans-serif;
          font-size: 3.2rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .sp-balance-sub { font-size: 0.75rem; color: #94a3b8; }

        .sp-balance-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.6rem; }

        .sp-estim-box {
          background: #f5f3ff;
          border: 1px solid #ede9fe;
          border-radius: 12px;
          padding: 0.8rem 1rem;
          text-align: right;
          min-width: 160px;
        }
        .sp-estim-label { font-size: 0.63rem; color: #94a3b8; margin-bottom: 0.25rem; display: flex; align-items: center; justify-content: flex-end; gap: 3px; }
        .sp-estim-val { font-family: 'Clash Display', sans-serif; font-size: 1.4rem; font-weight: 700; color: #7c3aed; letter-spacing: -0.03em; }
        .sp-estim-sub { font-size: 0.62rem; color: #94a3b8; margin-top: 1px; }

        .sp-alert {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          font-size: 0.68rem;
          font-weight: 600;
        }
        .sp-alert-empty { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .sp-alert-low { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

        /* ONBOARDING BONUS */
        .sp-bonus {
          background: linear-gradient(135deg, #f0fdf4, #f5f3ff);
          border: 1px solid #bbf7d0;
          border-radius: 14px;
          padding: 1rem 1.3rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          margin-bottom: 2rem;
        }
        .sp-bonus-ico { width: 38px; height: 38px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #bbf7d0; }
        .sp-bonus-title { font-size: 0.82rem; font-weight: 700; color: #0f172a; font-family: 'Clash Display', sans-serif; margin-bottom: 2px; }
        .sp-bonus-desc { font-size: 0.72rem; color: #64748b; }
        .sp-bonus-btn { margin-left: auto; padding: 0.45rem 1rem; background: #10b981; color: white; border: none; border-radius: 100px; font-size: 0.72rem; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; white-space: nowrap; flex-shrink: 0; text-decoration: none; display: inline-block; }

        /* SECTION */
        .sp-section { margin-bottom: 2rem; }
        .sp-section-title { font-family: 'Clash Display', sans-serif; font-size: 0.88rem; font-weight: 600; color: #0f172a; letter-spacing: -0.01em; margin-bottom: 0.9rem; display: flex; align-items: center; gap: 0.45rem; }

        /* PACKS */
        .sp-packs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; margin-bottom: 0.75rem; }

        .sp-info-box { display: flex; align-items: center; gap: 0.45rem; padding: 0.6rem 0.9rem; background: #f8f7f4; border: 1px solid #ede9e3; border-radius: 10px; font-size: 0.72rem; color: #64748b; }

        /* TABS */
        .sp-tabs { display: flex; gap: 0; border-bottom: 1px solid #ede9e3; margin-bottom: 0; background: white; border-radius: 16px 16px 0 0; overflow: hidden; }
        .sp-tab {
          padding: 0.85rem 1.3rem;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: #94a3b8;
          cursor: pointer;
          border: none;
          background: none;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .sp-tab.active { color: #7c3aed; border-bottom-color: #7c3aed; background: #fafaf8; }
        .sp-tab:hover:not(.active) { color: #374151; background: #fafaf8; }

        /* PANEL */
        .sp-panel { background: white; border: 1px solid #ede9e3; border-radius: 0 0 16px 16px; overflow: hidden; }
        .sp-panel-top { background: white; border: 1px solid #ede9e3; border-radius: 16px 16px 0 0; }

        /* NOTIFS */
        .sp-group-label { padding: 0.65rem 1.3rem 0.4rem; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; background: #fafaf8; border-bottom: 1px solid #f4f2ee; display: flex; align-items: center; gap: 0.4rem; }
        .sp-notif-item { display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.3rem; border-bottom: 1px solid #f8f7f4; gap: 1rem; }
        .sp-notif-item:last-child { border-bottom: none; }
        .sp-notif-left { flex: 1; min-width: 0; }
        .sp-notif-name { font-size: 0.82rem; font-weight: 600; color: #0f172a; margin-bottom: 2px; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
        .sp-notif-desc { font-size: 0.7rem; color: #94a3b8; line-height: 1.4; }
        .sp-badge { font-size: 0.58rem; font-weight: 700; padding: 1px 6px; border-radius: 100px; }
        .sp-badge-sms { background: #f5f3ff; color: #7c3aed; }
        .sp-badge-email { background: #f0fdf4; color: #16a34a; }
        .sp-badge-free { background: #f8f7f4; color: #94a3b8; }
        .sp-badge-new { background: #fff7ed; color: '#c2410c'; }

        .sp-notif-actions { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
        .sp-preview-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 6px; transition: all 0.15s; display: flex; align-items: center; }
        .sp-preview-btn:hover { background: #f5f3ff; color: #7c3aed; }

        /* ESTIM FOOTER */
        .sp-estim-footer { padding: 0.9rem 1.3rem; background: #fafaf8; border-top: 1px solid #f0ede8; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .sp-estim-footer-txt { font-size: 0.75rem; color: #64748b; }
        .sp-estim-footer-val { font-family: 'Clash Display', sans-serif; font-size: 0.95rem; font-weight: 700; color: #7c3aed; }

        /* SAVE */
        .sp-save-row { margin-top: 1rem; display: flex; align-items: center; gap: 1rem; }
        .sp-save-btn { padding: 0.62rem 1.5rem; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; border: none; border-radius: 100px; font-size: 0.8rem; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px rgba(124,58,237,0.22); }
        .sp-save-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.32); }
        .sp-save-ok { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: #10b981; font-weight: 500; }

        /* HISTORY */
        .sp-history-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1.3rem; border-bottom: 1px solid #f8f7f4; }
        .sp-history-item:last-child { border-bottom: none; }
        .sp-history-ico { width: 32px; height: 32px; border-radius: 8px; background: #f5f3ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sp-history-type { font-size: 0.78rem; font-weight: 600; color: #0f172a; margin-bottom: 1px; }
        .sp-history-date { font-size: 0.67rem; color: #94a3b8; }
        .sp-history-credits { margin-left: auto; font-size: 0.72rem; font-weight: 600; color: #7c3aed; white-space: nowrap; }

        /* ASTUCE */
        .sp-tip { padding: 1rem 1.2rem; background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 14px; display: flex; gap: 0.75rem; align-items: flex-start; margin-top: 1.5rem; }
        .sp-tip-text { font-size: 0.78rem; color: '#6b21a8'; line-height: 1.6; }
      `}</style>

      {previewKey && <PreviewModal notifKey={previewKey} onClose={() => setPreviewKey(null)} />}

      <div className="sp">

        {/* HEADER */}
        <div className="sp-breadcrumb">
          <Link href="/dashboard">Dashboard</Link> → Crédits SMS & Rappels
        </div>
        <div className="sp-title">Crédits SMS & Rappels</div>
        <div className="sp-sub">Gérez vos crédits et configurez les rappels automatiques envoyés à vos clients.</div>

        {/* BALANCE CARD */}
        <div className="sp-balance">
          <div>
            <div className="sp-balance-label">Solde actuel</div>
            <div className="sp-balance-value" style={{
              color: isEmpty ? '#f97316' : isLow ? '#d97706' : '#0f172a',
            }}>
              {credits}
            </div>
            <div className="sp-balance-sub">crédits SMS disponibles</div>
            {isEmpty && (
              <div className="sp-alert sp-alert-empty" style={{ marginTop: '0.6rem' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Achetez un pack pour activer les rappels SMS
              </div>
            )}
            {isLow && (
              <div className="sp-alert sp-alert-low" style={{ marginTop: '0.6rem' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Solde faible — rechargez bientôt
              </div>
            )}
          </div>

          <div className="sp-balance-right">
            <div className="sp-estim-box">
              <div className="sp-estim-label">
                Conso. estimée / mois
                <span title="Basé sur 2 rappels par RDV pour 20 RDV/mois" style={{ cursor: 'help' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </span>
              </div>
              <div className="sp-estim-val">{estimatedMonthly} SMS</div>
              <div className="sp-estim-sub">basé sur vos paramètres</div>
            </div>
          </div>
        </div>

        {/* BONUS ONBOARDING — affiché si 0 crédits */}
        {isEmpty && (
          <div className="sp-bonus">
            <div className="sp-bonus-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <div className="sp-bonus-title">🎁 Complétez votre profil → 10 crédits offerts</div>
              <div className="sp-bonus-desc">Ajoutez une photo et un service pour recevoir vos premiers crédits SMS gratuits.</div>
            </div>
            <Link href="/dashboard/profile" className="sp-bonus-btn">Compléter</Link>
          </div>
        )}

        {/* PACKS */}
        <div className="sp-section">
          <div className="sp-section-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Acheter des crédits SMS
          </div>
          <div className="sp-packs">
            <PackButton credits={50} price={4.9} priceId={process.env.NEXT_PUBLIC_STRIPE_SMS_50_PRICE_ID ?? ''} />
            <PackButton credits={200} price={14.9} popular priceId={process.env.NEXT_PUBLIC_STRIPE_SMS_200_PRICE_ID ?? ''} />
            <PackButton credits={500} price={29.9} priceId={process.env.NEXT_PUBLIC_STRIPE_SMS_500_PRICE_ID ?? ''} />
          </div>
          <div className="sp-info-box">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Les crédits n'expirent pas. 1 SMS = 1 crédit, quel que soit le destinataire en France métropolitaine.
          </div>
        </div>

        {/* RAPPELS + HISTORIQUE — TABS */}
        <div className="sp-section">
          <div className="sp-section-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Rappels & Historique
          </div>

          <div className="sp-tabs">
            <button className={`sp-tab ${activeTab === 'rappels' ? 'active' : ''}`} onClick={() => setActiveTab('rappels')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Rappels automatiques
            </button>
            <button className={`sp-tab ${activeTab === 'historique' ? 'active' : ''}`} onClick={() => setActiveTab('historique')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Historique
              {history.length > 0 && (
                <span style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 100 }}>{history.length}</span>
              )}
            </button>
          </div>

          <div className="sp-panel">
            {activeTab === 'rappels' && (
              <>
                {/* SMS */}
                <div className="sp-group-label">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Rappels par SMS — consomme des crédits
                </div>
                {[
                  { key: 'smsConfirmation' as keyof NotifSettings, name: 'Confirmation de réservation', desc: 'Envoyé au client dès qu\'il prend RDV en ligne', badge: 'SMS' },
                  { key: 'sms24hBefore' as keyof NotifSettings, name: 'Rappel 24h avant le RDV', desc: 'Réduit drastiquement les no-shows', badge: 'SMS' },
                  { key: 'sms2hBefore' as keyof NotifSettings, name: 'Rappel 2h avant le RDV', desc: 'Double rappel pour les clients les plus oublieux', badge: 'SMS' },
                  { key: 'smsNoShow' as keyof NotifSettings, name: 'Alerte no-show', desc: 'SMS si le client ne s\'est pas présenté', badge: 'SMS' },
                  { key: 'smsLastMinute' as keyof NotifSettings, name: 'Créneau libéré (Marketplace)', desc: 'SMS aux clients fidèles quand un créneau se libère dans les 2h', badge: 'SMS', isNew: true },
                ].map(item => (
                  <div key={item.key} className="sp-notif-item">
                    <div className="sp-notif-left">
                      <div className="sp-notif-name">
                        {item.name}
                        <span className="sp-badge sp-badge-sms">SMS</span>
                        {item.isNew && <span className="sp-badge" style={{ background: '#fff7ed', color: '#c2410c' }}>Nouveau</span>}
                      </div>
                      <div className="sp-notif-desc">{item.desc}</div>
                    </div>
                    <div className="sp-notif-actions">
                      <button className="sp-preview-btn" onClick={() => setPreviewKey(item.key)} title="Aperçu du message">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <Toggle checked={notifs[item.key]} onChange={v => setNotif(item.key, v)} />
                    </div>
                  </div>
                ))}

                {/* EMAIL */}
                <div className="sp-group-label">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Rappels par Email — inclus gratuitement
                </div>
                {[
                  { key: 'emailConfirmation' as keyof NotifSettings, name: 'Confirmation par email', desc: 'Email récapitulatif envoyé au client à la réservation' },
                  { key: 'email24hBefore' as keyof NotifSettings, name: 'Rappel email 24h avant', desc: 'Email de rappel automatique la veille du RDV' },
                ].map(item => (
                  <div key={item.key} className="sp-notif-item">
                    <div className="sp-notif-left">
                      <div className="sp-notif-name">
                        {item.name}
                        <span className="sp-badge sp-badge-email">Email</span>
                        <span className="sp-badge sp-badge-free">Gratuit</span>
                      </div>
                      <div className="sp-notif-desc">{item.desc}</div>
                    </div>
                    <div className="sp-notif-actions">
                      <Toggle checked={notifs[item.key]} onChange={v => setNotif(item.key, v)} />
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="sp-estim-footer">
                  <div className="sp-estim-footer-txt">
                    Consommation estimée
                    <span style={{ color: '#94a3b8', fontSize: '0.63rem', marginLeft: 4 }}>(base 20 RDV/mois)</span>
                  </div>
                  <div className="sp-estim-footer-val">{estimatedMonthly} SMS / mois</div>
                </div>
              </>
            )}

            {activeTab === 'historique' && (
              <>
                {history.length === 0 ? (
                  <div style={{ padding: '3rem 1.3rem', textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>Aucun SMS envoyé pour l'instant</p>
                    <p style={{ fontSize: '0.72rem', color: '#c4bfb8', fontFamily: 'DM Sans, sans-serif' }}>L'historique apparaîtra ici après vos premiers rappels</p>
                  </div>
                ) : (
                  history.map(log => (
                    <div key={log.id} className="sp-history-item">
                      <div className="sp-history-ico">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="sp-history-type">{log.type ?? 'SMS envoyé'}{log.client_name ? ` — ${log.client_name}` : ''}</div>
                        <div className="sp-history-date">{new Date(log.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="sp-history-credits">−{log.credits_used ?? 1} crédit</div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {activeTab === 'rappels' && (
            <div className="sp-save-row">
              <button onClick={handleSave} className="sp-save-btn">Enregistrer les paramètres</button>
              {saved && (
                <div className="sp-save-ok">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Paramètres sauvegardés
                </div>
              )}
            </div>
          )}
        </div>

        {/* ASTUCE */}
        <div className="sp-tip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div className="sp-tip-text" style={{ color: '#6b21a8' }}>
            <strong>Astuce :</strong> En activant le rappel SMS 24h avant, nos pros réduisent leurs no-shows de <strong>65% en moyenne</strong>. Avec 20 RDV/mois à 50€, c'est ~<strong>650€ récupérés</strong> pour seulement 20 crédits.
          </div>
        </div>

      </div>
    </>
  )
}
