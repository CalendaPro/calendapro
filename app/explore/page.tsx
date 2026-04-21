'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { motion } from 'framer-motion'
import type { Variants, Transition } from 'framer-motion'
import {
  Search,
  Calendar,
  Star,
  ArrowRight,
  Sparkles,
  Check,
  Clock,
  Shield,
  Zap,
  Scissors,
  Camera,
  Heart,
  Briefcase,
  Dumbbell,
  BrainCircuit,
  Wallet,
  Lock,
  Award,
  Timer,
  CreditCard,
  Fingerprint,
  Layers
} from 'lucide-react'

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'barbier', label: 'Barbiers', icon: Scissors, color: '#db2777', desc: 'Coupe & barbe' },
  { id: 'coach', label: 'Coachs', icon: BrainCircuit, color: '#ea580c', desc: 'Développement' },
  { id: 'photo', label: 'Photographes', icon: Camera, color: '#059669', desc: 'Shooting pro' },
  { id: 'therapeute', label: 'Thérapeutes', icon: Heart, color: '#ec4899', desc: 'Bien-être' },
  { id: 'sport', label: 'Coachs sportifs', icon: Dumbbell, color: '#dc2626', desc: 'Fitness' },
  { id: 'consultant', label: 'Consultants', icon: Briefcase, color: '#d97706', desc: 'Conseil' },
]

const ENGAGEMENTS = [
  {
    icon: Shield,
    title: 'Sécurité Totale',
    desc: 'Vos paiements et acomptes sont protégés par notre système de tiers de confiance.',
    color: '#d97706',
    gradient: 'from-amber-500/20 to-orange-500/10'
  },
  {
    icon: Award,
    title: 'Sélection Rigoureuse',
    desc: 'Nous référençons uniquement les talents indépendants ayant prouvé leur expertise.',
    color: '#7c3aed',
    gradient: 'from-violet-500/20 to-purple-500/10'
  },
  {
    icon: Timer,
    title: 'Gain de Temps',
    desc: 'Une interface pensée pour réserver en moins de 30 secondes, sans attente.',
    color: '#059669',
    gradient: 'from-emerald-500/20 to-teal-500/10'
  }
]

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 1.5rem', height: '72px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}
    >
      <BrandLogo />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/client-sign-in" className="nav-btn-ghost">
          Connexion
        </Link>
        <Link href="/client-sign-up" className="nav-btn-gradient">
          <span>M&apos;inscrire</span>
          <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </motion.nav>
  )
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero() {
  const c: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }
  const i: Variants = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }

  return (
    <section className="hero-section">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      
      <motion.div variants={c} initial="hidden" animate="visible" className="hero-content">
        <motion.div variants={i}>
          <span className="premium-badge">
            <Sparkles size={14} strokeWidth={1.5} />
            Marketplace Premium
          </span>
        </motion.div>

        <motion.h1 variants={i} className="hero-title clash-display">
          <span className="gradient-text-animated">L&apos;excellence à portée de clic.</span>
        </motion.h1>

        <motion.p variants={i} className="hero-subtitle">
          Découvrez des professionnels d&apos;exception près de chez vous.
          Réservez en quelques secondes, sans appel, sans attente.
        </motion.p>

        <motion.div variants={i}>
          <Link href="/marketplace" className="hero-cta">
            <Search size={20} strokeWidth={1.5} />
            <span>Trouver un professionnel</span>
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </motion.div>

        <motion.div variants={i} className="trust-signals">
          {[
            { icon: Check, text: 'Gratuit pour les clients' },
            { icon: Shield, text: 'Pros vérifiés' },
            { icon: Clock, text: 'Réservation 24/7' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="trust-item">
              <Icon size={14} strokeWidth={1.5} />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── CATEGORIES GLASS ─────────────────────────────────────────────────────────
function CategoriesSection() {
  return (
    <section className="categories-section">
      <div className="categories-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <span className="section-badge">Catégories</span>
          <h2 className="section-title clash-display">Trouvez votre expert</h2>
          <p className="section-subtitle">Des professionnels qualifiés dans toutes les catégories</p>
        </motion.div>

        <div className="categories-grid">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link href={`/marketplace?category=${cat.id}`} className="category-card">
                <div className="shimmer-overlay" />
                <div className="category-icon" style={{ '--cat-color': cat.color } as React.CSSProperties}>
                  <cat.icon size={26} strokeWidth={1.5} />
                </div>
                <span className="category-label clash-display">{cat.label}</span>
                <span className="category-desc">{cat.desc}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── ENGAGEMENT SECTION ───────────────────────────────────────────────────────
function EngagementSection() {
  return (
    <section className="engagement-section">
      <div className="engagement-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <span className="section-badge gold">Notre Engagement</span>
          <h2 className="section-title clash-display">L&apos;Engagement CalendaPro</h2>
          <p className="section-subtitle">Pas de mensonge, que du service. Une plateforme pensée pour l&apos;excellence.</p>
        </motion.div>

        <div className="engagement-grid">
          {ENGAGEMENTS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="engagement-card"
            >
              <div className="engagement-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}30, transparent 70%)` }} />
              <div className="engagement-icon" style={{ color: item.color }}>
                <item.icon size={28} strokeWidth={1.5} />
              </div>
              <h3 className="engagement-title clash-display">{item.title}</h3>
              <p className="engagement-desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── ABSTRACT SHAPES ─────────────────────────────────────────────────────────
function AbstractShape({ type, color }: { type: 'circle' | 'ring' | 'glow' | 'line'; color: string }) {
  if (type === 'circle') {
    return (
      <div className="abstract-shape circle" style={{ 
        width: 80, height: 80, borderRadius: '50%', 
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        border: `1px solid ${color}30`
      }} />
    )
  }
  if (type === 'ring') {
    return (
      <div className="abstract-shape ring" style={{ 
        width: 100, height: 100, borderRadius: '50%', 
        border: `2px solid ${color}40`,
        background: 'transparent'
      }} />
    )
  }
  if (type === 'glow') {
    return (
      <div className="abstract-shape glow" style={{ 
        width: 120, height: 120, borderRadius: '50%', 
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        filter: 'blur(20px)'
      }} />
    )
  }
  return (
    <div className="abstract-shape line" style={{ 
      width: 2, height: 60, 
      background: `linear-gradient(180deg, ${color}60, transparent)`
    }} />
  )
}

// ─── HOW IT WORKS ABSTRACT ─────────────────────────────────────────────────
function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      icon: Search,
      title: 'Cherchez',
      desc: 'Trouvez le pro idéal près de chez vous',
      mockup: (
        <div className="abstract-mockup">
          <div className="abstract-bg">
            <div className="abstract-orbs">
              <div className="orb-shape" style={{ background: '#7c3aed20' }} />
              <div className="orb-shape secondary" style={{ background: '#ec489920' }} />
            </div>
          </div>
          <div className="mockup-interface">
            <div className="interface-header">
              <div className="interface-search-bar">
                <Search size={14} strokeWidth={1.5} />
                <span>Coiffeur Lyon...</span>
              </div>
            </div>
            <div className="interface-content">
              <div className="interface-line" />
              <div className="interface-line short" />
              <div className="interface-cards">
                <div className="int-card" />
                <div className="int-card active" />
                <div className="int-card" />
              </div>
            </div>
          </div>
          <div className="floating-shapes">
            <AbstractShape type="circle" color="#7c3aed" />
            <AbstractShape type="glow" color="#ec4899" />
            <AbstractShape type="ring" color="#d97706" />
          </div>
        </div>
      )
    },
    {
      icon: Calendar,
      title: 'Réservez',
      desc: 'Choisissez votre créneau en temps réel',
      mockup: (
        <div className="abstract-mockup">
          <div className="abstract-bg wallet-bg">
            <div className="wallet-pattern">
              <div className="pattern-line" />
              <div className="pattern-line" />
              <div className="pattern-line" />
            </div>
          </div>
          <div className="mockup-interface wallet-interface">
            <div className="wallet-card">
              <div className="wallet-header">
                <Wallet size={20} strokeWidth={1.5} />
                <span>Wallet CalendaPro</span>
              </div>
              <div className="wallet-balance">
                <span className="balance-label">Acompte sécurisé</span>
                <span className="balance-amount">50,00 €</span>
              </div>
              <div className="wallet-security">
                <Lock size={12} strokeWidth={1.5} />
                <span>Paiement chiffré</span>
              </div>
            </div>
            <div className="calendar-preview">
              <div className="cal-grid-mini">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className={`cal-mini-day ${i === 5 ? 'selected' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="floating-shapes wallet-shapes">
            <AbstractShape type="glow" color="#059669" />
            <AbstractShape type="circle" color="#22c55e" />
            <AbstractShape type="ring" color="#10b981" />
          </div>
        </div>
      )
    },
    {
      icon: Star,
      title: 'Profitez',
      desc: 'Recevez vos rappels automatiques',
      mockup: (
        <div className="abstract-mockup">
          <div className="abstract-bg notification-bg">
            <div className="notification-rings">
              <div className="notif-ring ring-1" />
              <div className="notif-ring ring-2" />
              <div className="notif-ring ring-3" />
            </div>
          </div>
          <div className="mockup-interface notification-interface">
            <div className="notification-card main">
              <div className="notif-icon">
                <Calendar size={18} strokeWidth={1.5} />
              </div>
              <div className="notif-content">
                <span className="notif-title">Rappel de rendez-vous</span>
                <span className="notif-time">Demain à 14h00</span>
              </div>
            </div>
            <div className="notification-card secondary">
              <div className="notif-icon small">
                <CreditCard size={14} strokeWidth={1.5} />
              </div>
              <span>Paiement confirmé</span>
            </div>
            <div className="notification-card secondary">
              <div className="notif-icon small">
                <Fingerprint size={14} strokeWidth={1.5} />
              </div>
              <span>Authentification réussie</span>
            </div>
          </div>
          <div className="floating-shapes notification-shapes">
            <AbstractShape type="glow" color="#f59e0b" />
            <AbstractShape type="ring" color="#fbbf24" />
            <AbstractShape type="circle" color="#d97706" />
          </div>
        </div>
      )
    },
  ]

  return (
    <section className="how-it-works-section">
      <div className="hiw-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <span className="section-badge">Comment ça marche</span>
          <h2 className="section-title clash-display">Simple. Rapide. Efficace.</h2>
        </motion.div>

        <div className="hiw-content">
          <div className="hiw-steps-nav">
            {steps.map((step, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                onClick={() => setActiveStep(idx)}
                className={`hiw-step-btn ${activeStep === idx ? 'active' : ''}`}
              >
                <div className="step-number">{idx + 1}</div>
                <div className="step-info">
                  <span className="step-title clash-display">{step.title}</span>
                  <span className="step-desc">{step.desc}</span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="hiw-mockup-wrapper">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, scale: 0.95, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotateY: 10 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="hiw-mockup-container"
            >
              {steps[activeStep].mockup}
            </motion.div>
            
            <div className="mockup-glow" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-top">
          <BrandLogo variant="dark" />
          <div className="footer-links">
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/client-sign-in">Connexion</Link>
            <Link href="/client-sign-up" className="footer-cta">M&apos;inscrire</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 CalendaPro. Tous droits réservés.</span>
          <span>Conçu à Paris pour les clients exigeants</span>
        </div>
      </div>
    </footer>
  )
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function ExplorePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; }
        
        .clash-display { font-family: 'Clash Display', sans-serif; }
        
        /* ─── GLOBAL STYLES ─────────────────────────────────────────────── */
        .page-wrapper {
          min-height: 100vh;
          background: radial-gradient(ellipse at 50% 0%, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%);
          overflow-x: hidden;
        }
        
        /* ─── NAV STYLES ────────────────────────────────────────────────── */
        .nav-btn-ghost {
          font-size: 0.85rem;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.3s;
          border: 1px solid transparent;
          position: relative;
        }
        .nav-btn-ghost:hover {
          color: #7c3aed;
          border-color: rgba(124, 58, 237, 0.3);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.15);
        }
        
        .nav-btn-gradient {
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
          text-decoration: none;
          padding: 0.55rem 1.4rem;
          border-radius: 100px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35), 0 0 0 1px rgba(255,255,255,0.2) inset;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          overflow: hidden;
        }
        .nav-btn-gradient::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        .nav-btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(124, 58, 237, 0.45), 0 0 30px rgba(236, 72, 153, 0.3), 0 0 0 1px rgba(255,255,255,0.3) inset;
        }
        .nav-btn-gradient:hover::before {
          transform: translateX(100%);
        }
        
        /* ─── HERO STYLES ──────────────────────────────────────────────── */
        .hero-section {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8rem 1.5rem 6rem;
          position: relative;
          overflow: hidden;
        }
        
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          top: -10%;
          left: -5%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 60%);
        }
        .orb-2 {
          bottom: -5%;
          right: -10%;
          width: 40vw;
          height: 40vw;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, transparent 55%);
        }
        
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 720px;
          position: relative;
          z-index: 1;
        }
        
        .premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.15);
          color: #7c3aed;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 2rem;
          backdrop-filter: blur(8px);
        }
        
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.04em;
          margin: 0 0 1.5rem;
        }
        
        .gradient-text-animated {
          background: linear-gradient(90deg, #7c3aed, #ec4899, #a855f7, #7c3aed);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .hero-subtitle {
          font-size: 1.15rem;
          color: #64748b;
          line-height: 1.75;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          max-width: 520px;
          margin: 0 0 2.5rem;
        }
        
        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 1.1rem 2.5rem;
          background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
          color: white;
          border-radius: 100px;
          font-weight: 700;
          font-size: 1.05rem;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4), 0 16px 48px rgba(124, 58, 237, 0.15);
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
          overflow: hidden;
        }
        .hero-cta:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(124, 58, 237, 0.5), 0 20px 60px rgba(124, 58, 237, 0.2);
        }
        
        .trust-signals {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 2.5rem;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #94a3b8;
          font-family: 'DM Sans', sans-serif;
        }
        .trust-item svg {
          color: #7c3aed;
        }
        
        /* ─── CATEGORIES GLASS ───────────────────────────────────────────── */
        .categories-section {
          padding: 0 1.5rem 4rem;
          position: relative;
          z-index: 10;
          margin-top: -4rem;
        }
        .categories-container {
          max-width: 1100px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 32px;
          padding: 3rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset;
        }
        
        .section-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .section-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.08);
          padding: 0.4rem 1rem;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 1rem;
        }
        .section-badge.gold {
          color: #d97706;
          background: rgba(217, 119, 6, 0.1);
        }
        .section-title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #0f172a;
          margin: 0.5rem 0;
        }
        .section-subtitle {
          font-size: 1rem;
          color: #64748b;
          font-family: 'DM Sans', sans-serif;
          max-width: 480px;
          margin: 0 auto;
        }
        
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        
        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.75rem 1rem;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
          overflow: hidden;
        }
        .category-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .shimmer-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.15), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        .category-card:hover .shimmer-overlay {
          transform: translateX(100%);
        }
        
        .category-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--cat-color)20, var(--cat-color)10);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cat-color);
          transition: all 0.3s;
        }
        .category-card:hover .category-icon {
          transform: scale(1.1);
          filter: drop-shadow(0 4px 12px var(--cat-color)40);
        }
        
        .category-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .category-desc {
          font-size: 0.75rem;
          color: #94a3b8;
          font-family: 'DM Sans', sans-serif;
        }
        
        /* ─── ENGAGEMENT SECTION ─────────────────────────────────────────── */
        .engagement-section {
          padding: 6rem 1.5rem;
          background: linear-gradient(180deg, transparent, rgba(124, 58, 237, 0.02) 50%, transparent);
        }
        .engagement-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .engagement-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 3rem;
        }
        
        .engagement-card {
          position: relative;
          padding: 2.5rem 2rem;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 28px;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          overflow: hidden;
        }
        .engagement-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12);
        }
        
        .engagement-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 150px;
          opacity: 0;
          transition: opacity 0.4s;
        }
        .engagement-card:hover .engagement-glow {
          opacity: 1;
        }
        
        .engagement-icon {
          position: relative;
          z-index: 1;
          width: 64px;
          height: 64px;
          margin: 0 auto 1.25rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }
        
        .engagement-title {
          position: relative;
          z-index: 1;
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }
        
        .engagement-desc {
          position: relative;
          z-index: 1;
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.7;
          font-family: 'DM Sans', sans-serif;
        }
        
        /* ─── HOW IT WORKS ──────────────────────────────────────────────── */
        .how-it-works-section {
          padding: 6rem 1.5rem;
          background: #f8fafc;
        }
        .hiw-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .hiw-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-top: 3rem;
        }
        @media (max-width: 768px) {
          .hiw-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
        
        .hiw-steps-nav {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .hiw-step-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
          width: 100%;
        }
        .hiw-step-btn:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateX(4px);
        }
        .hiw-step-btn.active {
          background: white;
          border-color: rgba(124, 58, 237, 0.2);
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.1);
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(236, 72, 153, 0.1));
          border: 1.5px solid rgba(124, 58, 237, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #7c3aed;
          flex-shrink: 0;
        }
        .hiw-step-btn.active .step-number {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: white;
          border-color: transparent;
        }
        
        .step-info {
          display: flex;
          flex-direction: column;
        }
        .step-title {
          font-weight: 600;
          font-size: 1.1rem;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .step-desc {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-top: 2px;
          font-family: 'DM Sans', sans-serif;
        }
        
        .hiw-mockup-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
        }
        
        .hiw-mockup-container {
          position: relative;
          width: 100%;
          max-width: 320px;
        }
        
        .abstract-mockup {
          position: relative;
          background: white;
          border-radius: 32px;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.06);
          min-height: 400px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .abstract-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 32px;
        }
        
        .abstract-orbs {
          position: absolute;
          inset: 0;
        }
        .orb-shape {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          filter: blur(40px);
          top: -20px;
          right: -20px;
          animation: float-orb 6s ease-in-out infinite;
        }
        .orb-shape.secondary {
          width: 100px;
          height: 100px;
          bottom: 20px;
          left: -30px;
          top: auto;
          right: auto;
          animation-delay: -3s;
        }
        
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, 10px) scale(1.05); }
        }
        
        .mockup-interface {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .interface-header {
          margin-bottom: 0.5rem;
        }
        .interface-search-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #f1f5f9;
          border-radius: 12px;
          color: #64748b;
          font-size: 0.85rem;
        }
        
        .interface-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .interface-line {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          width: 100%;
        }
        .interface-line.short {
          width: 60%;
        }
        
        .interface-cards {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .int-card {
          flex: 1;
          height: 60px;
          background: #f1f5f9;
          border-radius: 8px;
        }
        .int-card.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(236, 72, 153, 0.1));
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
        
        /* Wallet Mockup */
        .wallet-bg {
          background: linear-gradient(135deg, rgba(5, 150, 105, 0.05), rgba(16, 185, 129, 0.02));
        }
        .wallet-pattern {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          opacity: 0.3;
        }
        .pattern-line {
          width: 80%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
        }
        
        .wallet-interface {
          justify-content: center;
        }
        
        .wallet-card {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .wallet-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #059669;
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .wallet-balance {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .balance-label {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .balance-amount {
          font-size: 1.75rem;
          font-weight: 700;
          color: #059669;
          letter-spacing: -0.02em;
        }
        .wallet-security {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
          font-size: 0.7rem;
          color: #10b981;
        }
        
        .calendar-preview {
          background: #f8fafc;
          border-radius: 16px;
          padding: 1rem;
        }
        .cal-grid-mini {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.35rem;
        }
        .cal-mini-day {
          aspect-ratio: 1;
          background: #e2e8f0;
          border-radius: 6px;
        }
        .cal-mini-day.selected {
          background: #7c3aed;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        
        /* Notification Mockup */
        .notification-bg {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(251, 191, 36, 0.02));
        }
        .notification-rings {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notif-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(245, 158, 11, 0.2);
        }
        .ring-1 { width: 100px; height: 100px; animation: pulse-ring 2s ease-out infinite; }
        .ring-2 { width: 140px; height: 140px; animation: pulse-ring 2s ease-out infinite 0.5s; }
        .ring-3 { width: 180px; height: 180px; animation: pulse-ring 2s ease-out infinite 1s; }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        
        .notification-interface {
          justify-content: center;
          gap: 0.75rem;
        }
        
        .notification-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .notification-card.main {
          border-color: rgba(245, 158, 11, 0.2);
        }
        .notification-card.secondary {
          background: rgba(124, 58, 237, 0.05);
          border-color: rgba(124, 58, 237, 0.1);
        }
        .notification-card.secondary span {
          font-size: 0.8rem;
          color: #64748b;
        }
        
        .notif-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .notif-icon.small {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(124, 58, 237, 0.1);
          color: #7c3aed;
        }
        
        .notif-content {
          display: flex;
          flex-direction: column;
        }
        .notif-title {
          font-weight: 600;
          font-size: 0.9rem;
          color: #0f172a;
        }
        .notif-time {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        
        /* Floating Shapes */
        .floating-shapes {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: 32px;
        }
        .abstract-shape {
          position: absolute;
          animation: float-shape 8s ease-in-out infinite;
        }
        .abstract-shape:nth-child(1) { top: 10%; left: 5%; animation-delay: 0s; }
        .abstract-shape:nth-child(2) { top: 60%; right: 5%; animation-delay: -3s; }
        .abstract-shape:nth-child(3) { bottom: 15%; left: 15%; animation-delay: -5s; }
        
        @keyframes float-shape {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        .mockup-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%);
          filter: blur(60px);
          animation: glow-pulse 4s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        
        /* ─── FOOTER ───────────────────────────────────────────────────── */
        .footer-section {
          background: #0f172a;
          padding: 4rem 1.5rem 2rem;
        }
        .footer-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .footer-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }
        .footer-links a {
          font-size: 0.85rem;
          color: #94a3b8;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #a78bfa;
        }
        .footer-cta {
          color: #7c3aed !important;
          font-weight: 600;
        }
        .footer-bottom {
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.8rem;
          color: #475569;
          font-family: 'DM Sans', sans-serif;
        }
        
        /* ─── MOBILE RESPONSIVE ─────────────────────────────────────────── */
        @media (max-width: 768px) {
          .hero-section {
            padding: 7rem 1rem 4rem;
            min-height: auto;
          }
          .hero-title {
            font-size: 2rem;
          }
          .hero-cta {
            padding: 0.9rem 1.75rem;
            font-size: 0.95rem;
          }
          .trust-signals {
            gap: 1rem;
          }
          
          .categories-container {
            padding: 1.5rem;
            border-radius: 24px;
          }
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
          .category-card {
            padding: 1.25rem 0.75rem;
          }
          
          .engagement-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .engagement-card {
            padding: 2rem 1.5rem;
          }
          
          .how-it-works-section {
            padding: 3rem 1rem;
          }
          
          .hiw-mockup-container {
            max-width: 100%;
          }
          .abstract-mockup {
            min-height: 350px;
            padding: 1.5rem;
          }
          
          .footer-top {
            flex-direction: column;
            text-align: center;
          }
          .footer-links {
            flex-wrap: wrap;
            justify-content: center;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }
        
        @media (max-width: 480px) {
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .category-icon {
            width: 48px;
            height: 48px;
          }
          .category-label {
            font-size: 0.85rem;
          }
          
          .engagement-card {
            padding: 1.75rem 1.25rem;
          }
        }
      `}</style>
      
      <div className="page-wrapper">
        <Nav />
        <Hero />
        <CategoriesSection />
        <EngagementSection />
        <HowItWorks />
        <Footer />
      </div>
    </>
  )
}
