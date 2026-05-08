'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { motion } from 'framer-motion'
import type { Variants, Transition } from 'framer-motion'

// ─── SVG ICONS ─────────────────────────────────────────────────────────────────
const Icons = {
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Bell: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Users: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Globe: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Store: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-6h16l1 6"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 9v12h14V9"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Code: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Scissors: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  ),
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Camera: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Laptop: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.37 20H3.63a1 1 0 0 1-.91-1.45L4 16"/>
    </svg>
  ),
  Heart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Palette: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  Briefcase: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Activity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Zap: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

// ─── GRADIENT MESH (Stripe-inspired) ──────────────────────────────────────────
function GradientMesh() {
  return (
    <div className="cp-gradient-mesh" aria-hidden="true">
      <div className="cp-orb cp-orb-1" />
      <div className="cp-orb cp-orb-2" />
      <div className="cp-orb cp-orb-3" />
    </div>
  )
}

// ─── HERO VISUAL ──────────────────────────────────────────────────────────────
function HeroVisual() {
  return (
    <motion.div
      className="cp-hero-visual"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cp-dashboard-mock">
        <div className="cp-mock-header">
          <div className="cp-mock-dots">
            <span /><span /><span />
          </div>
          <div className="cp-mock-url">app.calendapro.com/dashboard</div>
        </div>
        <div className="cp-mock-body">
          <div className="cp-mock-sidebar">
            <div className="cp-mock-nav-item cp-active" />
            <div className="cp-mock-nav-item" />
            <div className="cp-mock-nav-item" />
            <div className="cp-mock-nav-item" />
          </div>
          <div className="cp-mock-content">
            <div className="cp-mock-stat-row">
              <div className="cp-mock-stat">
                <div className="cp-mock-stat-label" />
                <div className="cp-mock-stat-value" style={{ width: '60%' }} />
              </div>
              <div className="cp-mock-stat">
                <div className="cp-mock-stat-label" />
                <div className="cp-mock-stat-value" style={{ width: '45%' }} />
              </div>
              <div className="cp-mock-stat">
                <div className="cp-mock-stat-label" />
                <div className="cp-mock-stat-value" style={{ width: '70%' }} />
              </div>
            </div>
            <div className="cp-mock-calendar">
              <div className="cp-mock-cal-header" />
              <div className="cp-mock-cal-grid">
                {Array.from({ length: 28 }, (_, i) => (
                  <div key={i} className={`cp-mock-cal-day${[3,7,12,15,22].includes(i) ? ' cp-booked' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="cp-float-card cp-float-1"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="cp-float-icon cp-float-icon-green">
          <Icons.Check />
        </div>
        <div>
          <div className="cp-float-title">Nouveau RDV</div>
          <div className="cp-float-sub">Marie D. - 14h30</div>
        </div>
      </motion.div>

      <motion.div
        className="cp-float-card cp-float-2"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <div className="cp-float-icon cp-float-icon-purple">
          <Icons.Bell />
        </div>
        <div>
          <div className="cp-float-title">Rappel envoy&eacute;</div>
          <div className="cp-float-sub">SMS + Email auto</div>
        </div>
      </motion.div>

      <motion.div
        className="cp-float-card cp-float-3"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <div className="cp-float-icon cp-float-icon-pink">
          <Icons.CreditCard />
        </div>
        <div>
          <div className="cp-float-title">+128,50 &euro;</div>
          <div className="cp-float-sub">Paiement re&ccedil;u</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'Fonctionnalit\u00e9s', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'T\u00e9moignages', href: '#testimonials' },
  ]

  return (
    <nav className={`cp-nav${scrolled ? ' cp-nav-scrolled' : ''}`}>
      <div className="cp-nav-inner">
        <BrandLogo />

        <div className="cp-nav-links">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} className="cp-nav-link">{l.label}</a>
          ))}
        </div>

        <div className="cp-nav-actions">
          <Link href="/sign-in" className="cp-btn-ghost">Se connecter</Link>
          <Link href="/onboarding" className="cp-btn-primary cp-btn-sm">
            Commencer gratuitement
            <Icons.Arrow />
          </Link>
        </div>

        <button
          className="cp-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          className="cp-mobile-menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {navLinks.map(l => (
            <a key={l.href} href={l.href} className="cp-mobile-link" onClick={() => setMobileOpen(false)}>{l.label}</a>
          ))}
          <div className="cp-mobile-actions">
            <Link href="/sign-in" className="cp-btn-ghost cp-btn-full">Se connecter</Link>
            <Link href="/onboarding" className="cp-btn-primary cp-btn-full">Commencer gratuitement</Link>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="cp-hero">
      <GradientMesh />
      <div className="cp-container">
        <div className="cp-hero-content">
          <motion.div
            className="cp-hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Icons.Sparkles />
            <span>Nouveau : CalendaPro Infinity avec IA</span>
          </motion.div>

          <motion.h1
            className="cp-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Votre agenda.{' '}
            <span className="cp-gradient-text">Votre business.</span>
            <br />
            Simplifi&eacute;.
          </motion.h1>

          <motion.p
            className="cp-hero-desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            CalendaPro automatise vos rendez-vous, paiements et rappels.
            Concentrez-vous sur votre m&eacute;tier, on g&egrave;re le reste.
          </motion.p>

          <motion.div
            className="cp-hero-ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/onboarding" className="cp-btn-primary cp-btn-lg">
              D&eacute;marrer gratuitement
              <Icons.Arrow />
            </Link>
            <a href="#features" className="cp-btn-outline cp-btn-lg">
              D&eacute;couvrir les fonctionnalit&eacute;s
            </a>
          </motion.div>

          <motion.div
            className="cp-hero-social-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="cp-avatars">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="cp-avatar" style={{ background: ['#7c3aed','#ec4899','#a78bfa','#f472b6','#c084fc'][i-1] }}>
                  {['M','S','A','L','P'][i-1]}
                </div>
              ))}
            </div>
            <div className="cp-social-text">
              <strong>2 500+</strong> professionnels nous font confiance
            </div>
          </motion.div>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}

// ─── TRUST BAR (Marquee) ──────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    'Calendrier intelligent',
    'Rappels automatiques',
    'Paiement en ligne',
    'CRM int\u00e9gr\u00e9',
    'Mini-site personnalis\u00e9',
    'Marketplace',
    'Statistiques',
    'Widget int\u00e9grable',
    'Assistant IA',
  ]

  return (
    <section className="cp-trust-bar">
      <div className="cp-marquee">
        <div className="cp-marquee-track">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="cp-marquee-item">
              <Icons.Check />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
const featureList = [
  { Icon: Icons.Calendar, title: 'Calendrier intelligent', desc: 'Synchronisation Google & Outlook, gestion des cr\u00e9neaux, d\u00e9tection des conflits en temps r\u00e9el.', span: 'large' },
  { Icon: Icons.Bell, title: 'Rappels automatiques', desc: 'Email, SMS et WhatsApp envoy\u00e9s automatiquement. R\u00e9duisez les no-shows de 65%.', span: 'normal' },
  { Icon: Icons.CreditCard, title: 'Paiement en ligne', desc: 'Acompte ou paiement complet via Stripe. Factures g\u00e9n\u00e9r\u00e9es automatiquement.', span: 'normal' },
  { Icon: Icons.Users, title: 'CRM client int\u00e9gr\u00e9', desc: 'Fiches clients, historique des RDV, notes et relances automatis\u00e9es.', span: 'normal' },
  { Icon: Icons.Globe, title: 'Mini-site personnalisable', desc: 'Votre page de booking branded en 2 minutes. URL personnalis\u00e9e incluse.', span: 'normal' },
  { Icon: Icons.Store, title: 'Marketplace CalendaPro', desc: 'Soyez trouv\u00e9 par de nouveaux clients. R\u00e9f\u00e9rencement par cat\u00e9gorie et localisation.', span: 'large' },
  { Icon: Icons.BarChart, title: 'Statistiques avanc\u00e9es', desc: 'CA mensuel, taux de remplissage, clients fid\u00e8les. Toutes les donn\u00e9es pour grandir.', span: 'normal' },
  { Icon: Icons.Code, title: "Widget d'int\u00e9gration", desc: 'Ajoutez un bouton de r\u00e9servation sur votre site existant en 2 lignes de code.', span: 'normal' },
  { Icon: Icons.Sparkles, title: 'CalendaPro Infinity', desc: 'Assistant IA, recommandations intelligentes et automatisations avanc\u00e9es. Bient\u00f4t disponible.', span: 'normal' },
]

function Features() {
  return (
    <section className="cp-features" id="features">
      <div className="cp-container">
        <motion.div
          className="cp-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="cp-section-tag">Fonctionnalit&eacute;s</span>
          <h2 className="cp-section-title">
            Tout ce qu&rsquo;il faut pour<br />
            <span className="cp-gradient-text">g&eacute;rer votre activit&eacute;</span>
          </h2>
          <p className="cp-section-desc">
            Un outil complet qui remplace votre agenda, votre CRM et votre solution de paiement.
          </p>
        </motion.div>

        <div className="cp-feature-grid">
          {featureList.map((f, i) => (
            <motion.div
              key={i}
              className={`cp-feature-card${f.span === 'large' ? ' cp-feature-large' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="cp-feature-icon">
                <f.Icon />
              </div>
              <h3 className="cp-feature-title">{f.title}</h3>
              <p className="cp-feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Cr\u00e9ez votre compte', desc: 'Inscription en 30 secondes. Configurez vos services, horaires et tarifs.', Icon: Icons.Zap },
    { num: '02', title: 'Partagez votre lien', desc: 'Envoyez votre page de r\u00e9servation ou int\u00e9grez le widget sur votre site.', Icon: Icons.Globe },
    { num: '03', title: 'Recevez des r\u00e9servations', desc: 'Vos clients r\u00e9servent en autonomie. Rappels et paiements automatis\u00e9s.', Icon: Icons.Calendar },
  ]

  return (
    <section className="cp-how-it-works">
      <div className="cp-container">
        <motion.div
          className="cp-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="cp-section-tag cp-tag-light">Comment &ccedil;a marche</span>
          <h2 className="cp-section-title cp-title-light">
            Op&eacute;rationnel en<br />
            <span className="cp-gradient-text">3 &eacute;tapes simples</span>
          </h2>
        </motion.div>

        <div className="cp-steps">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="cp-step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="cp-step-num">{step.num}</div>
              <div className="cp-step-icon">
                <step.Icon />
              </div>
              <h3 className="cp-step-title">{step.title}</h3>
              <p className="cp-step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FOR WHO ──────────────────────────────────────────────────────────────────
const professions = [
  { Icon: Icons.Scissors, label: 'Coiffeurs & Barbiers' },
  { Icon: Icons.Heart, label: 'Esth\u00e9ticiennes & Spas' },
  { Icon: Icons.Activity, label: 'Kin\u00e9s & Ost\u00e9opathes' },
  { Icon: Icons.Camera, label: 'Photographes' },
  { Icon: Icons.Laptop, label: 'Consultants & Coachs' },
  { Icon: Icons.Palette, label: 'Tatoueurs & Artistes' },
  { Icon: Icons.Briefcase, label: 'Avocats & Notaires' },
  { Icon: Icons.Target, label: 'Agences & Studios' },
]

function ForWho() {
  return (
    <section className="cp-for-who">
      <div className="cp-container">
        <motion.div
          className="cp-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="cp-section-tag">Pour qui ?</span>
          <h2 className="cp-section-title">
            Con&ccedil;u pour les<br />
            <span className="cp-gradient-text">professionnels exigeants</span>
          </h2>
          <p className="cp-section-desc">
            Quelle que soit votre activit&eacute;, CalendaPro s&rsquo;adapte &agrave; vos besoins.
          </p>
        </motion.div>

        <div className="cp-profession-grid">
          {professions.map((p, i) => (
            <motion.div
              key={i}
              className="cp-profession-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <div className="cp-profession-icon">
                <p.Icon />
              </div>
              <span className="cp-profession-label">{p.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Starter',
    price: '0',
    period: 'pour toujours',
    features: ['20 rendez-vous / mois', 'Page publique de r\u00e9servation', 'Rappels par email', 'Dashboard de base'],
    cta: 'Commencer gratuitement',
    href: '/onboarding',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '19',
    period: '/ mois',
    features: ['Rendez-vous illimit\u00e9s', 'SMS & WhatsApp (30/mois)', 'R\u00e9f\u00e9rencement Marketplace', "Widget d'int\u00e9gration", 'Statistiques avanc\u00e9es', 'Support prioritaire'],
    cta: 'Passer au Premium',
    href: '/onboarding',
    highlight: true,
  },
  {
    name: 'Infinity',
    price: '49',
    period: '/ mois',
    badge: 'IA',
    features: ['Tout Premium inclus', 'Assistant IA (200 SMS/mois)', 'Automatisations avanc\u00e9es', 'Priorit\u00e9 Marketplace', 'Sous-domaine personnalis\u00e9', 'Acc\u00e8s API'],
    cta: 'D\u00e9couvrir Infinity',
    href: '/onboarding',
    highlight: false,
  },
]

function Pricing() {
  return (
    <section className="cp-pricing" id="pricing">
      <div className="cp-container">
        <motion.div
          className="cp-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="cp-section-tag">Tarifs</span>
          <h2 className="cp-section-title">
            Des prix<br />
            <span className="cp-gradient-text">transparents et justes</span>
          </h2>
          <p className="cp-section-desc">
            Pas de frais cach&eacute;s. Commencez gratuitement, &eacute;voluez quand vous &ecirc;tes pr&ecirc;t.
          </p>
        </motion.div>

        <div className="cp-pricing-grid">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`cp-pricing-card${plan.highlight ? ' cp-pricing-highlight' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {plan.highlight && <div className="cp-pricing-badge-pop">Le plus populaire</div>}
              <div className="cp-pricing-header">
                <div className="cp-pricing-name">
                  {plan.name}
                  {plan.badge && <span className="cp-ai-badge">{plan.badge}</span>}
                </div>
                <div className="cp-pricing-price">
                  <span className="cp-price-currency">&euro;</span>
                  <span className="cp-price-amount">{plan.price}</span>
                  <span className="cp-price-period">{plan.period}</span>
                </div>
              </div>
              <ul className="cp-pricing-features">
                {plan.features.map((f, j) => (
                  <li key={j}>
                    <Icons.Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`cp-btn-pricing${plan.highlight ? ' cp-btn-primary' : ' cp-btn-outline'}`}
              >
                {plan.cta}
                <Icons.Arrow />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Sophie Martin',
    role: 'Coiffeuse \u00e0 Paris',
    text: "CalendaPro a r\u00e9volutionn\u00e9 mon quotidien. Mes clientes r\u00e9servent en ligne, re\u00e7oivent les rappels automatiquement et je n'ai plus de no-shows. Un gain de temps incroyable !",
    avatar: 'S',
    color: '#ec4899',
  },
  {
    name: 'Thomas Durand',
    role: 'Kin\u00e9sith\u00e9rapeute',
    text: "L'interface est claire et intuitive. En 5 minutes mon planning \u00e9tait en ligne. Le syst\u00e8me de paiement int\u00e9gr\u00e9 m'a permis d'augmenter mon CA de 25% en 3 mois.",
    avatar: 'T',
    color: '#7c3aed',
  },
  {
    name: 'Am\u00e9lie Roux',
    role: 'Photographe freelance',
    text: "Le mini-site personnalis\u00e9 est superbe, mes clients adorent. Et la marketplace m'a apport\u00e9 15 nouveaux clients le premier mois. Je recommande \u00e0 100% !",
    avatar: 'A',
    color: '#a78bfa',
  },
]

function Testimonials() {
  return (
    <section className="cp-testimonials" id="testimonials">
      <div className="cp-container">
        <motion.div
          className="cp-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="cp-section-tag">T&eacute;moignages</span>
          <h2 className="cp-section-title">
            Ils nous font<br />
            <span className="cp-gradient-text">confiance au quotidien</span>
          </h2>
        </motion.div>

        <div className="cp-testimonial-grid">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="cp-testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="cp-stars">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#facc15" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="cp-testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="cp-testimonial-author">
                <div className="cp-testimonial-avatar" style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="cp-testimonial-name">{t.name}</div>
                  <div className="cp-testimonial-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA FINAL ────────────────────────────────────────────────────────────────
function CtaFinal() {
  return (
    <section className="cp-cta-final">
      <div className="cp-container">
        <motion.div
          className="cp-cta-inner"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="cp-cta-title">
            Pr&ecirc;t &agrave; transformer<br />
            <span className="cp-gradient-text">votre gestion de rendez-vous ?</span>
          </h2>
          <p className="cp-cta-desc">
            Rejoignez plus de 2 500 professionnels qui ont simplifi&eacute; leur quotidien avec CalendaPro.
          </p>
          <div className="cp-cta-actions">
            <Link href="/onboarding" className="cp-btn-primary cp-btn-lg cp-btn-glow">
              D&eacute;marrer gratuitement
              <Icons.Arrow />
            </Link>
          </div>
          <p className="cp-cta-note">Gratuit pour toujours &bull; Aucune carte requise &bull; Configuration en 2 min</p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const columns = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalit\u00e9s', href: '#features' },
        { label: 'Tarifs', href: '#pricing' },
        { label: 'Marketplace', href: '/marketplace' },
        { label: 'Int\u00e9grations', href: '#features' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Centre d\u2019aide', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'API Docs', href: '#' },
        { label: 'Statut', href: '#' },
      ],
    },
    {
      title: 'L\u00e9gal',
      links: [
        { label: 'CGU', href: '/cgu' },
        { label: 'Confidentialit\u00e9', href: '/privacy' },
        { label: 'Mentions l\u00e9gales', href: '/mentions-legales' },
        { label: 'Cookies', href: '#' },
      ],
    },
  ]

  return (
    <footer className="cp-footer">
      <div className="cp-container">
        <div className="cp-footer-grid">
          <div className="cp-footer-brand">
            <BrandLogo />
            <p className="cp-footer-tagline">
              La solution tout-en-un pour g&eacute;rer vos rendez-vous comme un pro.
            </p>
          </div>
          {columns.map((col, i) => (
            <div key={i} className="cp-footer-col">
              <h4 className="cp-footer-col-title">{col.title}</h4>
              <ul>
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href={link.href} className="cp-footer-link">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="cp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} CalendaPro. Tous droits r&eacute;serv&eacute;s.</p>
        </div>
      </div>
    </footer>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const landingCSS = `
:root {
  --cp-primary: #7c3aed;
  --cp-primary-light: #a78bfa;
  --cp-primary-dark: #5b21b6;
  --cp-accent: #ec4899;
  --cp-navy: #0a1628;
  --cp-navy-light: #0f1f3d;
  --cp-surface: #ffffff;
  --cp-surface-alt: #f8f7f4;
  --cp-text: #0f172a;
  --cp-text-secondary: #64748b;
  --cp-text-muted: #94a3b8;
  --cp-border: rgba(0,0,0,0.06);
  --cp-border-hover: rgba(124,58,237,0.2);
  --cp-radius-sm: 8px;
  --cp-radius-md: 14px;
  --cp-radius-lg: 20px;
  --cp-radius-xl: 28px;
  --cp-radius-full: 100px;
  --cp-shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --cp-shadow-md: 0 4px 16px rgba(0,0,0,0.06);
  --cp-shadow-lg: 0 12px 40px rgba(0,0,0,0.08);
  --cp-shadow-xl: 0 24px 64px rgba(0,0,0,0.1);
  --cp-shadow-glow: 0 8px 32px rgba(124,58,237,0.25);
  --cp-container: 1200px;
  --cp-font-display: 'Clash Display', 'Syne', -apple-system, BlinkMacSystemFont, sans-serif;
  --cp-font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
.cp-landing {
  font-family: var(--cp-font-body);
  color: var(--cp-text);
  background: var(--cp-surface);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
.cp-container {
  max-width: var(--cp-container);
  margin: 0 auto;
  padding: 0 24px;
}
.cp-gradient-text {
  background: linear-gradient(135deg, var(--cp-primary) 0%, var(--cp-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.cp-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 16px 0;
  transition: all 0.3s ease;
}
.cp-nav-scrolled {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--cp-border);
  padding: 10px 0;
}
.cp-nav-inner {
  max-width: var(--cp-container);
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}
.cp-nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.cp-nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}
.cp-nav-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--cp-text-secondary);
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}
.cp-nav-link:hover { color: var(--cp-text); }
.cp-nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cp-mobile-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cp-text);
  padding: 4px;
}
.cp-mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid var(--cp-border);
  box-shadow: var(--cp-shadow-lg);
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cp-mobile-link {
  font-size: 16px;
  font-weight: 500;
  color: var(--cp-text);
  text-decoration: none;
  padding: 8px 0;
}
.cp-mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--cp-border);
}
.cp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--cp-primary) 0%, var(--cp-primary-dark) 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--cp-radius-full);
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--cp-shadow-sm);
  white-space: nowrap;
}
.cp-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--cp-shadow-glow);
}
.cp-btn-sm { padding: 8px 18px; font-size: 13px; }
.cp-btn-lg { padding: 16px 32px; font-size: 16px; }
.cp-btn-full { width: 100%; justify-content: center; }
.cp-btn-glow { box-shadow: var(--cp-shadow-glow); }
.cp-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: transparent;
  color: var(--cp-text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--cp-radius-full);
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.cp-btn-ghost:hover { color: var(--cp-text); background: rgba(0,0,0,0.04); }
.cp-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  color: var(--cp-text);
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--cp-radius-full);
  text-decoration: none;
  border: 1.5px solid var(--cp-border);
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}
.cp-btn-outline:hover {
  border-color: var(--cp-border-hover);
  background: rgba(124,58,237,0.04);
}
.cp-hero {
  position: relative;
  padding: 140px 0 80px;
  min-height: 90vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.cp-hero .cp-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
.cp-hero-content { position: relative; z-index: 2; }
.cp-gradient-mesh {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.cp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: cp-orb-float 12s ease-in-out infinite;
}
.cp-orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(124,58,237,0.3), transparent 70%);
  top: -10%; right: -5%;
  animation-delay: 0s;
}
.cp-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(236,72,153,0.25), transparent 70%);
  bottom: -5%; left: 10%;
  animation-delay: -4s;
}
.cp-orb-3 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(167,139,250,0.2), transparent 70%);
  top: 30%; left: 40%;
  animation-delay: -8s;
}
@keyframes cp-orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-15px, 15px) scale(0.95); }
}
.cp-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(124,58,237,0.08);
  border: 1px solid rgba(124,58,237,0.15);
  border-radius: var(--cp-radius-full);
  font-size: 13px;
  font-weight: 500;
  color: var(--cp-primary);
  margin-bottom: 24px;
}
.cp-hero-badge svg { width: 14px; height: 14px; }
.cp-hero-title {
  font-family: var(--cp-font-display);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
  color: var(--cp-text);
}
.cp-hero-desc {
  font-size: 18px;
  line-height: 1.6;
  color: var(--cp-text-secondary);
  margin: 0 0 32px;
  max-width: 480px;
}
.cp-hero-ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.cp-hero-social-proof {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--cp-border);
}
.cp-avatars { display: flex; }
.cp-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  margin-left: -8px;
  border: 2px solid white;
}
.cp-avatar:first-child { margin-left: 0; }
.cp-social-text { font-size: 13px; color: var(--cp-text-secondary); }
.cp-social-text strong { color: var(--cp-text); }
.cp-hero-visual { position: relative; z-index: 2; }
.cp-dashboard-mock {
  background: white;
  border-radius: var(--cp-radius-lg);
  box-shadow: var(--cp-shadow-xl);
  border: 1px solid var(--cp-border);
  overflow: hidden;
}
.cp-mock-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cp-border);
  background: var(--cp-surface-alt);
}
.cp-mock-dots { display: flex; gap: 6px; }
.cp-mock-dots span { width: 10px; height: 10px; border-radius: 50%; background: #e2e8f0; }
.cp-mock-dots span:first-child { background: #f87171; }
.cp-mock-dots span:nth-child(2) { background: #fbbf24; }
.cp-mock-dots span:last-child { background: #34d399; }
.cp-mock-url {
  font-size: 11px;
  color: var(--cp-text-muted);
  background: white;
  padding: 4px 12px;
  border-radius: 6px;
  flex: 1;
}
.cp-mock-body {
  display: grid;
  grid-template-columns: 60px 1fr;
  min-height: 280px;
}
.cp-mock-sidebar {
  padding: 16px 8px;
  border-right: 1px solid var(--cp-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cp-mock-nav-item { height: 36px; border-radius: 8px; background: var(--cp-surface-alt); }
.cp-mock-nav-item.cp-active { background: rgba(124,58,237,0.12); }
.cp-mock-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cp-mock-stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.cp-mock-stat { padding: 12px; background: var(--cp-surface-alt); border-radius: 10px; }
.cp-mock-stat-label { height: 8px; width: 50%; background: #e2e8f0; border-radius: 4px; margin-bottom: 8px; }
.cp-mock-stat-value {
  height: 18px;
  background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.15));
  border-radius: 4px;
}
.cp-mock-calendar {
  flex: 1;
  border: 1px solid var(--cp-border);
  border-radius: 10px;
  padding: 12px;
}
.cp-mock-cal-header { height: 10px; width: 40%; background: #e2e8f0; border-radius: 4px; margin-bottom: 12px; }
.cp-mock-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cp-mock-cal-day { aspect-ratio: 1; border-radius: 6px; background: var(--cp-surface-alt); }
.cp-mock-cal-day.cp-booked {
  background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.15));
}
.cp-float-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: white;
  border-radius: var(--cp-radius-md);
  box-shadow: var(--cp-shadow-lg);
  border: 1px solid var(--cp-border);
  white-space: nowrap;
  z-index: 3;
}
.cp-float-1 { top: 15%; right: -20px; }
.cp-float-2 { top: 55%; left: -30px; }
.cp-float-3 { bottom: 8%; right: -10px; }
.cp-float-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cp-float-icon svg { width: 16px; height: 16px; }
.cp-float-icon-green { background: rgba(52,211,153,0.15); color: #059669; }
.cp-float-icon-purple { background: rgba(124,58,237,0.12); color: var(--cp-primary); }
.cp-float-icon-pink { background: rgba(236,72,153,0.12); color: var(--cp-accent); }
.cp-float-title { font-size: 13px; font-weight: 600; color: var(--cp-text); }
.cp-float-sub { font-size: 11px; color: var(--cp-text-muted); }
.cp-trust-bar {
  padding: 32px 0;
  border-top: 1px solid var(--cp-border);
  border-bottom: 1px solid var(--cp-border);
  background: var(--cp-surface-alt);
  overflow: hidden;
}
.cp-marquee { overflow: hidden; }
.cp-marquee-track {
  display: flex;
  gap: 48px;
  animation: cp-scroll 30s linear infinite;
  width: max-content;
}
.cp-marquee-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--cp-text-secondary);
  white-space: nowrap;
}
.cp-marquee-item svg { color: var(--cp-primary); width: 14px; height: 14px; }
@keyframes cp-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.cp-section-header { text-align: center; margin-bottom: 56px; }
.cp-section-tag {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cp-primary);
  margin-bottom: 16px;
  padding: 4px 14px;
  background: rgba(124,58,237,0.08);
  border-radius: var(--cp-radius-full);
}
.cp-tag-light { background: rgba(255,255,255,0.1); color: var(--cp-primary-light); }
.cp-section-title {
  font-family: var(--cp-font-display);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
  color: var(--cp-text);
}
.cp-title-light { color: white; }
.cp-section-desc {
  font-size: 17px;
  line-height: 1.6;
  color: var(--cp-text-secondary);
  max-width: 560px;
  margin: 0 auto;
}
.cp-features { padding: 100px 0; }
.cp-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.cp-feature-card {
  padding: 28px;
  background: white;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-radius-lg);
  transition: all 0.3s ease;
}
.cp-feature-card:hover {
  border-color: var(--cp-border-hover);
  box-shadow: var(--cp-shadow-md);
  transform: translateY(-2px);
}
.cp-feature-large { grid-column: span 2; }
.cp-feature-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(124,58,237,0.08);
  color: var(--cp-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.cp-feature-title {
  font-family: var(--cp-font-display);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--cp-text);
}
.cp-feature-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--cp-text-secondary);
  margin: 0;
}
.cp-how-it-works { padding: 100px 0; background: var(--cp-navy); }
.cp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.cp-step { text-align: center; padding: 40px 24px; }
.cp-step-num {
  font-family: var(--cp-font-display);
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--cp-primary-light), var(--cp-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
}
.cp-step-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(124,58,237,0.15);
  color: var(--cp-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}
.cp-step-title {
  font-family: var(--cp-font-display);
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0 0 10px;
}
.cp-step-desc { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.6); margin: 0; }
.cp-for-who { padding: 100px 0; background: var(--cp-surface-alt); }
.cp-profession-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.cp-profession-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 16px;
  background: white;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-radius-lg);
  text-align: center;
  cursor: default;
  transition: all 0.25s ease;
}
.cp-profession-card:hover {
  border-color: var(--cp-border-hover);
  box-shadow: var(--cp-shadow-md);
}
.cp-profession-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: rgba(124,58,237,0.08);
  color: var(--cp-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cp-profession-label { font-size: 14px; font-weight: 500; color: var(--cp-text); }
.cp-pricing { padding: 100px 0; }
.cp-pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: start;
}
.cp-pricing-card {
  padding: 32px;
  background: white;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-radius-lg);
  position: relative;
  transition: all 0.3s ease;
}
.cp-pricing-card:hover { box-shadow: var(--cp-shadow-lg); }
.cp-pricing-highlight {
  border-color: var(--cp-primary);
  box-shadow: var(--cp-shadow-glow);
  transform: scale(1.03);
}
.cp-pricing-highlight:hover { box-shadow: 0 12px 48px rgba(124,58,237,0.3); }
.cp-pricing-badge-pop {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  background: linear-gradient(135deg, var(--cp-primary), var(--cp-accent));
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--cp-radius-full);
  white-space: nowrap;
}
.cp-pricing-header { margin-bottom: 24px; }
.cp-pricing-name {
  font-family: var(--cp-font-display);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cp-ai-badge {
  display: inline-flex;
  padding: 2px 8px;
  background: linear-gradient(135deg, var(--cp-primary), var(--cp-accent));
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: var(--cp-radius-full);
}
.cp-pricing-price { display: flex; align-items: baseline; gap: 2px; }
.cp-price-currency { font-size: 24px; font-weight: 600; color: var(--cp-text); }
.cp-price-amount {
  font-family: var(--cp-font-display);
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cp-text);
}
.cp-price-period { font-size: 14px; color: var(--cp-text-muted); margin-left: 4px; }
.cp-pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cp-pricing-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--cp-text-secondary);
}
.cp-pricing-features svg { flex-shrink: 0; color: var(--cp-primary); }
.cp-btn-pricing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--cp-radius-full);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
}
.cp-testimonials { padding: 100px 0; background: var(--cp-surface-alt); }
.cp-testimonial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.cp-testimonial-card {
  padding: 28px;
  background: white;
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-radius-lg);
  transition: all 0.3s ease;
}
.cp-testimonial-card:hover { box-shadow: var(--cp-shadow-md); transform: translateY(-2px); }
.cp-stars { display: flex; gap: 2px; margin-bottom: 16px; }
.cp-testimonial-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--cp-text-secondary);
  margin: 0 0 20px;
  font-style: italic;
}
.cp-testimonial-author { display: flex; align-items: center; gap: 12px; }
.cp-testimonial-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
}
.cp-testimonial-name { font-size: 14px; font-weight: 600; color: var(--cp-text); }
.cp-testimonial-role { font-size: 12px; color: var(--cp-text-muted); }
.cp-cta-final { padding: 100px 0; }
.cp-cta-inner {
  text-align: center;
  padding: 64px 32px;
  background: var(--cp-navy);
  border-radius: var(--cp-radius-xl);
  position: relative;
  overflow: hidden;
}
.cp-cta-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(124,58,237,0.2), transparent 60%),
              radial-gradient(ellipse at bottom right, rgba(236,72,153,0.15), transparent 60%);
  pointer-events: none;
}
.cp-cta-title {
  font-family: var(--cp-font-display);
  font-size: clamp(24px, 3.5vw, 38px);
  font-weight: 700;
  line-height: 1.2;
  color: white;
  margin: 0 0 16px;
  position: relative;
}
.cp-cta-desc { font-size: 16px; color: rgba(255,255,255,0.6); margin: 0 0 32px; position: relative; }
.cp-cta-actions { position: relative; }
.cp-cta-note { font-size: 13px; color: rgba(255,255,255,0.4); margin: 16px 0 0; position: relative; }
.cp-footer { padding: 64px 0 32px; border-top: 1px solid var(--cp-border); }
.cp-footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}
.cp-footer-brand { max-width: 280px; }
.cp-footer-tagline { font-size: 14px; line-height: 1.6; color: var(--cp-text-secondary); margin: 16px 0 0; }
.cp-footer-col-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cp-text);
  margin: 0 0 16px;
}
.cp-footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cp-footer-link {
  font-size: 14px;
  color: var(--cp-text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}
.cp-footer-link:hover { color: var(--cp-primary); }
.cp-footer-bottom { padding-top: 24px; border-top: 1px solid var(--cp-border); text-align: center; }
.cp-footer-bottom p { font-size: 13px; color: var(--cp-text-muted); margin: 0; }
@media (max-width: 1024px) {
  .cp-hero .cp-container { grid-template-columns: 1fr; gap: 40px; }
  .cp-hero-visual { max-width: 600px; margin: 0 auto; }
  .cp-feature-grid { grid-template-columns: repeat(2, 1fr); }
  .cp-feature-large { grid-column: span 2; }
  .cp-pricing-grid { grid-template-columns: repeat(3, 1fr); }
  .cp-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
}
@media (max-width: 768px) {
  .cp-nav-links { display: none; }
  .cp-nav-actions { display: none; }
  .cp-mobile-toggle { display: block; }
  .cp-hero { padding: 120px 0 60px; min-height: auto; }
  .cp-hero-title { font-size: clamp(28px, 8vw, 40px); }
  .cp-hero-ctas { flex-direction: column; }
  .cp-hero-ctas a { width: 100%; justify-content: center; }
  .cp-float-card { display: none; }
  .cp-feature-grid { grid-template-columns: 1fr; }
  .cp-feature-large { grid-column: span 1; }
  .cp-steps { grid-template-columns: 1fr; gap: 0; }
  .cp-step { padding: 32px 16px; }
  .cp-profession-grid { grid-template-columns: repeat(2, 1fr); }
  .cp-pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
  .cp-pricing-highlight { transform: none; }
  .cp-testimonial-grid { grid-template-columns: 1fr; }
  .cp-footer-grid { grid-template-columns: 1fr; gap: 32px; }
}
@media (max-width: 480px) {
  .cp-container { padding: 0 16px; }
  .cp-hero { padding: 100px 0 40px; }
  .cp-profession-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .cp-mock-body { grid-template-columns: 1fr; }
  .cp-mock-sidebar { display: none; }
}
`

// ─── MAIN PAGE EXPORT ─────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: landingCSS }} />
      <div className="cp-landing">
        <Nav />
        <Hero />
        <TrustBar />
        <Features />
        <HowItWorks />
        <ForWho />
        <Pricing />
        <Testimonials />
        <CtaFinal />
        <Footer />
      </div>
    </>
  )
}
