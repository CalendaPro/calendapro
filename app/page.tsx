'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'

// ─── Scroll-reveal shorthand (whileInView + viewport once)
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] },
} as const

// ─── GLOBAL KEYFRAMES + RESPONSIVE CSS ────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; }

      @keyframes tickerLeft  { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
      @keyframes tickerRight { from { transform: translateX(-50%); } to { transform: translateX(0);    } }
      @keyframes pulseDot    { 0%,100% { transform:scale(1);   opacity:.8; } 50% { transform:scale(2.4); opacity:.15; } }

      /* ── layout helpers ── */
      .cp-nav-links    { display: flex; gap: 32px; align-items: center; }
      .cp-stat-border  { border-right: 1px solid #E5E7EB; }
      .cp-stat-row     { display: flex; align-items: stretch; }
      .cp-met-grid     { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
      .cp-ben-grid     { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .cp-ben-a        { grid-row: span 2; }
      .cp-ben-d        { grid-column: span 2; }
      .cp-ba-grid      { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px; margin: 0 auto; }
      .cp-test-grid    { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; align-items: start; }
      .cp-price-grid   { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; align-items: center; }
      .cp-foot-grid    { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 60px; }

      @media (max-width: 900px) {
        .cp-met-grid  { grid-template-columns: 1fr; gap: 40px; }
        .cp-ben-grid  { grid-template-columns: 1fr; }
        .cp-ben-a     { grid-row: span 1; }
        .cp-ben-d     { grid-column: span 1; }
      }
      @media (max-width: 768px) {
        .cp-nav-links   { display: none; }
        .cp-stat-row    { flex-direction: column; }
        .cp-stat-border { border-right: none; border-bottom: 1px solid #E5E7EB; }
        .cp-ba-grid     { grid-template-columns: 1fr; }
        .cp-test-grid   { grid-template-columns: 1fr; }
        .cp-price-grid  { grid-template-columns: 1fr; }
        .cp-foot-grid   { grid-template-columns: 1fr 1fr; gap: 24px; }
      }
      @media (max-width: 480px) {
        .cp-foot-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  )
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const G = 'linear-gradient(135deg,#7C3AED,#EC4899)'
const FONT = 'Inter,-apple-system,BlinkMacSystemFont,sans-serif'

// ─── TINY HELPERS ─────────────────────────────────────────────────────────────
function Grad({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {children}
    </span>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: '100px', padding: '6px 16px', fontSize: '12px', fontWeight: 600, color: '#7C3AED', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '24px' }}>
      {children}
    </div>
  )
}

function Chk({ color = '#7C3AED' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function Xmark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const W = { maxWidth: '1140px', margin: '0 auto' }
const PAD = 'clamp(20px,5vw,60px)'

// ═══════════════════════════════════════════════════════════════════════════════
// §1 — NAVBAR
// ═══════════════════════════════════════════════════════════════════════════════
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `0 ${PAD}`,
      background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? '#F3F4F6' : 'transparent'}`,
      transition: 'all 300ms ease',
      fontFamily: FONT,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1px' }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: '#0A0A0A', letterSpacing: '-0.02em' }}>Calenda</span>
        <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em', background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pro</span>
      </Link>

      {/* Nav links */}
      <div className="cp-nav-links">
        {['Fonctionnalités', 'Tarifs', 'Marketplace'].map(l => (
          <Link key={l} href="#" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none', fontWeight: 500, transition: 'color 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0A' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}>{l}</Link>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Link href="/login" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none', fontWeight: 500, transition: 'color 200ms' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0A' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}>Se connecter</Link>
        <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', height: '38px', padding: '0 20px', borderRadius: '100px', background: G, color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(124,58,237,0.3)', transition: 'opacity 150ms, transform 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}>Commencer</Link>
      </div>
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §2 — HERO
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardMockup() {
  const appts = [
    { col: 0, time: '9h00',  name: 'Marie L.',  v: true  },
    { col: 1, time: '10h30', name: 'Karim D.',  v: false },
    { col: 2, time: '14h00', name: 'Sophie B.', v: true  },
    { col: 3, time: '11h00', name: 'Thomas G.', v: false },
    { col: 4, time: '16h00', name: 'Lucas P.',  v: true  },
  ]
  const stats = [
 { t: "8 RDV aujourd'hui", bg: '#F3F0FF', c: '#7C3AED', i: '' },
 { t: '+245€ ce mois', bg: '#FDF2F8', c: '#EC4899', i: '' },
 { t: '0 no-show', bg: '#F0FDF4', c: '#10B981', i: '' },
 { t: '3 nouveaux clients', bg: '#F3F0FF', c: '#7C3AED', i: '' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ marginTop: '64px', maxWidth: '920px', marginLeft: 'auto', marginRight: 'auto', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 0 0 1px rgba(0,0,0,.04),0 32px 64px -12px rgba(0,0,0,.14),0 16px 32px -8px rgba(0,0,0,.08)', overflow: 'hidden' }}>
      {/* macOS bar */}
      <div style={{ background: '#F9FAFB', height: '40px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['#FF5F57', '#FFBD2E', '#28C840'].map(c => <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />)}
        </div>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>CalendaPro — Dashboard</span>
      </div>
      {/* Body */}
      <div style={{ background: '#fff', padding: '24px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
          {stats.map(s => (
            <div key={s.t} style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: s.c, fontWeight: 700, flexShrink: 0 }}>{s.i}</div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3 }}>{s.t}</span>
            </div>
          ))}
        </div>
        {/* Calendar */}
        <div style={{ border: '1px solid #F3F4F6', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', background: '#FAFAF9', borderBottom: '1px solid #F3F4F6' }}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(d => (
              <div key={d} style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textAlign: 'center', letterSpacing: '0.04em' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', padding: '12px', gap: '8px', background: '#fff', minHeight: '90px' }}>
            {[0, 1, 2, 3, 4].map(i => {
              const a = appts.find(x => x.col === i)
              return (
                <div key={i}>
                  {a && (
                    <div style={{ borderRadius: '6px', padding: '6px 8px', background: a.v ? '#EDE9FE' : '#FCE7F3', color: a.v ? '#7C3AED' : '#EC4899', fontSize: '11px', fontWeight: 500, lineHeight: 1.4 }}>
                      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>{a.time}</div>
                      {a.name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HeroSection() {
  return (
    <section style={{ padding: `140px ${PAD} 80px`, textAlign: 'center', fontFamily: FONT }}>
      {/* Badge */}
      <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, color: '#7C3AED' }}>
          <span style={{ fontSize: '8px' }}>●</span>
          Bêta ouverte — Rejoignez les premiers
        </div>
      </motion.div>

      {/* Title — no opacity:0 initial so always readable */}
      <motion.h1 initial={{ y: 24 }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ fontSize: 'clamp(60px,8vw,100px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.92, color: '#0A0A0A', margin: '0 0 4px' }}>
        Vos rendez-vous,
      </motion.h1>
      <motion.h1 initial={{ y: 24 }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ fontSize: 'clamp(60px,8vw,100px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.92, color: '#0A0A0A', margin: '0 0 28px' }}>
        enfin <Grad>maîtrisés.</Grad>
      </motion.h1>

      {/* Subtitle */}
      <p style={{ fontSize: '18px', lineHeight: 1.75, color: '#6B7280', maxWidth: '520px', margin: '0 auto 40px' }}>
        Réservations automatiques, zéro no-show, nouveaux clients — depuis un seul endroit.
      </p>

      {/* Buttons */}
      <motion.div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/sign-up"
          style={{ display: 'inline-flex', alignItems: 'center', height: '52px', padding: '0 28px', borderRadius: '100px', background: G, color: '#fff', fontSize: '16px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 8px 24px rgba(124,58,237,0.25)', transition: 'transform 150ms, box-shadow 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.25)' }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}>
          Démarrer gratuitement →
        </Link>
        <Link href="#demo"
          style={{ display: 'inline-flex', alignItems: 'center', height: '52px', padding: '0 28px', borderRadius: '100px', background: '#fff', border: '1.5px solid #E5E7EB', color: '#0A0A0A', fontSize: '16px', fontWeight: 500, textDecoration: 'none', transition: 'border-color 150ms, color 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#0A0A0A' }}>
          Voir une démo
        </Link>
      </motion.div>

      {/* Micro-proof */}
      <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '20px' }}>
        Gratuit pour commencer · Sans carte bancaire · Annulation à tout moment
      </p>

      <DashboardMockup />
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §3 — TICKER
// ═══════════════════════════════════════════════════════════════════════════════
function TickerRow({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const content = items.map((item, i) => (
    <span key={i} style={{ paddingRight: '8px' }}>
      <span style={{ color: '#7C3AED' }}>·</span>{' '}{item}{' '}
    </span>
  ))
  return (
    <div style={{ overflow: 'hidden', padding: '5px 0' }}>
      <div style={{ display: 'inline-flex', whiteSpace: 'nowrap', animation: `${reverse ? 'tickerRight' : 'tickerLeft'} 28s linear infinite`, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>
        {content}{content}
      </div>
    </div>
  )
}

function TickerSection() {
  return (
    <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', background: '#fff', padding: '18px 0', overflow: 'hidden' }}>
      <TickerRow items={['BARBIERS', 'COACHS', 'PHOTOGRAPHES', 'TATOUEURS', 'ESTHETICIENNES', 'CONSULTANTS', 'KINESITHERAPEUTES', 'THERAPEUTES', 'ARTISTES', 'FREELANCES']} />
      <TickerRow items={['RESERVATION EN LIGNE', 'ZERO NO-SHOW', 'RAPPELS SMS', 'PAIEMENT INTEGRE', 'MARKETPLACE', 'AGENDA INTELLIGENT', 'ACOMPTE AUTOMATIQUE', 'MINI-SITE PERSO']} reverse />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §4 — STATS
// ═══════════════════════════════════════════════════════════════════════════════
function useCountUp(target: number, duration: number, go: boolean) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!go) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [go, target, duration])
  return v
}

function StatCol({ prefix = '', target, suffix = '', label, last }: { prefix?: string; target: number; suffix?: string; label: string; last?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const v = useCountUp(target, 1600, inView)
  return (
    <div ref={ref} className={last ? '' : 'cp-stat-border'}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(56px,7vw,80px)', fontWeight: 900, lineHeight: 1, background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '12px' }}>
        {prefix}{v}{suffix}
      </div>
      <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '200px', lineHeight: 1.6, margin: 0 }}>{label}</p>
    </div>
  )
}

function StatsSection() {
  return (
    <section style={{ background: '#FAFAF9', padding: '100px 0', fontFamily: FONT }}>
      <div style={{ ...W, padding: `0 ${PAD}` }}>
        <div className="cp-stat-row">
          <StatCol target={300} suffix="€" label="perdus en moyenne chaque mois à cause des no-shows" />
          <StatCol target={98} suffix="%" label="de taux d'ouverture des rappels SMS automatiques" />
          <StatCol target={5} suffix=" min" label="pour configurer votre page de réservation en ligne" last />
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §5 — MÉTIERS — preview components
// ═══════════════════════════════════════════════════════════════════════════════
function PrevBarber() {
  return (
    <div style={{ background: '#F3F4F6', borderRadius: '16px', padding: '16px', marginTop: '20px' }}>
      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rappel SMS</div>
      <div style={{ background: '#fff', borderRadius: '14px 14px 14px 4px', padding: '12px 16px', fontSize: '13px', color: '#0A0A0A', lineHeight: 1.5, maxWidth: '85%', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: '8px' }}>
        Rappel&nbsp;: Votre coupe chez Kevin&apos;s Barber est demain à 14h30. Répondez STOP pour annuler.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
 <div style={{ background: G, borderRadius: '14px 14px 4px 14px', padding: '10px 16px', fontSize: '13px', color: '#fff', fontWeight: 600 }}>Confirmé </div>
      </div>
    </div>
  )
}

function PrevPhoto() {
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0A', marginBottom: '6px' }}>Shooting portrait — Sarah M.</div>
      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>Samedi 12 mai, 10h00</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ background: '#F0FDF4', color: '#10B981', border: '1px solid #BBF7D0', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', fontWeight: 600 }}>Acompte reçu — 75€</span>
        <span style={{ background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', fontWeight: 600 }}>Brief envoyé</span>
      </div>
    </div>
  )
}

function PrevCoach() {
  const slots = [
    { d: 'Lun', t: '9h00',  n: 'Séance coaching',  v: true  },
    { d: 'Mar', t: '14h00', n: 'Bilan mensuel',     v: false },
    { d: 'Jeu', t: '11h30', n: 'Atelier groupe',    v: true  },
  ]
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Semaine du 5 mai — 11 séances</div>
      {slots.map(s => (
        <div key={s.d} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', padding: '8px 12px', background: s.v ? '#EDE9FE' : '#FCE7F3', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', width: '28px' }}>{s.d}</span>
          <span style={{ fontSize: '11px', color: '#9CA3AF', width: '32px' }}>{s.t}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: s.v ? '#7C3AED' : '#EC4899' }}>{s.n}</span>
        </div>
      ))}
    </div>
  )
}

function PrevTattoo() {
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0A', marginBottom: '4px' }}>Sleeve japonais — Marco D.</div>
      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Durée : 4h — Vendredi 10 mai, 13h</div>
      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '14px' }}>Acompte 50€ encaissé via Stripe</div>
 <span style={{ background: '#F0FDF4', color: '#10B981', border: '1px solid #BBF7D0', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', fontWeight: 600 }}> Confirmé</span>
    </div>
  )
}

function PrevKine() {
  const patients = [
    { t: '09h00', n: 'Marie L.',  s: 'Séance dos',      alt: false },
    { t: '10h30', n: 'Karim D.', s: 'Suivi genou',     alt: true  },
    { t: '14h00', n: 'Sophie B.',s: 'Première visite', alt: false },
  ]
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aujourd&apos;hui</div>
      {patients.map((p, idx) => (
        <div key={p.t} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: idx < 2 ? '1px solid #F3F4F6' : 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: p.alt ? '#FCE7F3' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: p.alt ? '#EC4899' : '#7C3AED', flexShrink: 0 }}>
            {p.n.split(' ').map(x => x[0]).join('')}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0A' }}>{p.t} — {p.n}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{p.s}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PrevEsthe() {
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0A', marginBottom: '12px' }}>Mai 2026</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>Taux de remplissage</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>87%</span>
      </div>
      <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '100px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ width: '87%', height: '100%', background: 'linear-gradient(90deg,#7C3AED,#EC4899)', borderRadius: '100px' }} />
      </div>
      <div style={{ fontSize: '13px', color: '#6B7280' }}>42 soins réalisés · 6 nouveaux clients</div>
    </div>
  )
}

function PrevProf() {
  const cours = [
    { m: 'Maths',    e: 'Lucas', h: '18h', v: true  },
    { m: 'Français', e: 'Emma',  h: '17h', v: false },
    { m: 'Physique', e: 'Tom',   h: '19h', v: true  },
  ]
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
      {cours.map(c => (
        <div key={c.m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: c.v ? '#F3F0FF' : '#FDF2F8', borderRadius: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: c.v ? '#7C3AED' : '#EC4899' }}>{c.m} — {c.e}, {c.h}</span>
          <span style={{ background: '#F0FDF4', color: '#10B981', borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>Payé</span>
        </div>
      ))}
    </div>
  )
}

function PrevFreelance() {
  const opts = [
    { l: '30 min',  s: 'Découverte',  v: true  },
    { l: '60 min',  s: 'Consultation', v: false },
    { l: '120 min', s: 'Workshop',    v: true  },
  ]
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0A', marginBottom: '12px' }}>Réservez un appel avec Alex D.</div>
      {opts.map(o => (
        <div key={o.l} style={{ border: `1.5px solid ${o.v ? '#7C3AED' : '#EC4899'}`, borderRadius: '8px', padding: '10px 16px', background: o.v ? '#F3F0FF' : '#FDF2F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: o.v ? '#7C3AED' : '#EC4899' }}>{o.l}</span>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{o.s}</span>
        </div>
      ))}
    </div>
  )
}

interface MData {
  name: string
  title: string
  sub: string
  stat: string
  statLabel: string
  features: string[]
  preview: React.ReactNode
}

const METIERS: MData[] = [
  { name: 'Barbier / Coiffeur',     title: 'Pour les barbiers',        sub: 'Zéro lapin, agenda toujours plein.',           stat: '320€',  statLabel: 'récupérés en moyenne par mois',              features: ['Acompte automatique à la réservation', 'Rappel SMS 2h avant chaque coupe', 'Page publique avec vos services et tarifs'],               preview: <PrevBarber /> },
  { name: 'Photographe',             title: 'Pour les photographes',    sub: 'Gérez shootings et acomptes sans effort.',     stat: '100%',  statLabel: 'des séances sécurisées par acompte',         features: ['Acompte de 30-50% à la réservation', 'Rappels automatiques J-7 et J-1', 'Brief automatique envoyé après réservation'],             preview: <PrevPhoto /> },
  { name: 'Coach / Consultant',      title: 'Pour les coachs',          sub: "Plus de séances, moins d'administration.",     stat: '4h',    statLabel: 'gagnées par semaine en gestion',             features: ['Lien de réservation à partager partout', 'Synchro Google Calendar automatique', 'Rappels email personnalisés'],                           preview: <PrevCoach /> },
  { name: 'Tatoueur',                title: 'Pour les tatoueurs',       sub: 'Acomptes, rappels, zéro complication.',        stat: '0',     statLabel: 'rendez-vous manqués ce mois',                features: ['Acompte obligatoire configurable', 'Formulaire pré-rempli des attentes client', 'Rappel photo du projet J-2'],                            preview: <PrevTattoo /> },
  { name: 'Kiné / Thérapeute',       title: 'Pour les kinés',           sub: 'Agenda optimisé, patients fidélisés.',         stat: '23%',   statLabel: 'de patients supplémentaires',                features: ['Réservation en ligne 24h/24', 'Rappels avant chaque séance', 'Historique patient centralisé'],                                         preview: <PrevKine /> },
  { name: 'Esthéticienne',           title: 'Pour les esthéticiennes',  sub: 'Votre salon toujours complet.',                stat: '40%',   statLabel: 'de réservations en dehors des heures',       features: ['Réservations la nuit et le week-end', 'Rappels WhatsApp avant chaque soin', 'Marketplace pour nouveaux clients'],                    preview: <PrevEsthe /> },
  { name: 'Professeur particulier',  title: 'Pour les professeurs',     sub: 'Cours planifiés, paiements sécurisés.',        stat: '100%',  statLabel: "des cours payés à l'avance",                 features: ['Paiement au moment de la réservation', 'Cours récurrents hebdomadaires', 'Rappels automatiques aux élèves'],                          preview: <PrevProf /> },
  { name: 'Freelance',               title: 'Pour les freelances',      sub: 'Vos calls organisés, vos clients satisfaits.', stat: '2x',    statLabel: 'plus de calls honorés avec rappels',         features: ['Lien de réservation dans votre signature email', 'Sélection de durée : 30min, 1h, 2h', 'Résumé automatique après chaque call'],      preview: <PrevFreelance /> },
]

function MetiersSection() {
  const [sel, setSel] = useState(0)
  const [paused, setPaused] = useState(false)
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advance = useCallback(() => setSel(p => (p + 1) % METIERS.length), [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(advance, 2500)
    return () => clearInterval(id)
  }, [paused, advance])

  const m = METIERS[sel]

  return (
    <section style={{ background: '#fff', padding: `140px ${PAD}`, fontFamily: FONT }}>
      <div style={{ ...W }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <Pill>Conçu pour vous</Pill>
          <h2 style={{ fontSize: 'clamp(40px,5vw,68px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#0A0A0A', margin: 0 }}>
            Quel que soit votre métier,<br />
            <Grad>CalendaPro s&apos;adapte.</Grad>
          </h2>
        </div>

        {/* Two columns */}
        <div className="cp-met-grid">
          {/* List */}
          <div
            onMouseEnter={() => { setPaused(true); if (pauseRef.current) clearTimeout(pauseRef.current) }}
            onMouseLeave={() => { if (pauseRef.current) clearTimeout(pauseRef.current); pauseRef.current = setTimeout(() => setPaused(false), 5000) }}>
            {METIERS.map((m2, i) => (
              <div key={m2.name} onClick={() => setSel(i)} style={{
                height: '64px', display: 'flex', alignItems: 'center',
                paddingLeft: sel === i ? '28px' : '20px',
                borderLeft: `2px solid ${sel === i ? '#7C3AED' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 250ms ease',
                fontSize: sel === i ? '22px' : '18px',
                fontWeight: sel === i ? 700 : 500,
                color: sel === i ? '#0A0A0A' : '#9CA3AF',
              }}>
                {m2.name}
              </div>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div key={sel}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '40px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 8px' }}>{m.title}</h3>
              <p style={{ fontSize: '16px', color: '#6B7280', margin: '0 0 24px' }}>{m.sub}</p>
              <div style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1, background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '4px' }}>{m.stat}</div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{m.statLabel}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {m.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ marginTop: '2px' }}><Chk /></div>
                    <span style={{ fontSize: '15px', color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>
              {m.preview}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §6 — PROBLÈME
// ═══════════════════════════════════════════════════════════════════════════════
function ProblemSection() {
  return (
    <section style={{ background: '#F9F8FF', padding: `140px ${PAD}`, textAlign: 'center', fontFamily: FONT }}>
      <motion.div {...fadeUp}>
        <Pill>Le problème</Pill>
        <h2 style={{ fontSize: 'clamp(40px,5vw,68px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#0A0A0A', margin: '0 auto 32px', maxWidth: '800px' }}>
          Chaque lapin vous coûte <Grad>de l&apos;argent que vous</Grad> ne récupérerez jamais.
        </h2>
        <p style={{ fontSize: '20px', lineHeight: 1.8, color: '#4B5563', maxWidth: '600px', margin: '0 auto' }}>
          Un client qui ne se présente pas, c&apos;est un créneau vide, une heure perdue, et entre 30 et 150€ envolés. Dix fois par mois, c&apos;est jusqu&apos;à 1&nbsp;500€ que votre activité absorbe en silence. CalendaPro règle ce problème avant qu&apos;il arrive.
        </p>
      </motion.div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §7 — BENTO FEATURES
// ═══════════════════════════════════════════════════════════════════════════════
function BCard({ tag, title, text, className, children }: { tag: string; title: string; text: string; className?: string; children?: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <div className={className}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#fff', border: `1px solid ${hov ? '#7C3AED' : '#E5E7EB'}`, borderRadius: '20px', padding: '32px', transition: 'border-color 250ms, box-shadow 250ms', boxShadow: hov ? '0 8px 32px rgba(124,58,237,0.08)' : 'none' }}>
      <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#7C3AED', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#F3F0FF', padding: '4px 12px', borderRadius: '100px', marginBottom: '16px' }}>{tag}</div>
      <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0A0A0A', margin: '0 0 10px', letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{text}</p>
      {children}
    </div>
  )
}

function BentoSection() {
  return (
    <section style={{ background: '#FAFAF9', padding: `140px ${PAD}`, fontFamily: FONT }}>
      <div style={{ ...W }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: 'clamp(40px,5vw,68px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0A0A0A', margin: '0 0 8px' }}>Tout ce dont vous avez besoin.</h2>
          <p style={{ fontSize: '20px', color: '#6B7280', margin: 0 }}>Rien de superflu.</p>
        </motion.div>

        <div className="cp-ben-grid">
          {/* A — row span 2 */}
          <BCard tag="Agenda" title="Votre calendrier, toujours à jour." text="Synchronisation Google Calendar, détection des conflits, vue semaine et jour." className="cp-ben-a">
            <div style={{ marginTop: '24px', border: '1px solid #F3F4F6', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', background: '#FAFAF9', borderBottom: '1px solid #F3F4F6' }}>
                {['L', 'M', 'M', 'J', 'V'].map((d, i) => <div key={i} style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#9CA3AF' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '4px', padding: '8px', background: '#fff', minHeight: '70px' }}>
                {[
                  { n: 'Marie L.',  v: true  },
                  { n: 'Karim D.', v: false },
                  { n: 'Sophie B.',v: true  },
                  { n: 'Thomas G.',v: false },
                  { n: null,        v: false },
                ].map((s, i) => (
                  <div key={i}>{s.n && <div style={{ borderRadius: '6px', padding: '4px 6px', background: s.v ? '#EDE9FE' : '#FCE7F3', color: s.v ? '#7C3AED' : '#EC4899', fontSize: '10px', fontWeight: 500 }}>{s.n}</div>}</div>
                ))}
              </div>
              <div style={{ padding: '8px 12px', background: '#FAFAF9', borderTop: '1px solid #F3F4F6', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>8 RDV cette semaine</div>
            </div>
          </BCard>

          {/* B */}
          <BCard tag="Rappels SMS" title="Divisez vos no-shows par 4." text="Rappels automatiques 24h et 1h avant.">
            <div style={{ marginTop: '24px', background: '#F3F4F6', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#fff', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: '12px', color: '#0A0A0A', maxWidth: '80%', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>Rappel : votre RDV est demain à 14h30.</div>
 <div style={{ background: G, borderRadius: '12px 12px 4px 12px', padding: '10px 14px', fontSize: '12px', color: '#fff', fontWeight: 600, alignSelf: 'flex-end' }}>Confirmé </div>
            </div>
          </BCard>

          {/* C */}
          <BCard tag="Paiements" title="Encaissez dès la réservation." text="Acompte ou paiement intégral via Stripe.">
            <div style={{ marginTop: '24px', background: '#FAFAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0A0A0A', marginBottom: '12px' }}>45,00€</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', borderRadius: '8px', background: G, color: '#fff', fontSize: '14px', fontWeight: 600 }}>Payer et confirmer</div>
            </div>
          </BCard>

          {/* D — col span 2 */}
          <BCard tag="Marketplace" title="De nouveaux clients, sans publicité." text="Votre profil référencé dans notre annuaire géolocalisé. Des clients vous trouvent par ville et par spécialité." className="cp-ben-d">
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              {/* France SVG map */}
              <svg viewBox="0 0 100 110" width="120" height="132" fill="none" style={{ flexShrink: 0 }}>
                <path d="M35,5 L60,3 L75,15 L80,30 L75,45 L85,55 L80,70 L70,85 L55,95 L40,100 L25,90 L15,75 L10,60 L15,45 L10,30 L20,15 Z" fill="#F3F0FF" stroke="#DDD6FE" strokeWidth="2" />
                {([[45,35],[60,50],[35,55],[70,70],[50,75],[55,30]] as [number,number][]).map(([cx,cy], i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="5" fill="#7C3AED" opacity="0.2"
                      style={{ animation: `pulseDot ${1.5 + i * 0.18}s ease-in-out ${i * 0.12}s infinite` }} />
                    <circle cx={cx} cy={cy} r="2.5" fill="#7C3AED" />
                  </g>
                ))}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Visible dans votre ville', 'Filtrable par spécialité', 'Profil avec avis clients'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Chk /><span style={{ fontSize: '14px', color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </BCard>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §8 — BEFORE / AFTER
// ═══════════════════════════════════════════════════════════════════════════════
function BeforeAfterSection() {
  const before = ['SMS manuels pour confirmer chaque RDV', 'Clients qui oublient et ne préviennent pas', 'Paiements à la caisse, impayés impossibles', 'Agenda papier ou Excel impossible à partager', 'Aucun nouveau client sans publicité payante', 'Des heures perdues chaque semaine']
  const after  = ['Rappels automatiques sans lever le petit doigt', 'Acompte encaissé — les lapins disparaissent', 'Paiement Stripe dès la réservation', 'Page publique partageable en 1 lien', 'Marketplace pour être trouvé sans budget pub', 'Dashboard en temps réel, partout']
  return (
    <section style={{ background: '#fff', padding: `140px ${PAD}`, fontFamily: FONT }}>
      <div style={{ ...W }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: '64px' }}>
          <Pill>La différence</Pill>
          <h2 style={{ fontSize: 'clamp(40px,5vw,68px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0A0A0A', margin: 0 }}>Votre quotidien, avant et après.</h2>
        </motion.div>
        <div className="cp-ba-grid">
          {/* Before */}
          <div style={{ background: '#FFF7F7', border: '1px solid #FEE2E2', borderRadius: '20px', padding: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '28px' }}>Avant CalendaPro</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {before.map((item, i) => (
                <motion.div key={item}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ marginTop: '2px' }}><Xmark /></div>
                  <span style={{ fontSize: '15px', color: '#374151', lineHeight: 1.5 }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
          {/* After */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '20px', padding: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '28px' }}>Avec CalendaPro</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {after.map((item, i) => (
                <motion.div key={item}
                  initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ marginTop: '2px' }}><Chk color="#10B981" /></div>
                  <span style={{ fontSize: '15px', color: '#374151', lineHeight: 1.5 }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §9 — TÉMOIGNAGES
// ═══════════════════════════════════════════════════════════════════════════════
function TestimonialsSection() {
  const data = [
    { name: 'Thomas M.', role: 'Barbier — Lyon',       init: 'TM', grad: 'linear-gradient(135deg,#7C3AED,#EC4899)', pad: '32px', text: "Avant CalendaPro, je perdais en moyenne 4 rendez-vous par semaine. En un mois, j'ai récupéré plus de 400€ que je donnais aux lapins sans même m'en rendre compte." },
    { name: 'Camille R.', role: 'Coach — Paris',        init: 'CR', grad: 'linear-gradient(135deg,#EC4899,#F472B6)', pad: '40px', text: "Mes clients reçoivent un rappel automatique la veille et une heure avant. Plus personne n'oublie. Et moi je n'ai plus à passer 30 minutes par soir à envoyer des messages." },
    { name: 'Axel D.',    role: 'Tatoueur — Bordeaux', init: 'AD', grad: 'linear-gradient(135deg,#7C3AED,#A78BFA)', pad: '28px', text: "L'acompte automatique à la réservation a tout changé. Les gens réfléchissent à deux fois. Et quand ils viennent, c'est parce qu'ils sont vraiment engagés." },
  ]
  return (
    <section style={{ background: '#FAFAF9', padding: `140px ${PAD}`, fontFamily: FONT }}>
      <div style={{ ...W }}>
        <motion.h2 {...fadeUp}
          style={{ fontSize: 'clamp(40px,5vw,68px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0A0A0A', margin: '0 0 64px', textAlign: 'center' }}>
          Ils ont arrêté de perdre de l&apos;argent.
        </motion.h2>
        <div className="cp-test-grid">
          {data.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}
              style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', padding: t.pad, cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: t.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>{t.init}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#0A0A0A' }}>{t.name}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>{t.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '14px' }}>
 {''.split('').map((s, j) => <span key={j} style={{ color: '#FBBF24', fontSize: '16px' }}>{s}</span>)}
              </div>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#374151', margin: 0 }}>&ldquo;{t.text}&rdquo;</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §10 — PRICING
// ═══════════════════════════════════════════════════════════════════════════════
type CtaVariant = 'outline' | 'gradient' | 'violet'

interface Plan {
  name: string
  price: { m: string; a: string }
  sub: string
  features: string[]
  cta: string
  variant: CtaVariant
  badge: string | null
  hi: boolean
}

const PLANS: Plan[] = [
  { name: 'Starter',  price: { m: '0',  a: '0'  }, sub: 'Pour explorer',       variant: 'outline',   badge: null,              hi: false, cta: 'Commencer gratuitement', features: ['10 rendez-vous par mois','Page de réservation basique','Rappels email automatiques','Paiement sécurisé via Stripe','Support par email'] },
  { name: 'Premium',  price: { m: '19', a: '15' }, sub: 'Pour les actifs',      variant: 'gradient',  badge: 'Le plus populaire', hi: true,  cta: 'Commencer maintenant',   features: ['Rendez-vous illimités','Rappels SMS + Email + WhatsApp','Paiement intégré + acomptes','Mini-site personnalisé','Widget sur votre site existant','Marketplace CalendaPro','Support prioritaire'] },
  { name: 'Infinity', price: { m: '49', a: '39' }, sub: 'Pour aller plus loin', variant: 'violet',    badge: null,              hi: false, cta: 'Choisir Infinity',       features: ["Tout ce qu'inclut Premium",'Assistant IA (200 SMS/mois inclus)','Automatisations avancées','Priorité Marketplace','Sous-domaine personnalisé','Accès API complet'] },
]

function PricingSection() {
  const [annual, setAnnual] = useState(false)

  const ctaBase: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', borderRadius: '100px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', transition: 'all 200ms', border: 'none', cursor: 'pointer' }
  const ctaStyle: Record<CtaVariant, React.CSSProperties> = {
    gradient: { background: G, color: '#fff', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' },
    outline:  { border: '1.5px solid #E5E7EB', color: '#0A0A0A', background: 'transparent' },
    violet:   { border: '1.5px solid #7C3AED', color: '#7C3AED', background: 'transparent' },
  }

  return (
    <section style={{ background: '#FAFAF9', padding: `140px ${PAD}`, fontFamily: FONT }}>
      <div style={{ ...W }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: '64px' }}>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', background: '#F3F4F6', borderRadius: '100px', padding: '4px', gap: '4px', marginBottom: '40px' }}>
            {(['Mensuel', 'Annuel'] as const).map(l => {
              const active = annual ? l === 'Annuel' : l === 'Mensuel'
              return (
                <button key={l} onClick={() => setAnnual(l === 'Annuel')}
                  style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: active ? '#fff' : 'transparent', color: active ? '#0A0A0A' : '#6B7280', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {l}
                  {l === 'Annuel' && <span style={{ background: G, color: '#fff', borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>−20%</span>}
                </button>
              )
            })}
          </div>
          <h2 style={{ fontSize: 'clamp(40px,5vw,68px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0A0A0A', margin: '0 0 12px' }}>Des prix qui ont du sens.</h2>
          <p style={{ fontSize: '18px', color: '#6B7280', margin: 0 }}>Commencez gratuitement. Évoluez quand vous êtes prêt.</p>
        </motion.div>

        <div className="cp-price-grid">
          {PLANS.map((p, i) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ background: '#fff', border: p.hi ? '2px solid #7C3AED' : '1px solid #E5E7EB', borderRadius: '20px', padding: '40px', position: 'relative', transform: p.hi ? 'translateY(-8px)' : 'none', boxShadow: p.hi ? '0 0 0 4px #F3F0FF' : 'none' }}>
              {p.badge && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: G, color: '#fff', borderRadius: '100px', padding: '4px 16px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{p.badge}</div>
              )}
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0A0A0A', marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{p.sub}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: 'clamp(48px,6vw,60px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: '#0A0A0A' }}>{annual ? p.price.a : p.price.m}€</span>
                {p.name !== 'Starter' && <span style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>/mois</span>}
              </div>
              <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '24px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ marginTop: '2px' }}><Chk color={p.hi ? '#7C3AED' : '#6B7280'} /></div>
                    <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up" style={{ ...ctaBase, ...ctaStyle[p.variant] }}>{p.cta}</Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §11 — FAQ
// ═══════════════════════════════════════════════════════════════════════════════
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #F3F4F6' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '16px' }}>
        <span style={{ fontSize: '17px', fontWeight: 600, color: '#0A0A0A', lineHeight: 1.4 }}>{q}</span>
        <span style={{ flexShrink: 0, fontSize: '24px', lineHeight: 1, color: open ? '#7C3AED' : '#9CA3AF', display: 'inline-block', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms, color 200ms', fontWeight: 300 }}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }} style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: 1.7, margin: '0 0 24px', paddingRight: '40px' }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FAQSection() {
  const faqs = [
    { q: 'Est-ce vraiment gratuit pour commencer ?', a: 'Oui. Le plan Starter est gratuit sans limite de durée et sans carte bancaire requise. Vous pouvez tester CalendaPro aussi longtemps que vous le souhaitez.' },
    { q: 'Combien de temps pour tout configurer ?', a: "Moins de 5 minutes. Vous créez votre compte, ajoutez vos services, configurez vos disponibilités et partagez votre lien. C'est tout." },
    { q: 'Mes clients ont-ils besoin de créer un compte ?', a: "Non. Vos clients réservent directement depuis votre page sans créer de compte CalendaPro. Aucune friction pour eux." },
    { q: "Comment fonctionne l'acompte anti no-show ?", a: "Vous définissez un montant d'acompte lors de la configuration. Vos clients le paient via Stripe au moment de la réservation. Les fonds vous sont reversés directement, moins la commission CalendaPro pour les plans Starter." },
    { q: 'Puis-je annuler mon abonnement à tout moment ?', a: "Oui, sans préavis ni pénalité. Votre abonnement s'arrête à la fin de la période en cours et votre compte repasse en Starter automatiquement." },
    { q: 'CalendaPro fonctionne pour quel type de métier ?', a: "Pour tous les indépendants qui gèrent des rendez-vous : barbiers, coachs, photographes, tatoueurs, kinés, esthéticiennes, consultants, professeurs particuliers, thérapeutes et bien d'autres." },
  ]
  return (
    <section style={{ background: '#fff', padding: `140px ${PAD}`, fontFamily: FONT }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <motion.h2 {...fadeUp}
          style={{ fontSize: 'clamp(40px,5vw,68px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0A0A0A', margin: '0 0 48px', textAlign: 'center' }}>
          Questions fréquentes.
        </motion.h2>
        {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §12 — CTA FINAL
// ═══════════════════════════════════════════════════════════════════════════════
function CTASection() {
  return (
    <section style={{ padding: `0 ${PAD}`, marginBottom: '100px', fontFamily: FONT }}>
      <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
        style={{ ...W, background: 'linear-gradient(135deg,#F9F8FF,#FDF4FF)', borderRadius: '24px', padding: '100px 60px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(40px,5vw,64px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#0A0A0A', margin: '0 0 16px' }}>Prêt à reprendre le contrôle&nbsp;?</h2>
        <p style={{ fontSize: '20px', color: '#6B7280', margin: '0 0 48px' }}>Rejoignez les indépendants français qui ont choisi de ne plus subir.</p>
        <Link href="/sign-up"
          style={{ display: 'inline-flex', alignItems: 'center', height: '60px', padding: '0 48px', borderRadius: '100px', background: G, color: '#fff', fontSize: '18px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 12px 32px rgba(124,58,237,0.35)', transition: 'transform 250ms, box-shadow 250ms' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.35)' }}>
          Démarrer gratuitement — c&apos;est gratuit
        </Link>
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '16px', margin: '16px 0 0' }}>Aucune carte bancaire requise</p>
      </motion.div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// §13 — FOOTER
// ═══════════════════════════════════════════════════════════════════════════════
function Footer() {
  const cols = [
    { title: 'Produit',       links: ['Fonctionnalités', 'Tarifs', 'Marketplace', 'Changelog'] },
    { title: 'Légal',         links: ['CGU', 'CGV', 'Confidentialité', 'Cookies'] },
    { title: 'Ressources',    links: ["Blog", "Centre d'aide", 'Contact', 'Statut'] },
    { title: 'Suivez-nous',   links: ['Instagram', 'TikTok', 'LinkedIn'] },
  ]
  return (
    <footer style={{ background: '#FAFAF9', borderTop: '1px solid #E5E7EB', padding: `80px ${PAD} 48px`, fontFamily: FONT }}>
      <div style={{ ...W }}>
        <div className="cp-foot-grid">
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#0A0A0A', letterSpacing: '-0.02em' }}>Calenda</span>
              <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em', background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pro</span>
            </div>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: 0, maxWidth: '220px' }}>L&apos;outil des indépendants français.</p>
          </div>
          {/* Link columns */}
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A', marginBottom: '16px' }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(l => (
                  <Link key={l} href="#" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none', transition: 'color 150ms' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0A' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}>{l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Bottom */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>© 2026 CalendaPro. Fait en France.</span>
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>contact.calendapro@gmail.com</span>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Page() {
  return (
    <div style={{ background: '#FAFAF9', fontFamily: FONT, color: '#0A0A0A' }}>
      <GlobalStyles />
      <Navbar />
      <main>
        <HeroSection />
        <TickerSection />
        <StatsSection />
        <MetiersSection />
        <ProblemSection />
        <BentoSection />
        <BeforeAfterSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
