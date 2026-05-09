'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowRight, LogIn, UserPlus, Sparkles, Calendar, Star } from 'lucide-react'
import { logger } from '@/lib/logger'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ProPreview = {
  full_name: string
  username: string
  category: string | null
  avatar_url: string | null
  city: string | null
  plan: string
} | null

// ─── AVATAR MINI ──────────────────────────────────────────────────────────────
function ProAvatar({ name, avatarUrl, size = 64 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const palettes = [
    ['#7c3aed', '#a78bfa'], ['#db2777', '#f43f5e'],
    ['#2563eb', '#6366f1'], ['#059669', '#14b8a6'],
  ]
  const idx = (name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0)) % palettes.length
  const [from, to] = palettes[idx]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.3,
      fontFamily: "'Clash Display', sans-serif",
      border: '3px solid rgba(255,255,255,0.8)',
      boxShadow: '0 8px 24px rgba(79,70,229,0.25)',
    }}>
      {initials}
    </div>
  )
}

// ─── INNER PAGE (needs Suspense for useSearchParams) ──────────────────────────
function AuthChoiceInner() {
  const searchParams = useSearchParams()
  const proUsername = searchParams.get('pro')
  const [pro, setPro] = useState<ProPreview>(null)
  const [proLoading, setProLoading] = useState(!!proUsername)

  // Redirect auto après 10min d'inactivité
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.location.href = '/marketplace'
    }, 10 * 60 * 1000) // 10 minutes
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!proUsername) return
    fetch(`/api/marketplace/pro-preview?username=${encodeURIComponent(proUsername)}`)
      .then(r => r.json())
      .then(data => { if (data.pro) setPro(data.pro) })
      .catch(() => {})
      .finally(() => setProLoading(false))

    // Track conversion: Auth choice page viewed
    if (typeof window !== 'undefined') {
      logger.info('[TRACKING] Event: auth_choice_viewed', { proUsername })
      if ((window as any).dataLayer) {  // reason: GTM dataLayer has no TS type declarations
        (window as any).dataLayer.push({  // reason: GTM dataLayer has no TS type declarations
          event: 'auth_choice_viewed',
          proUsername,
          flow: proUsername ? 'direct_booking' : 'explore',
        })
      }
    }
  }, [proUsername])

  const signInHref = proUsername
    ? `/client-sign-in?redirect_url=${encodeURIComponent(`/client/${proUsername}`)}`
    : '/client-sign-in'

  const signUpHref = proUsername
    ? `/client-sign-up?redirect_url=${encodeURIComponent(`/client/${proUsername}`)}`
    : '/client-sign-up'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-15px, 20px) scale(0.97); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(79,70,229,0.15), 0 0 80px rgba(124,58,237,0.08); }
          50% { box-shadow: 0 0 60px rgba(79,70,229,0.25), 0 0 120px rgba(124,58,237,0.15); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes badge-appear {
          from { opacity: 0; transform: translateY(-8px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .choice-card {
          position: relative;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1.5px solid rgba(255, 255, 255, 0.5);
          border-radius: 28px;
          padding: 2.25rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          text-decoration: none;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .choice-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%);
          pointer-events: none;
        }
        .choice-card:hover {
          transform: translateY(-8px);
          border-color: rgba(124, 58, 237, 0.3);
          box-shadow: 0 28px 56px rgba(124,58,237,0.12), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .choice-card.primary:hover {
          border-color: rgba(124,58,237,0.4);
          box-shadow: 0 28px 56px rgba(124,58,237,0.2), 0 8px 24px rgba(236,72,153,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .pro-context-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(124,58,237,0.07);
          border: 1px solid rgba(124,58,237,0.15);
          border-radius: 100px;
          padding: 0.5rem 1rem;
          color: #7c3aed;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          animation: badge-appear 0.5s ease forwards;
        }

        @media (max-width: 640px) {
          .choices-grid { grid-template-columns: 1fr !important; }
          .auth-panel { padding: 2rem 1.25rem !important; }
        }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: '#F7F5F0',
        overflow: 'hidden', pointerEvents: 'none',
      }}>
        {/* Radial orbs */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'float-orb 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 60%)',
          filter: 'blur(100px)',
          animation: 'float-orb 22s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          width: '30vw', height: '30vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.03) 0%, transparent 55%)',
          filter: 'blur(60px)',
          animation: 'float-orb 15s ease-in-out infinite 4s',
        }} />
      </div>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 100,
        height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <BrandLogo />
        <Link href="/marketplace" style={{
          fontSize: '0.82rem', color: '#6B7280', textDecoration: 'none',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7c3aed')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
        >
          ← Retour à la Marketplace
        </Link>
      </nav>

      {/* ── MAIN ── */}
      <main style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '6rem 1.5rem 3rem',
      }}>
        <motion.div
          className="auth-panel"
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] } as Transition}
          style={{
            width: '100%', maxWidth: '640px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '2rem',
            padding: '3rem 2.5rem',
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '36px',
            boxShadow: '0 16px 64px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
            animation: 'glow-pulse 5s ease-in-out infinite',
          }}
        >
          {/* ── BADGE ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 } as Transition}
          >
            <div className="pro-context-pill">
              <Sparkles size={13} strokeWidth={2} />
              {proUsername ? 'Prise de rendez-vous' : 'Bienvenue sur CalendaPro'}
            </div>
          </motion.div>

          {/* ── PRO CONTEXT (si pro sélectionné) ── */}
          {(pro || proLoading) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 } as Transition}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.5rem',
                background: 'rgba(79,70,229,0.04)',
                border: '1px solid rgba(79,70,229,0.12)',
                borderRadius: '20px',
                width: '100%',
              }}
            >
              {proLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(79,70,229,0.08)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ height: 14, width: '50%', borderRadius: 6, background: 'rgba(79,70,229,0.08)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    <div style={{ height: 10, width: '30%', borderRadius: 6, background: 'rgba(79,70,229,0.06)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite 0.2s' }} />
                  </div>
                </div>
              ) : pro ? (
                <>
                  <ProAvatar name={pro.full_name || proUsername!} avatarUrl={pro.avatar_url} size={56} />
                  <div>
                    <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '1rem', color: '#0B0F19', letterSpacing: '-0.01em' }}>
                      {pro.full_name || proUsername}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B7280', marginTop: '3px' }}>
                      {[pro.category, pro.city].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} color="#7c3aed" strokeWidth={2} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', fontFamily: "'DM Sans', sans-serif" }}>
                      Agenda ouvert
                    </span>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}

          {/* ── HEADLINE ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 } as Transition}
            style={{ textAlign: 'center' }}
          >
            <h1 style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              letterSpacing: '-0.03em',
              color: '#0B0F19',
              lineHeight: 1.15,
              marginBottom: '0.75rem',
              overflow: 'visible',
              paddingRight: '0.05em',
              paddingBottom: '0.05em',
            }}>
              {pro
                ? <>Prêt à réserver<br /><span style={{ color: '#7c3aed' }}>avec {pro.full_name || proUsername} ?</span></>
                : <>Un instant avant<br /><span style={{ color: '#7c3aed' }}>de continuer</span></>
              }
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.95rem',
              color: '#6B7280',
              lineHeight: 1.65,
              maxWidth: '360px',
              margin: '0 auto',
            }}>
              Connectez-vous ou créez votre compte gratuit pour accéder à votre agenda de réservations.
            </p>
          </motion.div>

          {/* ── CARDS ── */}
          <motion.div
            className="choices-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] } as Transition}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              width: '100%',
            }}
          >
            {/* ── SIGN IN ── */}
            <Link href={signInHref} className="choice-card primary">
              <div style={{
                width: 52, height: 52, borderRadius: '16px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
                position: 'relative', zIndex: 1,
              }}>
                <LogIn size={22} color="white" strokeWidth={2} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 600, fontSize: '1.05rem',
                  color: '#0B0F19', letterSpacing: '-0.01em',
                  marginBottom: '6px',
                  overflow: 'visible',
                  paddingRight: '0.05em',
                }}>
                  J&apos;ai déjà un compte
                </div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.55,
                }}>
                  Se connecter et réserver directement
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: '#7c3aed', fontWeight: 600, fontSize: '0.82rem',
                fontFamily: "'DM Sans', sans-serif",
                position: 'relative', zIndex: 1,
              }}>
                Connexion <ArrowRight size={14} strokeWidth={2.5} />
              </div>
            </Link>

            {/* ── SIGN UP ── */}
            <Link href={signUpHref} className="choice-card" style={{ background: 'rgba(255,255,255,0.72)' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(236,72,153,0.08) 100%)',
                border: '1.5px solid rgba(124,58,237,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1,
              }}>
                <UserPlus size={22} color="#7c3aed" strokeWidth={2} />
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 600, fontSize: '1.05rem',
                  color: '#0B0F19', letterSpacing: '-0.01em',
                  marginBottom: '6px',
                  overflow: 'visible',
                  paddingRight: '0.05em',
                }}>
                  Je suis nouveau
                </div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.55,
                }}>
                  Créer un compte gratuit en 30 secondes
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: '#7c3aed', fontWeight: 600, fontSize: '0.82rem',
                fontFamily: "'DM Sans', sans-serif",
                position: 'relative', zIndex: 1,
              }}>
                S&apos;inscrire gratuitement <ArrowRight size={14} strokeWidth={2.5} />
              </div>
            </Link>
          </motion.div>

          {/* ── TRUST SIGNALS ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 } as Transition}
            style={{
              display: 'flex', alignItems: 'center', gap: '1.5rem',
              flexWrap: 'wrap', justifyContent: 'center',
            }}
          >
            {[
              { icon: Star, text: 'Gratuit pour les clients' },
              { icon: Calendar, text: 'Réservation en 30 sec' },
              { icon: Sparkles, text: 'Accès à tous les pros' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.72rem', fontWeight: 500, color: '#9CA3AF',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <Icon size={12} strokeWidth={2} color="#7c3aed" />
                {text}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── PRO CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 } as Transition}
          style={{
            position: 'fixed', bottom: '2rem', left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0.6rem 1.25rem',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '100px',
            fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif",
            color: '#9CA3AF',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            Vous êtes un professionnel ?
            <Link href="/sign-up" style={{
              color: '#7c3aed', fontWeight: 700, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              Rejoindre CalendaPro <ArrowRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
        </motion.div>
      </main>
    </>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function AuthChoicePage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F7F5F0', minHeight: '100vh' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>
          Chargement…
        </div>
      }>
        <AuthChoiceInner />
      </Suspense>
    </div>
  )
}
