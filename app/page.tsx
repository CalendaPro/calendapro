'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants, Transition } from 'framer-motion'

// Marquee logos
const marqueeLogos = [
  { name: 'Google', color: '#4285F4' },
  { name: 'Microsoft', color: '#0078D4' },
  { name: 'Apple', color: '#1A1A1A' },
  { name: 'Stripe', color: '#635BFF' },
  { name: 'Notion', color: '#1A1A1A' },
  { name: 'Figma', color: '#F24E1E' },
  { name: 'Slack', color: '#4A154B' },
  { name: 'Spotify', color: '#1DB954' },
]
import { ScrollCalendar, SmartNotifications, MetierSection, TechDemoSection, VisionSection } from '@/components/landing'
import { GlassBackground, DotsBackground, GridBackground } from '@/components/backgrounds'

type ME = React.MouseEvent<HTMLAnchorElement>

// ─── SVG ICONS ─────────────────────────────────────────────────────────────────
const Icons = {
  Calendar: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Bell: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Users: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Globe: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Store: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-6h16l1 6"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 9v12h14V9"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Code: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
}

// ─── FLOATING ISLAND NAV ─────────────────────────────────────────────────────
function Nav() {
  const [scrollY, setScrollY] = useState(0)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    const fn = () => {
      const currentScrollY = window.scrollY
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
      setScrollY(currentScrollY)
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [lastScrollY])

  const isScrolled = scrollY > 40

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : -100, 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: 'fixed',
        top: isScrolled ? '12px' : '20px',
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 1rem',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          maxWidth: '60rem',
          width: '100%',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '100px',
          borderTop: '1px solid rgba(15,14,12,0.04)',
          borderBottom: '1px solid rgba(15,14,12,0.06)',
          boxShadow: isScrolled 
            ? '0 4px 24px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset'
            : '0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
          transform: isScrolled ? 'scale(0.96)' : 'scale(1)',
          transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        {/* Logo - CalendaPro attached */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: '#0F0E0C',
          }}>Calenda</span>
          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #7C3AED, #F02AD3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Pro</span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {[
            { label: 'Fonctionnalités', href: '#features' },
            { label: 'Tarifs', href: '#pricing' },
            { label: 'Marketplace', href: '/marketplace' },
          ].map((item) => (
            <a 
              key={item.label} 
              href={item.href} 
              style={{ 
                fontSize: '0.8rem', 
                color: '#64748b', 
                textDecoration: 'none', 
                fontFamily: "'Cabinet Grotesk', sans-serif", 
                fontWeight: 500, 
                transition: 'color 0.2s',
                letterSpacing: '-0.01em',
              }}
              onMouseOver={(e: ME) => (e.currentTarget.style.color = '#0F0E0C')}
              onMouseOut={(e: ME) => (e.currentTarget.style.color = '#64748b')}
            >{item.label}</a>
          ))}
        </div>

        {/* CTA */}
        <Link 
          href="/sign-up" 
          style={{ 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            color: 'white', 
            textDecoration: 'none', 
            padding: '0.5rem 1.25rem', 
            borderRadius: '100px', 
            background: 'linear-gradient(135deg, #7C3AED, #F02AD3)', 
            fontFamily: "'Cabinet Grotesk', sans-serif",
            boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
            transition: 'all 0.2s',
            letterSpacing: '-0.01em',
          }}
          onMouseOver={(e: ME) => { 
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.4)' 
          }}
          onMouseOut={(e: ME) => { 
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.3)' 
          }}
        >
          Commencer
        </Link>
      </div>
    </motion.nav>
  )
}

// ─── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  const containerVariants: Variants = { 
    hidden: {}, 
    visible: { 
      transition: { staggerChildren: 0.08, delayChildren: 0.1 } 
    } 
  }
  
  const itemVariants: Variants = { 
    hidden: { opacity: 0, y: 30 }, 
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } 
    } 
  }
  
  const titleVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }
    }
  }

  return (
    <>
    {/* PRESTIGE HERO - Minimalist Grid */}
    <section
      id="hero"
      style={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '6rem 8vw 4rem',
        background: '#FAF9F6',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid pattern - La Base */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundSize: '40px 40px',
        backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)`,
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }} />

      {/* Subtle violet glow behind text */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '10%',
        width: '600px',
        height: '300px',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)',
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}
        >
          {/* Badge */}
          <motion.div variants={itemVariants} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.12)',
              color: '#7c3aed',
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.5rem 1rem',
              borderRadius: '100px',
              fontFamily: "'Cabinet Grotesk', sans-serif",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
              Bêta ouverte
            </span>
          </motion.div>

          {/* H1 - Medium weight, precise */}
          <motion.h1
            variants={titleVariants}
            style={{
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              lineHeight: 1,
              color: '#1A1A1A',
              margin: '0 0 1.5rem',
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >
            <span style={{ fontWeight: 300 }}>Vos rendez</span>
            <span style={{ fontWeight: 300 }}>-vous,</span>
            <br />
            <span style={{ fontWeight: 500, color: '#0F0E0C' }}>enfin </span>
            <span style={{ 
              fontWeight: 500,
              display: 'inline-block',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #7C3AED, #F02AD3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
              }}>maîtrisés.</span>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={itemVariants} 
            style={{ 
              fontSize: 'clamp(1rem, 1.3vw, 1.25rem)', 
              color: '#64748b', 
              lineHeight: 1.7, 
              fontFamily: "'Cabinet Grotesk', sans-serif", 
              fontWeight: 400, 
              maxWidth: '500px', 
              margin: '0 auto 2.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            Gérez vos RDV, vos clients et vos paiements depuis un seul endroit.
          </motion.p>

          {/* CTAs - Violet gradient primary */}
          <motion.div 
            variants={itemVariants} 
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}
          >
            <Link
              href="/sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '1rem 2rem',
                borderRadius: '100px',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #F02AD3)',
                color: 'white',
                fontFamily: "'Cabinet Grotesk', sans-serif",
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
              }}
              onMouseOver={(e: ME) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.35)'
              }}
              onMouseOut={(e: ME) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.25)'
              }}
            >
              Démarrer gratuitement <Icons.Arrow />
            </Link>
            <Link
              href="/client-sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '1rem 2rem',
                background: 'transparent',
                color: '#1A1A1A',
                borderRadius: '100px',
                fontWeight: 500,
                fontSize: '0.95rem',
                textDecoration: 'none',
                fontFamily: "'Cabinet Grotesk', sans-serif",
                border: '1px solid rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e: ME) => { 
                e.currentTarget.style.borderColor = '#7C3AED'
                e.currentTarget.style.color = '#7C3AED' 
              }}
              onMouseOut={(e: ME) => { 
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'
                e.currentTarget.style.color = '#1A1A1A' 
              }}
            >
              Espace Client
            </Link>
          </motion.div>

          {/* Metadata - Small, muted, below buttons */}
          <motion.div 
            variants={itemVariants} 
            style={{ 
              display: 'flex', 
              gap: '1.25rem', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              fontSize: '0.8rem',
              color: '#94a3b8',
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontWeight: 500,
              letterSpacing: '0.02em',
              marginTop: '0.75rem',
            }}
          >
            <span>0€ pour commencer</span>
            <span>Sans engagement</span>
            <span>RDV illimités</span>
          </motion.div>
        </motion.div>
      </div>
    </section>

    {/* INFINITE MARQUEE - Elegant Separator */}
    <div style={{
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
      zIndex: 1,
    }}>
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.05)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        background: '#F9F9F9',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Fade masks on edges - full height coverage */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: '100px',
          background: 'linear-gradient(to right, #F9F9F9 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100%',
          width: '100px',
          background: 'linear-gradient(to left, #F9F9F9 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none',
        }} />

      {/* Marquee content with Framer Motion */}
      <motion.div
        style={{
          display: 'flex',
          width: 'max-content',
          alignItems: 'center',
          height: '100%',
        }}
        animate={{
          x: [0, -50 + '%'],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 35,
            ease: 'linear',
          },
        }}
      >
        {[...Array(4)].map((_, setIndex) => (
          <div key={setIndex} style={{ display: 'flex', alignItems: 'center' }}>
            {[
              'Paiements sécurisés',
              'Rappels SMS automatiques',
              'Synchronisation Agenda',
              'Multi-collaborateurs',
              'Statistiques avancées',
              'Support 24/7',
              'Widget personnalisable',
              'API ouverte',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  padding: '0 1.25rem',
                }}>
                  {text}
                </span>
                {/* Violet diamond separator */}
                <svg width="5" height="5" viewBox="0 0 5 5" style={{ flexShrink: 0 }}>
                  <rect x="2.5" y="0.5" width="3" height="3" transform="rotate(45 2.5 2.5)" fill="#7C3AED" />
                </svg>
              </div>
            ))}
          </div>
        ))}
        </motion.div>
      </div>
    </div>

    {/* BENTO GRID SECTION - Engine Room Complex UI */}
    <section id="features" style={{
      padding: '6rem 8vw',
      background: '#FAF9F6',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Complex gradient backdrop */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '-10%',
        width: '120%',
        height: '60%',
        background: 'radial-gradient(ellipse 80% 50% at 30% 50%, rgba(124,58,237,0.04) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 70% 60%, rgba(240,42,211,0.03) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Grid Container - 12 Column Complex Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1.5rem',
        }}>
          {/* ROW 1: Payments (7 cols) + Performance with Live badge (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              gridColumn: 'span 7',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 16px 56px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'
            }}
          >
            {/* Gradient border effect */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '24px',
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(240,42,211,0.1), transparent)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
              pointerEvents: 'none',
            }} />
            
            {/* Header */}
            <div style={{ padding: '2rem 2rem 0', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h2 style={{ 
                  fontFamily: "'Cabinet Grotesk', sans-serif", 
                  fontSize: '1.1rem', 
                  fontWeight: 600, 
                  color: '#0F0E0C',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}>Paiement Intégré</h2>
                <span style={{
                  padding: '0.25rem 0.6rem',
                  background: 'rgba(124,58,237,0.1)',
                  borderRadius: '100px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: '#7C3AED',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                }}>Stripe</span>
              </div>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#64748b', 
                margin: 0,
                fontFamily: "'Cabinet Grotesk', sans-serif",
                fontWeight: 400,
              }}>Dr. Sophie Martin • Consultation récupération sportive</p>
            </div>

            {/* Complex layered UI */}
            <div style={{
              position: 'relative',
              flex: 1,
              marginTop: '1.5rem',
              background: 'linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%)',
              borderTop: '1px solid rgba(0,0,0,0.03)',
              borderRadius: '24px 24px 0 0',
              overflow: 'hidden',
            }}>
              {/* Subtle grid pattern */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />

              {/* Mini Calendar - Background layer */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  left: '2rem',
                  top: '2rem',
                  width: '260px',
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  padding: '1.25rem',
                  transform: 'rotate(-2deg)',
                  zIndex: 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Mar. 14 Jan</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F0E0C" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['09:00', '10:30', '14:00', '15:30'].map((time, i) => (
                    <div key={time} style={{
                      padding: '0.7rem 0',
                      borderRadius: '10px',
                      background: i === 1 ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'transparent',
                      border: i === 1 ? 'none' : '1px solid rgba(0,0,0,0.08)',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: i === 1 ? 'white' : '#64748b',
                      fontWeight: 500,
                      fontFamily: "'Cabinet Grotesk', sans-serif",
                      boxShadow: i === 1 ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                    }}>{time}</div>
                  ))}
                </div>
              </motion.div>

              {/* Payment Form - Foreground layer with shadow */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  right: '2rem',
                  bottom: '1rem',
                  width: '320px',
                  background: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                  padding: '1.75rem',
                  zIndex: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7C3AED, #F02AD3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F0E0C', margin: 0, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Claire Dubois</p>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>cliente@email.com</p>
                  </div>
                </div>

                <p style={{ 
                  fontSize: '2.4rem', 
                  fontWeight: 600, 
                  color: '#0F0E0C', 
                  margin: '0 0 1.25rem',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  letterSpacing: '-0.02em',
                }}>120,00 €</p>

                <div style={{
                  background: '#F8F9FA',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#635BFF">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                    </svg>
                    <span style={{ fontSize: '0.9rem', color: '#64748b', letterSpacing: '0.1em', fontFamily: "'Cabinet Grotesk', sans-serif" }}>•••• 4242</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    <span>12 / 28</span>
                    <span>CVC</span>
                  </div>
                </div>

                <button style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: 'linear-gradient(135deg, #7C3AED, #F02AD3)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                  transition: 'all 0.2s',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Confirmer & Payer
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Performance Block with Live Pulse Badge */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              gridColumn: 'span 5',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              minHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 16px 56px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'
            }}
          >
            {/* LIVE Pulse Badge */}
            <div style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.875rem',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: '100px',
              zIndex: 10,
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10B981', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Live</span>
            </div>

            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
              }
            `}</style>

            <div style={{ padding: '2rem' }}>
              <h2 style={{ 
                fontFamily: "'Cabinet Grotesk', sans-serif", 
                fontSize: '1.1rem', 
                fontWeight: 600, 
                color: '#0F0E0C',
                letterSpacing: '-0.01em',
                margin: '0 0 0.5rem',
              }}>Analytics</h2>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#64748b', 
                margin: 0,
                fontFamily: "'Cabinet Grotesk', sans-serif",
              }}>Croissance en temps réel</p>
            </div>

            <div style={{ padding: '0 2rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ 
                  fontSize: '4rem', 
                  fontWeight: 600, 
                  color: '#0F0E0C',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  letterSpacing: '-0.03em',
                }}>847</span>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#0F0E0C', margin: 0, fontFamily: "'Cabinet Grotesk', sans-serif" }}>RDV ce mois</p>
                  <p style={{ fontSize: '0.75rem', color: '#10B981', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      <polyline points="17 6 23 6 23 12"/>
                    </svg>
                    +23% vs mois dernier
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Sparkline */}
            <div style={{ marginTop: 'auto', height: '180px', position: 'relative' }}>
              <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }} viewBox="0 0 400 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED"/>
                    <stop offset="100%" stopColor="#F02AD3"/>
                  </linearGradient>
                </defs>
                <path d="M0,140 L0,120 C40,130 80,90 120,100 C160,110 200,60 240,70 C280,80 320,40 360,30 C380,25 390,15 400,10 L400,160 Z" fill="url(#perfGrad)" />
                <path d="M0,120 C40,130 80,90 120,100 C160,110 200,60 240,70 C280,80 320,40 360,30 C380,25 390,15 400,10" fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="400" cy="10" r="6" fill="#F02AD3" stroke="white" strokeWidth="3" />
              </svg>
            </div>
          </motion.div>

          {/* ROW 2: COEUR DU PRODUIT - Full Width Multi-View Block */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              gridColumn: 'span 12',
              background: '#FFFFFF',
              borderRadius: '28px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              minHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)'
              e.currentTarget.style.boxShadow = '0 24px 64px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.06)'
            }}
          >
            {/* Gradient border accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #7C3AED, #F02AD3, #7C3AED)',
            }} />
            
            {/* Header */}
            <div style={{ 
              padding: '2rem 2.5rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div>
                <h2 style={{ 
                  fontFamily: "'Cabinet Grotesk', sans-serif", 
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  color: '#0F0E0C',
                  letterSpacing: '-0.01em',
                  margin: '0 0 0.35rem',
                }}>Le Cœur de CalendaPro</h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Trois vues, un seul workflow fluide</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(124,58,237,0.1)',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#7C3AED',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                }}>Multi-vue</span>
                <span style={{
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(16,185,129,0.1)',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#10B981',
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                }}>Sync temps réel</span>
              </div>
            </div>

            {/* Multi-View Overlapping Interface */}
            <div style={{ 
              flex: 1, 
              position: 'relative', 
              background: 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 50%, #F8F9FA 100%)',
              overflow: 'hidden',
              padding: '2rem 2.5rem 3rem',
            }}>
              {/* Background pattern */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(124,58,237,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />

              {/* LEFT PANEL - Calendar View */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{
                  position: 'absolute',
                  left: '2.5rem',
                  top: '2rem',
                  width: '340px',
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  padding: '1.5rem',
                  zIndex: 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Semaine du 13-19 Jan</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                </div>
                
                {/* Day columns */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {['L', 'M', 'M', 'J', 'V'].map((day, i) => (
                    <div key={day} style={{ 
                      flex: 1, 
                      textAlign: 'center',
                      padding: '0.5rem 0',
                      borderRadius: '10px',
                      background: i === 2 ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'transparent',
                    }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: i === 2 ? 'white' : '#94a3b8',
                        fontFamily: "'Cabinet Grotesk', sans-serif",
                      }}>{day}</span>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 600, 
                        color: i === 2 ? 'white' : '#0F0E0C',
                        marginTop: '0.25rem',
                        fontFamily: "'Cabinet Grotesk', sans-serif",
                      }}>{13 + i}</div>
                    </div>
                  ))}
                </div>

                {/* Time slots with events */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { time: '09:00', client: 'Martin L.', service: 'Coaching', color: '#7C3AED' },
                    { time: '10:30', client: 'Sophie D.', service: 'Consultation', color: '#F02AD3' },
                    { time: '14:00', client: 'Pierre B.', service: 'Suivi', color: '#10B981' },
                  ].map((slot, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      background: '#F8F9FA',
                    }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: "'Cabinet Grotesk', sans-serif", width: '45px' }}>{slot.time}</span>
                      <div style={{ 
                        width: '4px', 
                        height: '24px', 
                        borderRadius: '2px', 
                        background: slot.color 
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>{slot.client}</p>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{slot.service}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CENTER PANEL - Client Details (Overlapping) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '380px',
                  background: 'white',
                  borderRadius: '24px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                  padding: '2rem',
                  zIndex: 10,
                }}
              >
                {/* Client Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'white',
                    fontFamily: "'Cabinet Grotesk', sans-serif",
                  }}>SM</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Sophie Martin</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>sophie.martin@email.com</p>
                  </div>
                  <div style={{
                    padding: '0.35rem 0.75rem',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(240,42,211,0.1))',
                    borderRadius: '100px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#7C3AED',
                    fontFamily: "'Cabinet Grotesk', sans-serif",
                  }}>Client VIP</div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'RDV total', value: '24' },
                    { label: 'Dépensé', value: '2.4k€' },
                    { label: 'Dernière', value: '2j' },
                  ].map((stat, i) => (
                    <div key={i} style={{ flex: 1, padding: '0.75rem', background: '#F8F9FA', borderRadius: '12px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 0.15rem', fontSize: '1.1rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>{stat.value}</p>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Next Appointment */}
                <div style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(240,42,211,0.05))',
                  borderRadius: '16px',
                  border: '1px solid rgba(124,58,237,0.1)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Prochain RDV</p>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Mercredi 15 Jan, 14:30</p>
                    </div>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7C3AED, #F02AD3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* RIGHT PANEL - Services Sidebar (Overlapping from right) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                style={{
                  position: 'absolute',
                  right: '2.5rem',
                  top: '2rem',
                  width: '280px',
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  padding: '1.5rem',
                  zIndex: 1,
                }}
              >
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Services</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { name: 'Coaching 1:1', price: '85€', booked: true },
                    { name: 'Consultation', price: '120€', booked: false },
                    { name: 'Suivi mensuel', price: '45€', booked: false },
                    { name: 'Pack 5 séances', price: '375€', booked: false },
                  ].map((service, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: service.booked ? 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(240,42,211,0.05))' : '#F8F9FA',
                      border: service.booked ? '1px solid rgba(124,58,237,0.2)' : 'none',
                    }}>
                      <div>
                        <p style={{ margin: '0 0 0.15rem', fontSize: '0.85rem', fontWeight: service.booked ? 600 : 500, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>{service.name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: service.booked ? '#7C3AED' : '#94a3b8' }}>{service.booked ? 'Réservé aujourd\'hui' : 'Disponible'}</p>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: service.booked ? '#7C3AED' : '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>{service.price}</span>
                    </div>
                  ))}
                </div>

                <button style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#0F0E0C',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  cursor: 'pointer',
                }}>
                  + Nouveau service
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* ROW 3: Sync Auto with Syncing pulse */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              gridColumn: 'span 4',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'
            }}
          >
            {/* Syncing Pulse Badge */}
            <div style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.6rem',
              background: 'rgba(59,130,246,0.1)',
              borderRadius: '100px',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#3B82F6',
                animation: 'pulse 1.5s infinite',
              }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3B82F6', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Syncing</span>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ 
                fontFamily: "'Cabinet Grotesk', sans-serif", 
                fontSize: '1rem', 
                fontWeight: 600, 
                color: '#0F0E0C',
                letterSpacing: '-0.01em',
                margin: '0 0 0.25rem',
              }}>Sync Universal</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Google · Outlook · Apple</p>
            </div>
            
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              padding: '0 1.5rem 1.5rem',
            }}>
              <svg style={{ position: 'absolute', width: '70%', height: '50px' }} viewBox="0 0 200 50">
                <path d="M40,25 L100,25" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M100,25 L160,25" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="100" cy="25" r="4" fill="#7C3AED">
                  <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #7C3AED, #F02AD3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </div>
                
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="18" rx="4" fill="#FF9500"/>
                    <path d="M2 10h20" stroke="white" strokeWidth="1.5"/>
                    <text x="12" y="19" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">31</text>
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ROW 3: Smart Reminders with Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              gridColumn: 'span 8',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ 
                  fontFamily: "'Cabinet Grotesk', sans-serif", 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  color: '#0F0E0C',
                  letterSpacing: '-0.01em',
                  margin: '0 0 0.25rem',
                }}>Workflow Automatique</h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>De la réservation au suivi</p>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(240,42,211,0.1))',
                borderRadius: '100px',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #F02AD3)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7C3AED', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Automatique</span>
              </div>
            </div>
            
            {/* Timeline */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              padding: '1.5rem 2rem 2rem',
              position: 'relative',
            }}>
              {/* Timeline connector line */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '3rem',
                right: '3rem',
                height: '2px',
                background: 'linear-gradient(90deg, #7C3AED, #F02AD3, #10B981)',
                transform: 'translateY(-50%)',
                zIndex: 0,
              }} />
              
              {/* Timeline Steps */}
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                {/* Step 1: RDV Pris */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                      <path d="M9 16l2 2 4-4"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 0.15rem', fontSize: '0.85rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>RDV Confirmé</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Marie D. • 14h30</p>
                  </div>
                </div>

                {/* Step 2: SMS J-1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7C3AED, #F02AD3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 0.15rem', fontSize: '0.85rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>SMS J-1</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Rappel auto envoyé</p>
                  </div>
                </div>

                {/* Step 3: Note de suivi */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 0.15rem', fontSize: '0.85rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Note de Suivi</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>CR auto généré</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ROW 4: Team & Permissions */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              gridColumn: 'span 6',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ 
                fontFamily: "'Cabinet Grotesk', sans-serif", 
                fontSize: '1rem', 
                fontWeight: 600, 
                color: '#0F0E0C',
                letterSpacing: '-0.01em',
                margin: '0 0 0.25rem',
              }}>Équipe & Rôles</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Dr. Martin et collaborateurs</p>
            </div>
            
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '2rem',
              padding: '0 1.5rem 1.5rem',
            }}>
              {/* Dr. Martin - Admin */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #F02AD3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 600, color: 'white', fontFamily: "'Cabinet Grotesk', sans-serif", boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>SM</div>
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-8px', padding: '0.25rem 0.6rem', background: '#0F0E0C', borderRadius: '100px', fontSize: '0.7rem', color: 'white', fontWeight: 600, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Admin</div>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', fontWeight: 600, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Dr. Martin</p>
              </div>
              
              {/* Jean - Employé */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #667EEA, #764BA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, color: 'white', fontFamily: "'Cabinet Grotesk', sans-serif" }}>JD</div>
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-8px', padding: '0.2rem 0.5rem', background: '#7C3AED', borderRadius: '100px', fontSize: '0.65rem', color: 'white', fontWeight: 600, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Staff</div>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', fontWeight: 500, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Jean D.</p>
              </div>
              
              {/* Alice - Lecture */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #4FACFE, #00F2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, color: 'white', fontFamily: "'Cabinet Grotesk', sans-serif" }}>AL</div>
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-12px', padding: '0.2rem 0.5rem', background: '#94a3b8', borderRadius: '100px', fontSize: '0.65rem', color: 'white', fontWeight: 600, fontFamily: "'Cabinet Grotesk', sans-serif" }}>Invité</div>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', fontWeight: 500, color: '#0F0E0C', fontFamily: "'Cabinet Grotesk', sans-serif" }}>Alice L.</p>
              </div>
            </div>
          </motion.div>

          {/* ROW 4: Widget with Beta Badge */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              gridColumn: 'span 6',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.5s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'
            }}
          >
            {/* Beta Badge */}
            <div style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              padding: '0.3rem 0.7rem',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              borderRadius: '100px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'white',
              fontFamily: "'Cabinet Grotesk', sans-serif",
            }}>BETA</div>

            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ 
                fontFamily: "'Cabinet Grotesk', sans-serif", 
                fontSize: '1rem', 
                fontWeight: 600, 
                color: '#0F0E0C',
                letterSpacing: '-0.01em',
                margin: '0 0 0.25rem',
              }}>Brand Studio</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Votre widget, votre identité</p>
            </div>
            
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0 1.5rem 1.5rem',
              gap: '1.5rem',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { color: '#7C3AED', name: 'Violet' },
                  { color: '#F02AD3', name: 'Rose' },
                  { color: '#0F0E0C', name: 'Noir' },
                  { color: '#10B981', name: 'Vert' },
                ].map((c, i) => (
                  <div key={c.color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: c.color,
                      border: i === 0 ? '3px solid #0F0E0C' : '3px solid transparent',
                      boxShadow: i === 0 ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                    }} />
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: "'Cabinet Grotesk', sans-serif" }}>{c.name}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                padding: '1.25rem', 
                background: '#F8F9FA', 
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                <div style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'linear-gradient(135deg, #7C3AED, #F02AD3)', 
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                }}>
                  Réserver maintenant
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
    </>
  )
}

// ─── SECTION WRAPPERS ─────────────────────────────────────────────────────────
function ScrollCalendarSection() {
  return (
    <section id="scroll-calendar" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
        <ScrollCalendar />
      </div>
    </section>
  )
}

function SmartNotificationsSection() {
  return (
    <section id="smart-notifications" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF9F6', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
        <SmartNotifications />
      </div>
    </section>
  )
}

// ─── PRICING ───────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Starter',
    price: '0',
    period: '/ mois',
    features: ['10 RDV gratuits', 'Mini-site de base', 'Rappels email', 'Paiement sécurisé', 'Widget simple'],
    cta: 'Commencer gratuit',
    href: '/sign-up?planId=starter',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '19',
    period: '/ mois',
    features: ['RDV illimités', 'Mini-site personnalisé', 'Rappels SMS + Email', 'Paiement intégré', 'Widget avancé', 'Support prioritaire'],
    cta: 'Choisir Premium',
    href: '/sign-up?planId=premium',
    highlight: true,
  },
  {
    name: 'Infinity',
    price: '49',
    period: '/ mois',
    badge: 'IA',
    features: ['Tout Premium inclus', 'Assistant IA (200 SMS/mois)', 'Automatisations avancées', 'Priorité Marketplace', 'Sous-domaine personnalisé', 'Accès API'],
    cta: 'Découvrir Infinity',
    href: '/sign-up?planId=infinity',
    highlight: false,
  },
]

function PricingPlan({ plan, index }: { plan: typeof plans[0], index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay: index * 0.15, type: 'spring', stiffness: 80, damping: 20 }}
      style={{ 
        position: 'relative',
        background: plan.highlight ? '#0f172a' : '#ffffff',
        borderRadius: '20px',
        padding: '2.5rem',
        border: plan.highlight ? '2px solid rgba(124, 58, 237, 0.5)' : '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {plan.highlight && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
          style={{ 
            position: 'absolute', 
            top: '-6px', 
            left: 'calc(50% - 50px)', 
            transform: 'translateX(-50%)', 
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)', 
            color: 'white', 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            letterSpacing: '0.08em', 
            textTransform: 'uppercase', 
            padding: '0.4rem 1.4rem', 
            borderRadius: '100px', 
            fontFamily: 'Clash Display, sans-serif',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          Recommandé
        </motion.div>
      )}
      
      {plan.badge && (
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.3rem 0.8rem', borderRadius: '100px', fontFamily: 'Clash Display, sans-serif' }}>
          {plan.badge}
        </div>
      )}
      
      <div>
        <div style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: plan.highlight ? '#a78bfa' : '#7c3aed', marginBottom: '1rem' }}>
          {plan.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '3.8rem', fontWeight: 700, letterSpacing: '-0.04em', color: plan.highlight ? 'white' : '#0f172a', lineHeight: 1 }}>
            {plan.price}€
          </span>
          <span style={{ fontSize: '0.9rem', color: plan.highlight ? '#94a3b8' : '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
            {plan.period}
          </span>
        </div>
      </div>
      
      <div style={{ width: '100%', height: '1px', background: plan.highlight ? 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)' : 'rgba(0,0,0,0.06)' }} />
      
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem', flexGrow: 1 }}>
        {plan.features.map((feature) => (
          <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: plan.highlight ? '#cbd5e1' : '#475569', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? '#a78bfa' : '#7c3aed'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      
      <Link href={plan.href} style={{ display: 'block', textAlign: 'center', padding: '1rem 1.5rem', borderRadius: '16px', background: plan.highlight ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'transparent', color: plan.highlight ? 'white' : '#7c3aed', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Clash Display, sans-serif', border: plan.highlight ? 'none' : '1.5px solid rgba(124,58,237,0.3)', transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)', boxShadow: plan.highlight ? '0 8px 32px rgba(124,58,237,0.3)' : 'none' }}>
        {plan.cta}
      </Link>
    </motion.div>
  )
}

function Pricing() {
  return (
    <section id="pricing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF9F6', position: 'relative' }}>
      <DotsBackground enableParallax={false} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 1, width: '100%', transform: 'translateX(-300px)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 0.9rem', borderRadius: '100px', fontFamily: 'Clash Display, sans-serif', marginBottom: '1.5rem' }}>
            <span className="badge-dot" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }} />
            Tarifs transparents
          </span>
          <h2 style={{ fontFamily: 'Clash Display, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f172a', marginBottom: '1rem' }}>
            Des prix qui ont du sens<span style={{ opacity: 0.4 }}>.</span>
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '500px', margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
            Commencez gratuit, évoluez selon vos besoins. Sans engagement.
          </p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }} className="pricing-grid">
          {plans.map((plan, index) => (
            <PricingPlan key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ──────────────────────────────────────────────────────────────
const testimonials = [
  { name: 'Marie L.', role: 'Ostéopathe', content: 'CalendaPro a transformé ma gestion de rendez-vous. Je gagne 2 heures par jour.', avatar: 'ML' },
  { name: 'Thomas B.', role: 'Photographe', content: 'Le paiement à la réservation est un game changer. Plus de no-shows.', avatar: 'TB' },
  { name: 'Sophie D.', role: 'Coach Sportif', content: 'Mes clients adorent la simplicité de prise de RDV. Super outil !', avatar: 'SD' },
  { name: 'Lucas M.', role: 'Coiffeur', content: 'Enfin un outil adapté aux indépendants. Le support est top.', avatar: 'LM' },
  { name: 'Emma R.', role: 'Esthéticienne', content: 'Les rappels automatiques ont réduit mes absences de 40%.', avatar: 'ER' },
  { name: 'Julien P.', role: 'Thérapeute', content: 'Interface élégante et intuitive. Je recommande à 100%.', avatar: 'JP' },
]

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div style={{ 
      flexShrink: 0,
      width: '350px',
      background: 'rgba(255,255,255,0.03)', 
      border: '1px solid rgba(255,255,255,0.08)', 
      borderRadius: '16px', 
      padding: '1.5rem',
    }}>
      <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem', fontFamily: 'DM Sans, sans-serif' }}>"{t.content}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
          {t.avatar}
        </div>
        <div>
          <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>{t.name}</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>{t.role}</div>
        </div>
      </div>
    </div>
  )
}

function Testimonials() {
  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials]
  
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 1, width: '100%' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'Clash Display, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', color: 'white', marginBottom: '1rem' }}>
            Ils nous font confiance<span style={{ opacity: 0.4 }}>.</span>
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
            Rejoignez des milliers de professionnels qui simplifient leur quotidien.
          </p>
        </motion.div>

        {/* Infinite Marquee Container with mask gradient */}
        <div style={{
          position: 'relative',
          width: '100%',
          maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}>
          {/* First row - scrolling left */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            animation: 'marquee 40s linear infinite',
            width: 'max-content',
          }}>
            {duplicatedTestimonials.map((t, i) => (
              <TestimonialCard key={`row1-${i}`} t={t} />
            ))}
          </div>
          
          {/* Second row - scrolling right (offset) */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '1.5rem',
            animation: 'marqueeReverse 50s linear infinite',
            width: 'max-content',
          }}>
            {[...duplicatedTestimonials].reverse().map((t, i) => (
              <TestimonialCard key={`row2-${i}`} t={t} />
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
          {[
            { value: '500+', label: 'Professionnels' },
            { value: '50k+', label: 'RDV gérés' },
            { value: '4.9', label: 'Note moyenne' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* CSS Keyframes for marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marqueeReverse {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  )
}

// ─── CTA FINAL ─────────────────────────────────────────────────────────────────
function CtaFinal() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF9F6', position: 'relative' }}>
      <DotsBackground enableParallax={false} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center', position: 'relative', zIndex: 1, transform: 'translateX(-250px)' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 0.9rem', borderRadius: '100px', fontFamily: 'Clash Display, sans-serif', marginBottom: '2rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
            Prêt à essayer ?
          </span>
          <h2 style={{ fontFamily: 'Clash Display, sans-serif', fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#121212', marginBottom: '1.5rem', lineHeight: 1.05 }}>
            Prenez le contrôle<span style={{ opacity: 0.4 }}>.</span>
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '3rem', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif', fontWeight: 300, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            CalendaPro vous aide à gérer votre activité sans y passer la journée.<br />
            <strong style={{ color: '#7c3aed', fontWeight: 600 }}>Inscrivez-vous pour la bêta.</strong>
          </p>
          <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '1.1rem 2.5rem', borderRadius: '100px', fontWeight: 600, fontSize: '1.05rem', textDecoration: 'none', fontFamily: 'Clash Display, sans-serif', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', boxShadow: '0 8px 40px rgba(124,58,237,0.4)' }}>
            Créer mon compte pro <Icons.Arrow />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#0f172a', padding: '4rem 2rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }} className="footer-grid">
          <div>
            <BrandLogo href="/" variant="dark" />
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.75, fontFamily: 'DM Sans, sans-serif', maxWidth: '280px', marginTop: '1rem' }}>
              Un outil simple pour gérer vos rendez-vous et votre activité au quotidien.
            </p>
          </div>
          {[
            { title: 'Produit', links: [{ l: 'Fonctionnalités', h: '#features' }, { l: 'Tarifs', h: '#pricing' }, { l: 'Marketplace', h: '/marketplace' }, { l: 'Widget', h: '/dashboard/widget' }] },
            { title: 'Ressources', links: [{ l: 'Documentation', h: '/documentation' }, { l: 'Blog', h: '/blog' }, { l: 'Support', h: '/support' }, { l: 'API', h: '/documentation' }] },
            { title: 'Légal', links: [{ l: 'CGU', h: '/cgu' }, { l: 'Confidentialité', h: '/confidentialite' }, { l: 'Mentions légales', h: '/mentions-legales' }, { l: 'Contact', h: '/contact' }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569', marginBottom: '1rem' }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {col.links.map(link => (
                  <li key={link.l}>
                    <a href={link.h} style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s' }} onMouseOver={(e: ME) => (e.currentTarget.style.color = '#a78bfa')} onMouseOut={(e: ME) => (e.currentTarget.style.color = '#64748b')}>
                      {link.l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: '#475569', fontFamily: 'DM Sans, sans-serif' }}>
          <span>© 2026 CalendaPro. Tous droits réservés.</span>
          <span>Conçu à Paris pour les indépendants français</span>
        </div>
      </div>
    </footer>
  )
}

// ─── SECTION WRAPPERS FOR 5-6-7 ───────────────────────────────────────────────
// Section 5: MetierSection - Dark mode (full width, no constraints)
function MetierSectionWrapper() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'relative', width: '100%' }}>
      <MetierSection />
    </section>
  )
}

// Section 6: TechDemoSection - Light mode (full width, no constraints)
function TechDemoSectionWrapper() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF9F6', position: 'relative', width: '100%' }}>
      <div style={{ width: '100%', height: '100%' }}>
        <TechDemoSection />
      </div>
    </section>
  )
}

// Section 7: VisionSection - Dark mode (full width, no constraints)
function VisionSectionWrapper() {
  return (
    <section style={{ minHeight: '100vh', background: '#0f172a', position: 'relative', width: '100%' }}>
      <VisionSection />
    </section>
  )
}

// ─── LANDING PAGE ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main style={{ background: '#0f172a', position: 'relative', overflowX: 'hidden' }}>
      <Nav />
      <Hero />
      <ScrollCalendarSection />
      <SmartNotificationsSection />
      <MetierSectionWrapper />
      <TechDemoSectionWrapper />
      <VisionSectionWrapper />
      <Pricing />
      <Testimonials />
      <CtaFinal />
      <Footer />
    </main>
  )
}

