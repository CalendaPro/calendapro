'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

// ─── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#FAFAF9',
  bgDark: '#09090E',
  card: '#FFFFFF',
  text: '#0A0A0A',
  muted: '#6B7280',
  onDark: '#F0EFF5',
  onDarkMuted: 'rgba(240,239,245,0.55)',
  onDarkFaint: 'rgba(240,239,245,0.45)',
  onDarkDim: 'rgba(240,239,245,0.7)',
  violet: '#7C3AED',
  pink: '#EC4899',
  grad: 'linear-gradient(135deg, #7C3AED, #EC4899)',
  border: '#E5E7EB',
  borderDark: 'rgba(255,255,255,0.07)',
}

const F = {
  display: "'Clash Display', 'DM Sans', sans-serif",
  sans: "'DM Sans', system-ui, -apple-system, sans-serif",
}

// ─── ANIMATION HELPERS ─────────────────────────────────────────────────────────
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}
const sectionTransition = { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }
const sectionViewport = { once: true, margin: '-80px' }

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }> = ({ children, delay = 0, className, style }) => (
  <motion.div
    variants={sectionVariants}
    initial="hidden"
    whileInView="visible"
    viewport={sectionViewport}
    transition={{ ...sectionTransition, delay }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
)

// ─── ATOMS ─────────────────────────────────────────────────────────────────────
const GradText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span
    style={{
      background: C.grad,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      ...style,
    }}
  >
    {children}
  </span>
)

const TagPill: React.FC<{ children: React.ReactNode; tone?: 'light' | 'dark' }> = ({ children, tone = 'light' }) => {
  if (tone === 'dark') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.25)',
          color: '#A78BFA',
          fontFamily: F.sans,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '6px 14px',
          borderRadius: 100,
        }}
      >
        {children}
      </span>
    )
  }
  return (
    <span
      style={{
        display: 'inline-block',
        background: '#F3F0FF',
        border: '1px solid #DDD6FE',
        color: C.violet,
        fontFamily: F.sans,
        fontSize: 13,
        fontWeight: 600,
        padding: '6px 18px',
        borderRadius: 100,
      }}
    >
      {children}
    </span>
  )
}

const PrimaryButton: React.FC<{
  href: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
  shadow?: 'normal' | 'strong'
}> = ({ href, children, size = 'md', shadow = 'normal' }) => {
  const dims =
    size === 'xl'
      ? { height: 64, padding: '0 52px', fontSize: 18 }
      : size === 'lg'
      ? { height: 56, padding: '0 36px', fontSize: 17 }
      : { height: 36, padding: '0 20px', fontSize: 14 }
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: dims.height,
        padding: dims.padding,
        background: C.grad,
        color: '#fff',
        fontFamily: F.sans,
        fontWeight: 700,
        fontSize: dims.fontSize,
        borderRadius: 100,
        textDecoration: 'none',
        boxShadow:
          shadow === 'strong'
            ? '0 16px 48px rgba(124,58,237,0.4)'
            : '0 8px 24px rgba(124,58,237,0.28)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
      }}
      onMouseDown={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'scale(0.97)'
      }}
      onMouseUp={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
      }}
    >
      {children}
    </Link>
  )
}

const SecondaryButton: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link
    href={href}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      padding: '0 36px',
      background: 'transparent',
      color: C.text,
      fontFamily: F.sans,
      fontWeight: 700,
      fontSize: 17,
      borderRadius: 100,
      border: `1.5px solid ${C.border}`,
      textDecoration: 'none',
      transition: 'all 200ms ease',
    }}
    onMouseEnter={(e) => {
      ;(e.currentTarget as HTMLAnchorElement).style.borderColor = C.violet
      ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
    }}
    onMouseLeave={(e) => {
      ;(e.currentTarget as HTMLAnchorElement).style.borderColor = C.border
      ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
    }}
  >
    {children}
  </Link>
)

const Section: React.FC<{
  background: 'light' | 'dark'
  children: React.ReactNode
  style?: React.CSSProperties
  id?: string
}> = ({ background, children, style, id }) => (
  <section
    id={id}
    style={{
      background: background === 'dark' ? C.bgDark : C.bg,
      color: background === 'dark' ? C.onDark : C.text,
      padding: '160px 0',
      ...style,
    }}
  >
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>{children}</div>
  </section>
)

// ─── NAVBAR (floating pill island) ─────────────────────────────────────────────
const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Démo', href: '#demo' },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'fit-content',
        minWidth: 700,
        maxWidth: 920,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 8px 0 24px',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(250,250,249,0.88)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 100,
        boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.10)' : '0 4px 20px rgba(0,0,0,0.07)',
        transition: 'all 400ms ease',
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 17,
          color: C.text,
          textDecoration: 'none',
          marginRight: 12,
          letterSpacing: '-0.01em',
        }}
      >
        Calenda<GradText>Pro</GradText>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginRight: 'auto' }}>
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: F.sans,
              fontSize: 14,
              fontWeight: 500,
              color: C.muted,
              padding: '8px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'background 160ms ease, color 160ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,0,0,0.04)'
              ;(e.currentTarget as HTMLAnchorElement).style.color = C.text
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLAnchorElement).style.color = C.muted
            }}
          >
            {item.label}
          </a>
        ))}
      </div>

      <PrimaryButton href="/login">Commencer</PrimaryButton>
    </nav>
  )
}

// ─── HERO ──────────────────────────────────────────────────────────────────────
const Hero: React.FC = () => (
  <section
    style={{
      background: C.bg,
      padding: '160px 0 100px',
      textAlign: 'center',
    }}
  >
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <FadeUp>
        <div style={{ marginBottom: 28 }}>
          <TagPill>Bêta ouverte — places limitées</TagPill>
        </div>
      </FadeUp>

      <FadeUp delay={0.05}>
        <h1
          style={{
            fontFamily: F.display,
            fontWeight: 800,
            fontSize: 'clamp(64px, 9vw, 104px)',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: C.text,
            margin: 0,
          }}
        >
          Vos rendez-vous,
          <br />
          enfin <GradText>maîtrisés.</GradText>
        </h1>
      </FadeUp>

      <FadeUp delay={0.1}>
        <p
          style={{
            fontFamily: F.sans,
            fontSize: 20,
            lineHeight: 1.55,
            color: C.muted,
            maxWidth: 460,
            margin: '32px auto 0',
          }}
        >
          Réservations automatiques, zéro no-show, nouveaux clients. En 5 minutes.
        </p>
      </FadeUp>

      <FadeUp delay={0.15}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            marginTop: 40,
            flexWrap: 'wrap',
          }}
        >
          <PrimaryButton href="/login" size="lg" shadow="strong">
            Démarrer gratuitement
          </PrimaryButton>
          <SecondaryButton href="#demo">Voir la démo</SecondaryButton>
        </div>
      </FadeUp>

      <FadeUp delay={0.2}>
        <p
          style={{
            fontFamily: F.sans,
            fontSize: 13,
            color: '#9CA3AF',
            marginTop: 22,
          }}
        >
          Aucune carte bancaire · Annulation à tout moment
        </p>
      </FadeUp>

      {/* Dashboard mockup */}
      <FadeUp delay={0.25}>
        <DashboardMockup />
      </FadeUp>
    </div>
  </section>
)

const DashboardMockup: React.FC = () => {
  const stats = [
    { label: 'Réservations', value: 'Cette semaine', accent: '#F3F0FF' },
    { label: 'No-shows', value: 'Évités', accent: '#FFF5FA' },
    { label: 'Revenus', value: 'Encaissés', accent: '#F3F0FF' },
    { label: 'Nouveaux clients', value: 'Marketplace', accent: '#FFF5FA' },
  ]
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
  const slots: Array<{ day: number; start: number; len: number; color: string; label: string }> = [
    { day: 0, start: 1, len: 2, color: '#7C3AED', label: 'Coupe + Barbe' },
    { day: 1, start: 0, len: 1, color: '#EC4899', label: 'Coupe' },
    { day: 1, start: 3, len: 2, color: '#7C3AED', label: 'Coloration' },
    { day: 2, start: 2, len: 3, color: '#EC4899', label: 'Soin barbe' },
    { day: 3, start: 1, len: 2, color: '#7C3AED', label: 'Coupe' },
    { day: 4, start: 0, len: 2, color: '#EC4899', label: 'Coupe enfant' },
    { day: 4, start: 4, len: 2, color: '#7C3AED', label: 'Forfait' },
  ]
  const hours = ['09', '10', '11', '12', '13', '14', '15']
  return (
    <div
      style={{
        maxWidth: 960,
        margin: '80px auto 0',
        background: '#fff',
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        boxShadow: '0 40px 80px -20px rgba(0,0,0,0.14)',
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      {/* macOS bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          background: '#FAFAF9',
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
        <span
          style={{
            marginLeft: 14,
            fontFamily: F.sans,
            fontSize: 12,
            color: '#9CA3AF',
            fontWeight: 500,
          }}
        >
          calendapro.app/dashboard
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          padding: 28,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: s.accent,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.text, marginTop: 8 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Week calendar */}
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.text }}>Semaine en cours</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Jour', 'Semaine', 'Mois'].map((t, i) => (
              <span
                key={t}
                style={{
                  fontFamily: F.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: i === 1 ? '#fff' : C.muted,
                  background: i === 1 ? C.grad : '#F3F4F6',
                  padding: '6px 14px',
                  borderRadius: 100,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)', gap: 8 }}>
          {/* hours column */}
          <div>
            <div style={{ height: 28 }} />
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  height: 36,
                  fontFamily: F.sans,
                  fontSize: 11,
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingRight: 6,
                }}
              >
                {h}h
              </div>
            ))}
          </div>
          {/* day columns */}
          {days.map((d, di) => (
            <div key={d} style={{ position: 'relative' }}>
              <div
                style={{
                  height: 28,
                  fontFamily: F.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {d}
              </div>
              <div
                style={{
                  position: 'relative',
                  background: '#FAFAF9',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  height: hours.length * 36,
                }}
              >
                {hours.map((_, hi) => (
                  <div
                    key={hi}
                    style={{
                      position: 'absolute',
                      top: hi * 36,
                      left: 0,
                      right: 0,
                      height: 36,
                      borderTop: hi === 0 ? 'none' : `1px solid ${C.border}`,
                    }}
                  />
                ))}
                {slots
                  .filter((s) => s.day === di)
                  .map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        top: s.start * 36 + 3,
                        left: 6,
                        right: 6,
                        height: s.len * 36 - 6,
                        background:
                          s.color === '#7C3AED'
                            ? 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(124,58,237,0.78))'
                            : 'linear-gradient(135deg, rgba(236,72,153,0.95), rgba(236,72,153,0.78))',
                        borderRadius: 8,
                        padding: '6px 8px',
                        fontFamily: F.sans,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      {s.label}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TICKER (single row) ───────────────────────────────────────────────────────
const Ticker: React.FC = () => {
  const items = [
    'BARBIERS',
    'COACHS',
    'PHOTOGRAPHES',
    'TATOUEURS',
    'ESTHÉTICIENNES',
    'CONSULTANTS',
    'FREELANCES',
    'ARTISTES',
  ]
  const Row = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, paddingRight: 28 }}>
      {items.map((label, i) => (
        <React.Fragment key={i}>
          <span
            style={{
              fontFamily: F.sans,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#C4C4C4',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.violet, flexShrink: 0 }} />
        </React.Fragment>
      ))}
    </div>
  )
  return (
    <div
      style={{
        background: C.bg,
        borderTop: '1px solid #F3F4F6',
        borderBottom: '1px solid #F3F4F6',
        padding: '16px 0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 'max-content',
          animation: 'cp-ticker 24s linear infinite',
        }}
      >
        {Row}
        {Row}
      </div>
    </div>
  )
}

// ─── PROBLEM (dark) ────────────────────────────────────────────────────────────
const ProblemSection: React.FC = () => {
  const cols = [
    {
      title: 'No-shows',
      body: 'Un rendez-vous manqué, c’est un créneau qui ne se rattrape jamais. Et le silence d’un client qui ne reviendra pas.',
    },
    {
      title: 'Temps perdu',
      body: 'Confirmations par texto, relances, double-saisie d’agenda. Des heures qui auraient dû servir à votre métier.',
    },
    {
      title: 'Revenus volatilisés',
      body: 'Les acomptes, les paiements et les clients réguliers se diluent quand le suivi est manuel. Ce qui n’est pas mesuré ne se récupère pas.',
    },
  ]
  return (
    <Section background="dark">
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <TagPill tone="dark">Le vrai problème</TagPill>
        </div>
      </FadeUp>
      <FadeUp delay={0.05}>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 'clamp(44px, 6vw, 76px)',
            fontWeight: 800,
            color: C.onDark,
            textAlign: 'center',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
          }}
        >
          Chaque no-show, c’est
          <br />
          <GradText>de l’argent perdu</GradText> pour toujours.
        </h2>
      </FadeUp>
      <FadeUp delay={0.1}>
        <p
          style={{
            fontFamily: F.sans,
            fontSize: 19,
            lineHeight: 1.7,
            color: C.onDarkMuted,
            maxWidth: 540,
            margin: '32px auto 0',
            textAlign: 'center',
          }}
        >
          Un créneau vide ne se récupère pas. Une heure de travail perdue reste perdue. CalendaPro transforme ce problème en avantage avant qu’il n’arrive.
        </p>
      </FadeUp>

      <div
        style={{
          marginTop: 88,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          border: `1px solid ${C.borderDark}`,
          borderRadius: 0,
        }}
      >
        {cols.map((col, i) => (
          <FadeUp key={col.title} delay={i * 0.07}>
            <div
              style={{
                padding: '48px 40px',
                borderRight: i < cols.length - 1 ? `1px solid ${C.borderDark}` : 'none',
                minHeight: 240,
              }}
            >
              <h3
                style={{
                  fontFamily: F.display,
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.onDark,
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                }}
              >
                {col.title}
              </h3>
              <p
                style={{
                  fontFamily: F.sans,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: C.onDarkFaint,
                  margin: 0,
                }}
              >
                {col.body}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  )
}

// ─── METIERS (light, interactive) ──────────────────────────────────────────────
type Metier = {
  key: string
  label: string
  tag: string
  title: string
  description: string
  features: string[]
}
const METIERS: Metier[] = [
  {
    key: 'barbier',
    label: 'Barbiers',
    tag: 'Salons & barbiers',
    title: 'L’agenda qui pense pour votre salon.',
    description:
      'Réservation en ligne, fiche client persistante, et acomptes systématiques pour les services longs. Plus jamais d’appels pour confirmer.',
    features: [
      'Acompte automatique sur les forfaits',
      'Préférences clients sauvegardées',
      'Rappels SMS la veille',
    ],
  },
  {
    key: 'coach',
    label: 'Coachs',
    tag: 'Sport & coaching',
    title: 'Vos séances, sans relances.',
    description:
      'Vos clients réservent leur créneau et reçoivent automatiquement leur préparation. Vous gardez la tête dans le coaching, pas dans WhatsApp.',
    features: [
      'Forfaits récurrents',
      'Confirmation automatique 24h avant',
      'Annulations encadrées',
    ],
  },
  {
    key: 'photo',
    label: 'Photographes',
    tag: 'Studios & photographes',
    title: 'Des shootings cadrés, payés.',
    description:
      'Acompte à la réservation, brief client envoyé d’office, dossier partagé prêt. Vous arrivez sur le shoot serein.',
    features: [
      'Acompte non remboursable',
      'Brief envoyé automatiquement',
      'Galerie privée par client',
    ],
  },
  {
    key: 'tatoueur',
    label: 'Tatoueurs',
    tag: 'Studios de tatouage',
    title: 'L’agenda d’un studio sérieux.',
    description:
      'Acompte obligatoire, fiche projet centralisée, suivi des phases. Les rendez-vous fantômes appartiennent au passé.',
    features: [
      'Acompte avant validation',
      'Fiche projet par client',
      'Annulations payantes',
    ],
  },
  {
    key: 'esthe',
    label: 'Esthéticiennes',
    tag: 'Instituts & esthétique',
    title: 'Un institut qui tourne tout seul.',
    description:
      'Cures, abonnements, cabines : chaque service trouve sa logique. Les clientes reviennent parce que c’est simple.',
    features: [
      'Forfaits multi-séances',
      'Rappels personnalisés',
      'Carte de fidélité intégrée',
    ],
  },
  {
    key: 'conseil',
    label: 'Consultants',
    tag: 'Conseil & expertise',
    title: 'Votre temps a un prix. Tenez-le.',
    description:
      'Tarification par durée, paiement en amont, fuseaux horaires gérés. Vous facturez votre vraie valeur.',
    features: [
      'Paiement à la réservation',
      'Multi-fuseau horaire',
      'Salle de visio intégrée',
    ],
  },
]

const MetiersSection: React.FC = () => {
  const [active, setActive] = useState(0)
  const m = METIERS[active]

  return (
    <Section background="light">
      <FadeUp>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 'clamp(44px, 6vw, 76px)',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: C.text,
          }}
        >
          Quel que soit votre métier,
          <br />
          <GradText>CalendaPro s’adapte.</GradText>
        </h2>
      </FadeUp>

      <div
        style={{
          marginTop: 88,
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: 64,
          alignItems: 'flex-start',
        }}
      >
        {/* Liste */}
        <div>
          {METIERS.map((item, i) => {
            const isActive = active === i
            return (
              <button
                key={item.key}
                onClick={() => setActive(i)}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 68,
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: F.sans,
                  fontSize: isActive ? 22 : 17,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? C.text : '#9CA3AF',
                  letterSpacing: isActive ? '-0.02em' : '0',
                  paddingLeft: isActive ? 28 : 12,
                  borderLeft: isActive ? `3px solid ${C.violet}` : '3px solid transparent',
                  transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Card droite */}
        <motion.div
          key={m.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 24,
            padding: 44,
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          }}
        >
          <TagPill>{m.tag}</TagPill>
          <h3
            style={{
              fontFamily: F.display,
              fontSize: 32,
              fontWeight: 800,
              color: C.text,
              marginTop: 18,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {m.title}
          </h3>
          <p style={{ fontFamily: F.sans, fontSize: 16, lineHeight: 1.7, color: C.muted, marginTop: 14 }}>
            {m.description}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {m.features.map((f) => (
              <li
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: F.sans,
                  fontSize: 15,
                  color: C.text,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(124,58,237,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.violet,
                    flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Preview */}
          <div
            style={{
              marginTop: 30,
              padding: 20,
              borderRadius: 14,
              background: '#FAFAF9',
              border: `1px solid ${C.border}`,
              fontFamily: F.sans,
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.7,
            }}
          >
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Aperçu réservation
            </div>
            <div>{m.label === 'Barbiers' ? 'Coupe + Barbe · 45 min' : m.label === 'Photographes' ? 'Shooting portrait · 1h30' : m.label === 'Tatoueurs' ? 'Petit projet · 2h' : m.label === 'Esthéticiennes' ? 'Soin visage · 1h' : m.label === 'Coachs' ? 'Séance individuelle · 1h' : 'Consultation stratégique · 1h'}</div>
            <div style={{ marginTop: 4 }}>Acompte demandé à la réservation · paiement sécurisé</div>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

// ─── BENTO FEATURES ────────────────────────────────────────────────────────────
const BentoFeatures: React.FC = () => {
  const cardBase: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: 36,
    transition: 'transform 250ms ease, box-shadow 250ms ease',
  }
  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-4px)'
    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'
  }
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <section id="features" style={{ background: C.bg, padding: '160px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <FadeUp>
          <h2
            style={{
              fontFamily: F.display,
              fontSize: 'clamp(44px, 6vw, 76px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              textAlign: 'center',
              color: C.text,
            }}
          >
            Tout ce qu’il faut.
            <br />
            <GradText>Rien de superflu.</GradText>
          </h2>
        </FadeUp>
        <FadeUp delay={0.08}>
          <p
            style={{
              fontFamily: F.sans,
              fontSize: 18,
              color: C.muted,
              textAlign: 'center',
              marginTop: 24,
              maxWidth: 540,
              marginInline: 'auto',
            }}
          >
            Un agenda, des rappels, des paiements et une marketplace. Pensés ensemble. Pour qu’ils tirent dans le même sens.
          </p>
        </FadeUp>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '5fr 4fr',
            gridTemplateRows: 'auto auto',
            gap: 20,
            marginTop: 80,
          }}
        >
          {/* Card A — Agenda (row span 2) */}
          <FadeUp style={{ gridRow: 'span 2' }}>
            <div
              style={{ ...cardBase, background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              <span
                style={{
                  fontFamily: F.sans,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  background: '#F3F0FF',
                  color: C.violet,
                  padding: '4px 12px',
                  borderRadius: 100,
                  alignSelf: 'flex-start',
                }}
              >
                Agenda
              </span>
              <h3 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, color: C.text, marginTop: 18, letterSpacing: '-0.02em' }}>
                Un seul agenda. Toutes vos sources.
              </h3>
              <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.7, color: C.muted, marginTop: 10 }}>
                Synchronisation avec Google, Apple et Outlook. Vue par jour, semaine ou mois. Glisser-déposer pour réorganiser sans frottement.
              </p>
              <AgendaPreview />
            </div>
          </FadeUp>

          {/* Card B — Rappels SMS */}
          <FadeUp delay={0.07}>
            <div
              style={{ ...cardBase, background: '#F8F5FF' }}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              <span
                style={{
                  fontFamily: F.sans,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  background: '#fff',
                  color: C.violet,
                  padding: '4px 12px',
                  borderRadius: 100,
                  display: 'inline-block',
                }}
              >
                Rappels SMS
              </span>
              <h3 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 800, color: C.text, marginTop: 18, letterSpacing: '-0.02em' }}>
                Le bon message, au bon moment.
              </h3>
              <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.7, color: C.muted, marginTop: 10 }}>
                SMS de confirmation, de rappel, de suivi. Personnalisables, automatiques, et envoyés depuis votre nom.
              </p>
              <SmsPreview />
            </div>
          </FadeUp>

          {/* Card C — Paiements */}
          <FadeUp delay={0.14}>
            <div
              style={{ ...cardBase, background: '#FFF5FA' }}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              <span
                style={{
                  fontFamily: F.sans,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  background: '#fff',
                  color: C.pink,
                  padding: '4px 12px',
                  borderRadius: 100,
                  display: 'inline-block',
                }}
              >
                Paiements
              </span>
              <h3 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 800, color: C.text, marginTop: 18, letterSpacing: '-0.02em' }}>
                Acomptes, soldes, sans friction.
              </h3>
              <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.7, color: C.muted, marginTop: 10 }}>
                Encaissez à la réservation, au rendez-vous ou en différé. Stripe intégré, conforme, sans paperasse.
              </p>
              <PaymentsPreview />
            </div>
          </FadeUp>

          {/* Card D — Marketplace (col span 2, dark) */}
          <FadeUp delay={0.21} style={{ gridColumn: 'span 2' }}>
            <div
              style={{
                ...cardBase,
                background: C.bgDark,
                color: C.onDark,
                border: `1px solid ${C.borderDark}`,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'center' }}>
                <div>
                  <span
                    style={{
                      fontFamily: F.sans,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      background: 'rgba(124,58,237,0.18)',
                      color: '#A78BFA',
                      padding: '4px 12px',
                      borderRadius: 100,
                      display: 'inline-block',
                    }}
                  >
                    Marketplace
                  </span>
                  <h3 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: C.onDark, marginTop: 20, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    Une vitrine. <GradText>Toute la France.</GradText>
                  </h3>
                  <p style={{ fontFamily: F.sans, fontSize: 16, lineHeight: 1.7, color: C.onDarkMuted, marginTop: 14, maxWidth: 460 }}>
                    Quand un client cherche un pro près de chez lui, votre profil ressort. Photos, services, créneaux disponibles : tout est lié à votre agenda.
                  </p>
                </div>
                <FranceMap />
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

const AgendaPreview: React.FC = () => {
  const slots = [
    { day: 0, top: 0, h: 60, c: '#7C3AED' },
    { day: 1, top: 30, h: 40, c: '#EC4899' },
    { day: 2, top: 80, h: 60, c: '#7C3AED' },
    { day: 3, top: 50, h: 80, c: '#EC4899' },
    { day: 4, top: 20, h: 50, c: '#7C3AED' },
  ]
  return (
    <div
      style={{
        marginTop: 'auto',
        background: '#FAFAF9',
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, height: 180 }}>
        {['L', 'M', 'M', 'J', 'V'].map((d, i) => (
          <div key={i} style={{ position: 'relative', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: C.muted, textAlign: 'center', padding: '6px 0' }}>
              {d}
            </div>
            {slots
              .filter((s) => s.day === i)
              .map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    top: s.top + 24,
                    left: 4,
                    right: 4,
                    height: s.h,
                    background:
                      s.c === '#7C3AED'
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(124,58,237,0.65))'
                        : 'linear-gradient(135deg, rgba(236,72,153,0.85), rgba(236,72,153,0.65))',
                    borderRadius: 5,
                  }}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const SmsPreview: React.FC = () => (
  <div
    style={{
      marginTop: 24,
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 16,
      fontFamily: F.sans,
      fontSize: 13,
      color: C.text,
      maxWidth: 320,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', background: C.grad }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>Studio Thomas</div>
        <div style={{ fontSize: 11, color: C.muted }}>Aujourd’hui, 14:32</div>
      </div>
    </div>
    <div style={{ background: '#F3F0FF', padding: 10, borderRadius: 10, color: C.text, fontSize: 13, lineHeight: 1.55 }}>
      Bonjour Camille, votre rendez-vous de demain 10h est confirmé. À tout bientôt.
    </div>
  </div>
)

const PaymentsPreview: React.FC = () => (
  <div
    style={{
      marginTop: 24,
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 18,
      maxWidth: 320,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.sans, fontSize: 13, color: C.muted }}>
      <span>Acompte demandé</span>
      <span style={{ fontWeight: 700, color: C.text }}>15,00 €</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.sans, fontSize: 13, color: C.muted, marginTop: 6 }}>
      <span>Solde au RDV</span>
      <span style={{ fontWeight: 700, color: C.text }}>20,00 €</span>
    </div>
    <div style={{ marginTop: 14, height: 1, background: C.border }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.sans, fontSize: 14, color: C.text, fontWeight: 700, marginTop: 14 }}>
      <span>Total</span>
      <span>
        <GradText>35,00 €</GradText>
      </span>
    </div>
  </div>
)

const FranceMap: React.FC = () => {
  // Stylized France SVG with violet city dots — no fake stats
  return (
    <div style={{ position: 'relative', height: 260 }}>
      <svg viewBox="0 0 280 280" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mapStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* simplified France hexagon */}
        <path
          d="M140 30 L195 60 L220 110 L210 175 L185 220 L155 240 L120 240 L90 220 L65 175 L60 115 L85 60 Z"
          fill="rgba(124,58,237,0.05)"
          stroke="url(#mapStroke)"
          strokeWidth="1.5"
        />
        {[
          [140, 80, 'Paris'],
          [115, 120, 'Nantes'],
          [165, 145, 'Lyon'],
          [125, 175, 'Bordeaux'],
          [180, 200, 'Marseille'],
          [195, 90, 'Strasbourg'],
          [180, 220, 'Nice'],
          [110, 165, 'Toulouse'],
        ].map(([cx, cy, name], i) => (
          <g key={String(name)}>
            <circle cx={Number(cx)} cy={Number(cy)} r="3" fill={C.violet}>
              <animate attributeName="opacity" values="1;0.4;1" dur="3s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={Number(cx)} cy={Number(cy)} r="10" fill="none" stroke={C.violet} strokeOpacity="0.5">
              <animate attributeName="r" values="3;14;3" dur="3s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── DEMO (dark) ───────────────────────────────────────────────────────────────
const DemoSection: React.FC = () => (
  <Section background="dark" id="demo">
    <FadeUp>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <TagPill tone="dark">Voir en action</TagPill>
      </div>
    </FadeUp>
    <FadeUp delay={0.05}>
      <h2
        style={{
          fontFamily: F.display,
          fontSize: 'clamp(44px, 6vw, 76px)',
          fontWeight: 800,
          color: C.onDark,
          textAlign: 'center',
          letterSpacing: '-0.04em',
          lineHeight: 1.0,
        }}
      >
        Voyez CalendaPro
        <br />
        <GradText>en action.</GradText>
      </h2>
    </FadeUp>
    <FadeUp delay={0.1}>
      <p
        style={{
          fontFamily: F.sans,
          fontSize: 19,
          lineHeight: 1.7,
          color: C.onDarkMuted,
          textAlign: 'center',
          maxWidth: 540,
          margin: '32px auto 0',
        }}
      >
        Pas besoin de mode d’emploi. Cliquez, et naviguez dans une démo interactive du dashboard. Le reste se découvre en 2 minutes.
      </p>
    </FadeUp>

    <FadeUp delay={0.15}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <PrimaryButton href="/demo" size="xl" shadow="strong">
          Voir la démo interactive
        </PrimaryButton>
      </div>
    </FadeUp>
    <FadeUp delay={0.2}>
      <p
        style={{
          fontFamily: F.sans,
          fontSize: 13,
          color: 'rgba(240,239,245,0.35)',
          textAlign: 'center',
          marginTop: 20,
        }}
      >
        Aucune inscription requise · 2 minutes
      </p>
    </FadeUp>

    <FadeUp delay={0.25}>
      <div
        style={{
          maxWidth: 580,
          margin: '52px auto 0',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 32,
        }}
      >
        <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Aperçu réservation
        </div>
        <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 800, color: C.onDark, marginTop: 10, letterSpacing: '-0.02em' }}>
          Réservez avec Thomas — Barbier
        </div>
        <div
          style={{
            marginTop: 16,
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            fontFamily: F.sans,
            fontSize: 14,
            color: C.onDarkDim,
          }}
        >
          <div style={{ fontWeight: 700, color: C.onDark }}>Coupe + Barbe</div>
          <div style={{ marginTop: 4 }}>45 min · 35 €</div>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {['10:00', '11:30', '14:00', '16:30'].map((t, i) => (
            <button
              key={t}
              type="button"
              style={{
                fontFamily: F.sans,
                fontSize: 14,
                fontWeight: 600,
                color: i === 1 ? '#fff' : C.onDarkDim,
                background: i === 1 ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${i === 1 ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10,
                padding: '12px 0',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <PrimaryButton href="/demo" size="lg">
            Réserver ce créneau →
          </PrimaryButton>
        </div>
      </div>
    </FadeUp>
  </Section>
)

// ─── AVANT / APRÈS (light) ─────────────────────────────────────────────────────
const AvantApres: React.FC = () => {
  const avant = [
    'Texto à chaque client la veille',
    'Réservations qui se chevauchent',
    'Acomptes oubliés',
    'No-shows non remplacés',
    'Agenda dans la tête',
  ]
  const apres = [
    'Rappels automatiques par SMS',
    'Plus jamais de double-booking',
    'Acompte demandé à la réservation',
    'Liste d’attente proposée',
    'Agenda partagé partout',
  ]

  return (
    <Section background="light">
      <FadeUp>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 'clamp(44px, 6vw, 76px)',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: C.text,
          }}
        >
          Votre quotidien,
          <br />
          <GradText>avant et après.</GradText>
        </h2>
      </FadeUp>

      <div
        style={{
          maxWidth: 880,
          margin: '88px auto 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}
      >
        <FadeUp>
          <div
            style={{
              background: '#FFF8F8',
              border: '1px solid #FEE2E2',
              borderRadius: 24,
              padding: 48,
              height: '100%',
            }}
          >
            <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Sans CalendaPro
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {avant.map((line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={sectionViewport}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  style={{ fontFamily: F.sans, fontSize: 15, color: C.text, display: 'flex', gap: 12, alignItems: 'flex-start' }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#FEE2E2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round">
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </span>
                  {line}
                </motion.li>
              ))}
            </ul>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div
            style={{
              background: '#F7FFF9',
              border: '1px solid #C6F6D5',
              borderRadius: 24,
              padding: 48,
              height: '100%',
            }}
          >
            <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Avec CalendaPro
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {apres.map((line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={sectionViewport}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  style={{ fontFamily: F.sans, fontSize: 15, color: C.text, display: 'flex', gap: 12, alignItems: 'flex-start' }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#DCFCE7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {line}
                </motion.li>
              ))}
            </ul>
          </div>
        </FadeUp>
      </div>
    </Section>
  )
}

// ─── TESTIMONIALS (dark) ───────────────────────────────────────────────────────
const Testimonials: React.FC = () => {
  const items = [
    {
      initials: 'TM',
      name: 'Thomas M.',
      role: 'Barbier, Lyon',
      quote: 'J’ai enfin arrêté de courir après les confirmations.',
    },
    {
      initials: 'CR',
      name: 'Camille R.',
      role: 'Coach, Paris',
      quote: 'Mes clients réservent directement, même quand je suis en séance.',
    },
    {
      initials: 'AD',
      name: 'Axel D.',
      role: 'Tatoueur, Bordeaux',
      quote: 'L’acompte à la réservation a changé la relation avec mes clients.',
    },
  ]
  return (
    <Section background="dark">
      <FadeUp>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 'clamp(44px, 6vw, 76px)',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: C.onDark,
          }}
        >
          Ce que disent
          <br />
          <GradText>nos bêta-testeurs.</GradText>
        </h2>
      </FadeUp>

      <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {items.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.07}>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.borderDark}`,
                borderRadius: 20,
                padding: 32,
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: C.grad,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: F.sans,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {t.initials}
                </span>
                <div>
                  <div style={{ fontFamily: F.sans, fontSize: 15, fontWeight: 700, color: C.onDark }}>{t.name}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: C.onDarkFaint }}>{t.role}</div>
                </div>
              </div>
              <p
                style={{
                  fontFamily: F.sans,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: C.onDarkDim,
                  fontStyle: 'italic',
                  marginTop: 22,
                }}
              >
                « {t.quote} »
              </p>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  )
}

// ─── PRICING (light) ───────────────────────────────────────────────────────────
type Plan = {
  name: string
  monthly: number | 'Sur mesure'
  yearly: number | 'Sur mesure'
  tagline: string
  highlight?: boolean
  badge?: string
  features: string[]
  cta: string
}
const PLANS: Plan[] = [
  {
    name: 'Starter',
    monthly: 0,
    yearly: 0,
    tagline: 'Pour démarrer sans frottement.',
    features: ['Agenda en ligne', 'Page de réservation', 'Rappels par email', 'Support communauté'],
    cta: 'Démarrer',
  },
  {
    name: 'Premium',
    monthly: 19,
    yearly: 15,
    tagline: 'Pour les pros sérieux.',
    highlight: true,
    badge: 'Le plus choisi',
    features: ['Tout Starter', 'Rappels SMS illimités', 'Acomptes & paiements Stripe', 'Marketplace incluse', 'Support prioritaire'],
    cta: 'Choisir Premium',
  },
  {
    name: 'Studio',
    monthly: 'Sur mesure',
    yearly: 'Sur mesure',
    tagline: 'Pour les équipes et studios.',
    features: ['Tout Premium', 'Comptes multi-praticiens', 'Rapports avancés', 'Onboarding dédié'],
    cta: 'Nous contacter',
  },
]

const PricingSection: React.FC = () => {
  const [yearly, setYearly] = useState(true)
  return (
    <Section background="light" id="pricing">
      <FadeUp>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 'clamp(44px, 6vw, 76px)',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: C.text,
          }}
        >
          Des prix qui ont du sens.
        </h2>
      </FadeUp>
      <FadeUp delay={0.05}>
        <p style={{ fontFamily: F.sans, fontSize: 18, color: C.muted, textAlign: 'center', marginTop: 22 }}>
          Démarrez gratuitement. Passez à Premium quand vous êtes prêt.
        </p>
      </FadeUp>

      {/* Toggle */}
      <FadeUp delay={0.1}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              background: '#fff',
              border: `1px solid ${C.border}`,
              borderRadius: 100,
            }}
          >
            {[
              { label: 'Mensuel', val: false },
              { label: 'Annuel — 2 mois offerts', val: true },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setYearly(opt.val)}
                style={{
                  fontFamily: F.sans,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 20px',
                  borderRadius: 100,
                  border: 'none',
                  cursor: 'pointer',
                  background: yearly === opt.val ? C.grad : 'transparent',
                  color: yearly === opt.val ? '#fff' : C.muted,
                  transition: 'all 200ms ease',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </FadeUp>

      <div
        style={{
          marginTop: 72,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        {PLANS.map((plan, i) => {
          const price = yearly ? plan.yearly : plan.monthly
          const isHighlight = plan.highlight
          return (
            <FadeUp key={plan.name} delay={i * 0.07}>
              <div
                style={{
                  background: '#fff',
                  border: isHighlight ? `2px solid ${C.violet}` : `1px solid ${C.border}`,
                  borderRadius: 20,
                  padding: 40,
                  height: '100%',
                  position: 'relative',
                  boxShadow: isHighlight ? '0 0 0 6px rgba(124,58,237,0.08)' : 'none',
                  transform: isHighlight ? 'translateY(-10px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {plan.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: C.grad,
                      color: '#fff',
                      fontFamily: F.sans,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 100,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {plan.badge}
                  </span>
                )}
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
                  {plan.name}
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 14, color: C.muted, marginTop: 4 }}>
                  {plan.tagline}
                </div>

                <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {typeof price === 'number' ? (
                    <>
                      <span
                        style={{
                          fontFamily: F.display,
                          fontSize: 'clamp(48px, 6vw, 60px)',
                          fontWeight: 900,
                          color: C.text,
                          letterSpacing: '-0.04em',
                          lineHeight: 1,
                        }}
                      >
                        {price}€
                      </span>
                      <span style={{ fontFamily: F.sans, fontSize: 14, color: C.muted }}>
                        / mois{yearly ? ' · facturé annuellement' : ''}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{
                        fontFamily: F.display,
                        fontSize: 32,
                        fontWeight: 800,
                        color: C.text,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Sur mesure
                    </span>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontFamily: F.sans,
                        fontSize: 14,
                        color: '#4B5563',
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'rgba(124,58,237,0.1)',
                          color: C.violet,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 'auto', paddingTop: 32 }}>
                  <Link
                    href={plan.name === 'Studio' ? 'mailto:contact.calendapro@gmail.com' : '/login'}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      height: 48,
                      lineHeight: '48px',
                      borderRadius: 100,
                      fontFamily: F.sans,
                      fontWeight: 700,
                      fontSize: 15,
                      textDecoration: 'none',
                      background: isHighlight ? C.grad : '#fff',
                      color: isHighlight ? '#fff' : C.text,
                      border: isHighlight ? 'none' : `1.5px solid ${C.border}`,
                      boxShadow: isHighlight ? '0 8px 24px rgba(124,58,237,0.28)' : 'none',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </FadeUp>
          )
        })}
      </div>
    </Section>
  )
}

// ─── FAQ (light) ───────────────────────────────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Combien de temps pour configurer mon compte ?',
    a: 'Cinq minutes suffisent pour avoir une page de réservation publique. Les options avancées (acomptes, marketplace, SMS) se branchent ensuite quand vous le décidez.',
  },
  {
    q: 'Mes clients ont-ils besoin de créer un compte ?',
    a: 'Non. Vos clients réservent en quelques clics, avec leur numéro et leur email. Aucune friction.',
  },
  {
    q: 'CalendaPro fonctionne-t-il avec Google Calendar ?',
    a: 'Oui. Synchronisation bidirectionnelle avec Google Calendar, Apple Calendar et Outlook. Tout est centralisé.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui. Annulation en un clic, sans question. Vous gardez l’accès à vos données pendant trente jours.',
  },
  {
    q: 'Est-ce vraiment gratuit pour démarrer ?',
    a: 'Le plan Starter est gratuit pour toujours. Vous passez à Premium uniquement quand les options avancées vous deviennent utiles.',
  },
]

const FAQSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Section background="light">
      <FadeUp>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 'clamp(44px, 6vw, 76px)',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: C.text,
          }}
        >
          Questions fréquentes.
        </h2>
      </FadeUp>

      <div style={{ maxWidth: 760, margin: '72px auto 0' }}>
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <FadeUp key={item.q} delay={i * 0.04}>
              <div
                style={{
                  borderTop: i === 0 ? `1px solid ${C.border}` : 'none',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px 8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: F.sans,
                    fontSize: 17,
                    fontWeight: 600,
                    color: C.text,
                    transition: 'color 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = C.violet
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = C.text
                  }}
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isOpen ? C.grad : 'transparent',
                      border: `1px solid ${isOpen ? 'transparent' : C.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOpen ? '#fff' : C.text,
                      transition: 'transform 300ms ease, background 200ms ease',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                      marginLeft: 16,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </button>
                <div
                  style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? 200 : 0,
                    transition: 'max-height 320ms ease',
                  }}
                >
                  <div
                    style={{
                      padding: '0 8px 24px',
                      fontFamily: F.sans,
                      fontSize: 16,
                      lineHeight: 1.7,
                      color: C.muted,
                    }}
                  >
                    {item.a}
                  </div>
                </div>
              </div>
            </FadeUp>
          )
        })}
      </div>
    </Section>
  )
}

// ─── FINAL CTA + FOOTER (dark) ─────────────────────────────────────────────────
const FinalCtaFooter: React.FC = () => {
  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '#features' },
        { label: 'Tarifs', href: '#pricing' },
        { label: 'Démo', href: '#demo' },
        { label: 'Marketplace', href: '/marketplace' },
      ],
    },
    {
      title: 'Métiers',
      links: [
        { label: 'Barbiers', href: '/login' },
        { label: 'Coachs', href: '/login' },
        { label: 'Photographes', href: '/login' },
        { label: 'Tatoueurs', href: '/login' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Blog', href: '#' },
        { label: 'Guides', href: '#' },
        { label: 'Centre d’aide', href: '#' },
      ],
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '#' },
        { label: 'Contact', href: 'mailto:contact.calendapro@gmail.com' },
        { label: 'Carrières', href: '#' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'CGU', href: '#' },
        { label: 'Confidentialité', href: '#' },
        { label: 'Mentions légales', href: '#' },
      ],
    },
  ]
  return (
    <div style={{ background: C.bgDark, color: C.onDark }}>
      {/* Final CTA */}
      <section style={{ padding: '160px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <FadeUp>
            <h2
              style={{
                fontFamily: F.display,
                fontSize: 'clamp(44px, 6vw, 76px)',
                fontWeight: 800,
                color: C.onDark,
                letterSpacing: '-0.04em',
                lineHeight: 1.0,
              }}
            >
              Prêt à reprendre
              <br />
              <GradText>le contrôle ?</GradText>
            </h2>
          </FadeUp>
          <FadeUp delay={0.07}>
            <p style={{ fontFamily: F.sans, fontSize: 19, color: C.onDarkMuted, marginTop: 28, maxWidth: 480, marginInline: 'auto' }}>
              Cinq minutes pour mettre en place. Aucun engagement. Annulation à tout moment.
            </p>
          </FadeUp>
          <FadeUp delay={0.12}>
            <div style={{ marginTop: 36 }}>
              <PrimaryButton href="/login" size="lg" shadow="strong">
                Démarrer gratuitement
              </PrimaryButton>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '64px 0 48px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', gap: 40 }}>
            <div>
              <div
                style={{
                  fontFamily: F.sans,
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: '-0.01em',
                  color: C.onDark,
                }}
              >
                Calenda<GradText>Pro</GradText>
              </div>
              <p style={{ fontFamily: F.sans, fontSize: 14, color: 'rgba(240,239,245,0.5)', marginTop: 12, maxWidth: 220, lineHeight: 1.6 }}>
                L’agenda qui pense pour les indépendants.
              </p>
            </div>
            {cols.map((col) => (
              <div key={col.title}>
                <div
                  style={{
                    fontFamily: F.sans,
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.onDark,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 16,
                  }}
                >
                  {col.title}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        style={{
                          fontFamily: F.sans,
                          fontSize: 14,
                          color: 'rgba(240,239,245,0.4)',
                          textDecoration: 'none',
                          transition: 'color 200ms ease',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(240,239,245,0.9)'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(240,239,245,0.4)'
                        }}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 56,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: F.sans,
              fontSize: 13,
              color: 'rgba(240,239,245,0.35)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>© 2026 CalendaPro. Fait en France.</div>
            <div>Conçu pour les indépendants exigeants.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: F.sans }}>
      <Navbar />
      <Hero />
      <Ticker />
      <ProblemSection />
      <MetiersSection />
      <BentoFeatures />
      <DemoSection />
      <AvantApres />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <FinalCtaFooter />
    </main>
  )
}
