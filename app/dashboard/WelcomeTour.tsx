'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    bg: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    title: 'Votre Agenda',
    desc: 'Consultez vos rendez-vous, confirmez ou annulez en un clic. Vos clients reçoivent une notification automatique.',
    cta: 'Voir l\'agenda',
    href: '/dashboard/appointments',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    bg: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    title: 'Vos Services',
    desc: 'Ajoutez, modifiez ou supprimez vos prestations. Chaque service devient réservable en ligne instantanément.',
    cta: 'Gérer mes services',
    href: '/dashboard/site-customize',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
    bg: 'linear-gradient(135deg, #10b981, #059669)',
    title: 'Votre Lien Client',
    desc: 'Partagez ce lien unique sur Instagram, WhatsApp ou en signature de vos emails. Vos clients réservent en 30 secondes.',
    cta: 'Voir mon lien',
    href: '/dashboard/widget',
  },
]

const LS_KEY = 'calendapro_welcome_tour_dismissed'

export default function WelcomeTour({ username }: { username?: string }) {
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem(LS_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(LS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const current = STEPS[slide]!

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,10,20,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 9998,
          animation: 'fadeIn 0.25s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        width: 'min(96vw, 480px)',
        background: 'white',
        borderRadius: 28,
        padding: '2.2rem',
        boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
        fontFamily: 'DM Sans, sans-serif',
      }}>

        {/* Close */}
        <button
          onClick={dismiss}
          style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#64748b', fontSize: '1.1rem' }}
          title="Passer le guide"
        >
          ×
        </button>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: 20, background: current.bg, display: 'grid', placeItems: 'center', marginBottom: 20, boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}>
          {current.icon}
        </div>

        {/* Badge */}
        <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: 8 }}>
          Bienvenue sur CalendaPro · {slide + 1}/{STEPS.length}
        </div>

        <h2 style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 10, lineHeight: 1.1 }}>
          {current.title}
        </h2>

        <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: 24 }}>
          {current.desc}
        </p>

        {/* Slide dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 999, border: 'none', background: i === slide ? '#7c3aed' : '#e2e8f0', cursor: 'pointer', transition: 'all 0.25s', padding: 0 }}
            />
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ display: 'flex', gap: 10 }}>
          {slide < STEPS.length - 1 ? (
            <>
              <button
                onClick={() => setSlide(s => s + 1)}
                style={{ flex: 1, height: 48, borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 6px 24px rgba(124,58,237,0.3)', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
              >
                Suivant →
              </button>
              <button
                onClick={dismiss}
                style={{ height: 48, padding: '0 1.2rem', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', color: '#94a3b8', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}
              >
                Passer le guide
              </button>
            </>
          ) : (
            <>
              <Link
                href={current.href}
                onClick={dismiss}
                style={{ flex: 1, height: 48, borderRadius: 999, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'grid', placeItems: 'center', textDecoration: 'none', boxShadow: '0 6px 24px rgba(124,58,237,0.3)', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
              >
                {current.cta}
              </Link>
              <button
                onClick={dismiss}
                style={{ height: 48, padding: '0 1.2rem', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', color: '#94a3b8', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}
              >
                Passer le guide
              </button>
            </>
          )}
        </div>

        {/* Link preview */}
        {username && (
          <div style={{ marginTop: 16, padding: '0.7rem 1rem', background: '#f8f7f4', borderRadius: 12, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
            Votre page : <span style={{ color: '#7c3aed', fontWeight: 700 }}>calendapro.fr/{username}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700&display=swap');
      `}</style>
    </>
  )
}
