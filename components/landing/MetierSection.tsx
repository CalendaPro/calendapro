'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg: '#0a0f1a',
  violet: '#7c3aed',
  pink: '#ec4899',
  blue: '#3b82f6',
  amber: '#f59e0b',
  emerald: '#10b981',
  text: '#f8fafc',
  muted: '#94a3b8',
  glass: 'rgba(15, 23, 42, 0.6)',
  glassBorder: 'rgba(124, 58, 237, 0.15)',
}

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 24 }

// ─── PROFESSIONS DATA ────────────────────────────────────────────────────────
const METIERS = [
  {
    id: 'osteopathe',
    name: 'Ostéopathe',
    outlineName: 'Ostéopathe',
    tagline: 'Séances manuelles, suivis patients',
    feature: 'Configuration sur-mesure de vos créneaux, sans limite de durée, parfaitement adaptée à votre rythme de praticien.',
    icon: 'spine',
    color: T.violet,
    shadow: 'rgba(124, 58, 237, 0.4)',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'coiffeuse',
    name: 'Coiffure',
    outlineName: 'Coiffure',
    tagline: 'Créneaux optimisés, team management',
    feature: 'Multi-caisses et gestion des forfaits couleur avec rappels automatiques',
    icon: 'scissors',
    color: T.pink,
    shadow: 'rgba(236, 72, 153, 0.4)',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'photographe',
    name: 'Photographe',
    outlineName: 'Photographe',
    tagline: 'Séances photos, galleries client',
    feature: 'Galerie privée post-séance et paiement à la réservation',
    icon: 'camera',
    color: T.blue,
    shadow: 'rgba(59, 130, 246, 0.4)',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'coach',
    name: 'Coach Sportif',
    outlineName: 'Coach',
    tagline: 'Sessions, programmes, suivi',
    feature: 'Plans de séance intégrés et suivi de progression par client',
    icon: 'activity',
    color: T.emerald,
    shadow: 'rgba(16, 185, 129, 0.4)',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'estheticienne',
    name: 'Esthétique',
    outlineName: 'Esthétique',
    tagline: 'Soins, épilations, routines',
    feature: 'Catalogue de soins avec durées variables et fiches techniques',
    icon: 'sparkles',
    color: T.amber,
    shadow: 'rgba(245, 158, 11, 0.4)',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'particuliers',
    name: 'Particuliers',
    outlineName: 'Particuliers',
    tagline: 'Vos RDV personnels simplifiés',
    feature: 'Centralisez médecin, coiffeur, sport et réservez en 2 clics',
    icon: 'user',
    color: T.violet,
    shadow: 'rgba(139, 92, 246, 0.4)',
    gradient: 'from-violet-500 to-fuchsia-600',
  },
]

// ─── ICON COMPONENTS ─────────────────────────────────────────────────────────
// ─── METRICS DATA ──────────────────────────────────────────────────────────────
const METRICS: Record<string, Array<{ value: string; label: string; icon: string; suffix?: string }>> = {
  osteopathe: [
    { value: '12', label: 'Heures gagnées', icon: 'clock', suffix: 'h/semaine' },
    { value: '35', label: 'Moins d\'absences', icon: 'users', suffix: '%' },
    { value: '28', label: 'Croissance CA', icon: 'trending', suffix: '%' },
  ],
  coiffeuse: [
    { value: '8', label: 'Heures gagnées', icon: 'clock', suffix: 'h/semaine' },
    { value: '42', label: 'Moins d\'absences', icon: 'users', suffix: '%' },
    { value: '32', label: 'Croissance CA', icon: 'trending', suffix: '%' },
  ],
  photographe: [
    { value: '15', label: 'Heures gagnées', icon: 'clock', suffix: 'h/semaine' },
    { value: '50', label: 'Paiement à l\'avance', icon: 'wallet', suffix: '%' },
    { value: '45', label: 'Croissance CA', icon: 'trending', suffix: '%' },
  ],
  coach: [
    { value: '10', label: 'Heures gagnées', icon: 'clock', suffix: 'h/semaine' },
    { value: '60', label: 'Engagement client', icon: 'target', suffix: '%' },
    { value: '38', label: 'Croissance CA', icon: 'trending', suffix: '%' },
  ],
  estheticienne: [
    { value: '9', label: 'Heures gagnées', icon: 'clock', suffix: 'h/semaine' },
    { value: '48', label: 'Moins d\'absences', icon: 'users', suffix: '%' },
    { value: '30', label: 'Croissance CA', icon: 'trending', suffix: '%' },
  ],
  particuliers: [
    { value: '5', label: 'Heures gagnées', icon: 'clock', suffix: 'h/mois' },
    { value: '100', label: 'Satisfaction', icon: 'heart', suffix: '%' },
    { value: '2', label: 'Clics pour réserver', icon: 'zap', suffix: 'clics' },
  ],
}

// ─── METRIC ICONS ───────────────────────────────────────────────────────────
const MetricIcons: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  clock: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  users: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  trending: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  wallet: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  target: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  heart: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  zap: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
}

const Icons: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  spine: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M12 4v16M8 8h8M8 12h8M8 16h8" strokeLinecap="round" />
    </svg>
  ),
  scissors: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  camera: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  activity: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  sparkles: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  user: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

// ─── METRICS PILLS COMPONENT ─────────────────────────────────────────────────
function MetricsPills({ metierId, color }: { metierId: string; color: string }) {
  const metrics = METRICS[metierId] || []
  const isViolet = color === T.violet
  const glowColor = isViolet ? T.violet : T.pink

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ ...SPRING, delay: 0.2 }}
      className="mt-8"
    >
      {/* Sub-container glass-dark intégré */}
      <div
        className="inline-flex items-center gap-1 p-1.5 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
          border: '0.5px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {metrics.map((metric, i) => {
          const MetricIcon = MetricIcons[metric.icon]
          const pillGlowColor = i === 0 ? T.violet : i === 1 ? T.pink : T.blue

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...SPRING, delay: 0.1 + i * 0.08 }}
              className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              {/* Halo de lueur subtil derrière chaque bulle */}
              <div
                className="absolute inset-0 rounded-xl blur-md -z-10"
                style={{
                  background: `radial-gradient(circle at center, ${pillGlowColor}15 0%, transparent 70%)`,
                  opacity: 0.6,
                }}
              />

              {/* Icône fine ultra-light */}
              <MetricIcon
                className="w-3.5 h-3.5"
                style={{
                  color: pillGlowColor,
                  strokeWidth: 1,
                }}
              />

              {/* Valeur en Satoshi Bold avec couleur éclatante */}
              <div className="flex flex-col items-start gap-0">
                <span
                  className="text-base leading-none tracking-tight"
                  style={{
                    color: pillGlowColor,
                    fontFamily: 'Satoshi, system-ui, sans-serif',
                    fontWeight: 700,
                    textShadow: `0 0 20px ${pillGlowColor}40`,
                  }}
                >
                  {metric.value}
                  <span
                    className="text-xs ml-0.5"
                    style={{ opacity: 0.9, fontWeight: 500 }}
                  >
                    {metric.suffix}
                  </span>
                </span>

                {/* Label en Cabinet Grotesk, uppercase, letter-spacing */}
                <span
                  className="text-[10px] leading-tight mt-0.5"
                  style={{
                    color: 'rgba(148, 163, 184, 0.7)',
                    fontFamily: 'Cabinet Grotesk, system-ui, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {metric.label}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── GLASS CARD COMPONENT ────────────────────────────────────────────────────
function FeatureCard({ metier }: { metier: typeof METIERS[0] }) {
  const Icon = Icons[metier.icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={SPRING}
      className="relative"
    >
      {/* Glow shadow */}
      <div
        className="absolute -inset-4 rounded-3xl blur-2xl opacity-60"
        style={{ background: metier.shadow }}
      />

      {/* Glass card */}
      <div
        className="relative rounded-3xl p-8 md:p-10"
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          border: `1px solid ${metier.color}25`,
          boxShadow: `
            0 32px 64px rgba(0,0,0,0.4),
            0 0 0 1px ${metier.color}15 inset,
            0 0 60px ${metier.shadow}
          `,
        }}
      >
        {/* Corner accents */}
        <div
          className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-3xl"
          style={{ borderColor: `${metier.color}40` }}
        />
        <div
          className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 rounded-tr-3xl"
          style={{ borderColor: `${metier.color}40` }}
        />
        <div
          className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 rounded-bl-3xl"
          style={{ borderColor: `${metier.color}40` }}
        />
        <div
          className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 rounded-br-3xl"
          style={{ borderColor: `${metier.color}40` }}
        />

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: `linear-gradient(135deg, ${metier.color}20, transparent)`,
            border: `1px solid ${metier.color}30`,
          }}
        >
          <Icon className="w-8 h-8" style={{ color: metier.color }} />
        </div>

        {/* Label */}
        <div
          className="text-xs font-semibold tracking-wider uppercase mb-3"
          style={{ color: `${metier.color}cc` }}
        >
          Fonctionnalité clé
        </div>

        {/* Feature text */}
        <p className="text-xl md:text-2xl font-medium leading-relaxed" style={{ color: T.text }}>
          {metier.feature}
        </p>

        {/* Decorative line */}
        <div
          className="mt-6 h-px w-24"
          style={{
            background: `linear-gradient(90deg, ${metier.color}, transparent)`,
          }}
        />

        {/* Metrics Pills - Intégrés dans la carte pour effet aimanté */}
        <MetricsPills metierId={metier.id} color={metier.color} />
      </div>
    </motion.div>
  )
}

// ─── OUTLINE TEXT COMPONENT ─────────────────────────────────────────────────
function MetierItem({
  metier,
  isActive,
  onHover,
}: {
  metier: typeof METIERS[0]
  isActive: boolean
  onHover: () => void
}) {
  return (
    <motion.button
      onMouseEnter={onHover}
      className="relative w-full text-left py-5 px-6 group transition-all duration-500"
      whileHover={{ x: 8 }}
      transition={SPRING}
    >
      {/* Active indicator line */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full"
        animate={{
          height: isActive ? 32 : 0,
          opacity: isActive ? 1 : 0,
          backgroundColor: metier.color,
        }}
        transition={SPRING}
      />

      {/* Outline text (visible when not active) */}
      <motion.div
        className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
        style={{
          WebkitTextStroke: `1px ${isActive ? 'transparent' : T.muted}`,
          WebkitTextFillColor: isActive ? T.text : 'transparent',
          color: isActive ? T.text : 'transparent',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {metier.outlineName}
      </motion.div>

      {/* Tagline (visible on hover/active) */}
      <motion.div
        initial={false}
        animate={{
          opacity: isActive ? 1 : 0,
          y: isActive ? 0 : -8,
          height: isActive ? 'auto' : 0,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="text-sm mt-2" style={{ color: T.muted }}>
          {metier.tagline}
        </p>
      </motion.div>

      {/* Gradient accent on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{
          background: `linear-gradient(135deg, ${metier.color}08, transparent)`,
        }}
      />
    </motion.button>
  )
}

// ─── MAIN SECTION ───────────────────────────────────────────────────────────
export function MetierSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeMetier = METIERS[activeIndex]

  return (
    <section
      className="relative w-full overflow-hidden section-dark noise-dark"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute top-0 right-0 w-[80vw] h-[80vh] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 80% 20%, ${activeMetier.color}15 0%, transparent 60%)`,
          transition: 'background 0.8s ease-out',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="mb-16 md:mb-24"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
            style={{
              background: `${T.violet}15`,
              border: `1px solid ${T.violet}30`,
              color: `${T.violet}cc`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.violet }} />
            Par métier
          </div>

          <h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            style={{
              fontFamily: 'Clash Display, sans-serif',
              background: `linear-gradient(135deg, ${T.text} 0%, ${T.violet} 50%, ${T.pink} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Une solution pensée
            <br />
            pour votre métier
          </h2>
        </motion.div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Interactive list */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: 0.2 }}
            className="space-y-1"
          >
            {METIERS.map((metier, i) => (
              <MetierItem
                key={metier.id}
                metier={metier}
                isActive={i === activeIndex}
                onHover={() => setActiveIndex(i)}
              />
            ))}
          </motion.div>

          {/* Right: Feature card with AnimatePresence */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: 0.3 }}
            className="lg:sticky lg:top-32"
          >
            <AnimatePresence mode="wait">
              <FeatureCard key={activeMetier.id} metier={activeMetier} />
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${T.bg}, transparent)`,
        }}
      />
    </section>
  )
}

export default MetierSection