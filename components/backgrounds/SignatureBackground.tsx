'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useScroll, useMotionValueEvent } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE BACKGROUND — "Evolutive System"
// Sections uniques : Glass → Aura → Dots
// ─────────────────────────────────────────────────────────────────────────────

type BackgroundVariant = 'glass' | 'aura' | 'dots' | 'grid' | 'none'

interface GlassShape {
  id: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  delay: number
  duration: number
  variant: 'indigo' | 'sand' | 'mixed'
  layer: 'front' | 'back'
}

// ─── GLASS SHAPES — Formes 3D avec opacité réduite ─────────────────────────
const glassShapes: GlassShape[] = [
  { id: 1, x: -8, y: 12, width: 32, height: 65, rotation: -6, delay: 0, duration: 28, variant: 'indigo', layer: 'back' },
  { id: 2, x: 62, y: 20, width: 38, height: 28, rotation: 10, delay: 4, duration: 22, variant: 'sand', layer: 'front' },
  { id: 3, x: 40, y: 55, width: 25, height: 42, rotation: -12, delay: 8, duration: 32, variant: 'mixed', layer: 'back' },
  { id: 4, x: 85, y: 35, width: 22, height: 50, rotation: 8, delay: 12, duration: 26, variant: 'indigo', layer: 'front' },
]

function GlassDalle({ shape, mouseX, scrollY }: { shape: GlassShape; mouseX: any; scrollY: any }) {
  const { x, y, width, height, rotation, delay, duration, variant, layer } = shape
  
  const parallaxFactor = layer === 'front' ? 12 : 6
  const shiftX = useTransform(mouseX, [-0.5, 0.5], [-parallaxFactor, parallaxFactor])
  const shiftY = useTransform(mouseX, [-0.5, 0.5], [-parallaxFactor * 0.4, parallaxFactor * 0.4])
  const smoothShiftX = useSpring(shiftX, { stiffness: 60, damping: 30 })
  const smoothShiftY = useSpring(shiftY, { stiffness: 60, damping: 30 })
  
  // Visibilité maximale pour Hero uniquement
  const baseOpacity = 0.95
  
  // Fade out complet quand on atteint la section suivante (disparaît "derrière" l'arrière-plan)
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900
  const scrollOpacity = useTransform(scrollY, [0, viewportHeight * 0.8], [1, 0])
  const smoothScrollOpacity = useSpring(scrollOpacity, { stiffness: 80, damping: 25 })
  
  const colors = {
    indigo: {
      bg: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(79, 70, 229, 0.06) 100%)',
      border: 'rgba(167, 139, 250, 0.3)',
      shadow: 'rgba(124, 58, 237, 0.1)',
    },
    sand: {
      bg: 'linear-gradient(135deg, rgba(200, 185, 165, 0.14) 0%, rgba(180, 165, 145, 0.06) 100%)',
      border: 'rgba(200, 185, 165, 0.25)',
      shadow: 'rgba(200, 185, 165, 0.1)',
    },
    mixed: {
      bg: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(200, 185, 165, 0.08) 100%)',
      border: 'rgba(180, 165, 200, 0.2)',
      shadow: 'rgba(167, 139, 250, 0.08)',
    },
  }
  
  const c = colors[variant]

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: layer === 'front' ? 5 : 2,
        x: smoothShiftX,
        y: smoothShiftY,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: baseOpacity,
        scale: 1,
        x: [0, 15, -8, 12, 0],
        y: [0, -12, 8, -6, 0],
        rotate: [rotation, rotation + 2, rotation - 1.5, rotation + 1, rotation],
      }}
      transition={{
        opacity: { duration: 2, ease: 'easeOut' },
        scale: { duration: 2, ease: 'easeOut' },
        x: { duration, delay, ease: 'easeInOut', repeat: Infinity },
        y: { duration: duration * 0.9, delay, ease: 'easeInOut', repeat: Infinity },
        rotate: { duration: duration * 1.3, delay, ease: 'easeInOut', repeat: Infinity },
      }}
    >
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          background: c.bg,
          border: `1px solid ${c.border}`,
          boxShadow: `0 20px 40px ${c.shadow}`,
        }}
      />
    </motion.div>
  )
}

// ─── AURA GRADIENTS — Auras lumineuses floues (section-scoped) ──────────────
function AuraBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
      {/* Aura Indigo — grande zone floue */}
      <motion.div
        className="absolute"
        style={{
          left: '-20%',
          top: '10%',
          width: '80vw',
          height: '60vh',
          background: 'radial-gradient(ellipse 70vw 50vh at 40% 40%, rgba(124, 58, 237, 0.15) 0%, rgba(167, 139, 250, 0.08) 40%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, 30, -20, 15, 0],
          y: [0, -20, 15, -10, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{ duration: 25, ease: 'easeInOut', repeat: Infinity }}
      />
      
      {/* Aura Sable — zone chaude */}
      <motion.div
        className="absolute"
        style={{
          right: '-15%',
          top: '30%',
          width: '70vw',
          height: '50vh',
          background: 'radial-gradient(ellipse 55vw 40vh at 60% 60%, rgba(200, 185, 165, 0.18) 0%, rgba(180, 165, 145, 0.1) 35%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, -25, 20, -15, 0],
          y: [0, 15, -20, 10, 0],
          scale: [1, 0.95, 1.08, 0.98, 1],
        }}
        transition={{ duration: 30, ease: 'easeInOut', repeat: Infinity, delay: 5 }}
      />
      
      {/* Aura mixte — centre subtil */}
      <motion.div
        className="absolute"
        style={{
          left: '20%',
          bottom: '10%',
          width: '60vw',
          height: '45vh',
          background: 'radial-gradient(ellipse 50vw 45vh at 30% 70%, rgba(167, 139, 250, 0.12) 0%, rgba(124, 58, 237, 0.06) 45%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, 20, -15, 10, 0],
          y: [0, -15, 10, -8, 0],
        }}
        transition={{ duration: 35, ease: 'easeInOut', repeat: Infinity, delay: 10 }}
      />
    </div>
  )
}

// ─── PRECISION DOTS — Constellation de micro-particules (section-scoped) ────────────────────
const dotPositions = [
  { x: 10, y: 20, size: 3, opacity: 0.75, delay: 0 },
  { x: 20, y: 35, size: 4, opacity: 0.7, delay: 0.1 },
  { x: 15, y: 55, size: 3, opacity: 0.72, delay: 0.2 },
  { x: 25, y: 70, size: 4, opacity: 0.65, delay: 0.3 },
  { x: 8, y: 85, size: 3, opacity: 0.7, delay: 0.4 },
  { x: 30, y: 25, size: 3, opacity: 0.68, delay: 0.5 },
  { x: 22, y: 90, size: 4, opacity: 0.72, delay: 0.6 },
  { x: 35, y: 45, size: 3, opacity: 0.62, delay: 0.7 },
  { x: 80, y: 25, size: 4, opacity: 0.75, delay: 0.15 },
  { x: 88, y: 40, size: 3, opacity: 0.7, delay: 0.25 },
  { x: 85, y: 60, size: 4, opacity: 0.65, delay: 0.35 },
  { x: 92, y: 75, size: 3, opacity: 0.72, delay: 0.45 },
  { x: 78, y: 90, size: 4, opacity: 0.68, delay: 0.55 },
  { x: 90, y: 50, size: 3, opacity: 0.72, delay: 0.65 },
  { x: 72, y: 15, size: 3, opacity: 0.68, delay: 0.75 },
  { x: 75, y: 80, size: 4, opacity: 0.7, delay: 0.85 },
  { x: 50, y: 30, size: 3, opacity: 0.62, delay: 0.4 },
  { x: 60, y: 95, size: 3, opacity: 0.68, delay: 0.9 },
  { x: 40, y: 80, size: 4, opacity: 0.58, delay: 1.0 },
  { x: 70, y: 35, size: 3, opacity: 0.7, delay: 1.1 },
]

function PrecisionDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
      {dotPositions.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}vw`,
            top: `${dot.y}vh`,
            width: dot.size,
            height: dot.size,
            background: 'rgba(18, 18, 18, 0.95)',
            opacity: 0,
          }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ 
            scale: 1,
            opacity: dot.opacity,
          }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{
            duration: 0.8,
            delay: dot.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── TECHNICAL GRID — Grille de précision pour Pricing (section-scoped, visible) ──────────────────────
function TechnicalGrid() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  
  // Lignes verticales de la grille (espacement 120px pour plus d'espace)
  const verticalLines = Array.from({ length: 12 }, (_, i) => i * 12) // 12% intervals
  
  // Lignes horizontales (espacement 15%)
  const horizontalLines = Array.from({ length: 8 }, (_, i) => i * 15)
  
  // Lignes connecteurs entre cartes (positions relatives aux cartes de prix)
  const connectors = [
    { y: 50, highlight: hoveredCard === 0 || hoveredCard === 1 },
    { y: 75, highlight: hoveredCard === 1 || hoveredCard === 2 },
  ]
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
      {/* Grille verticale - PLUS VISIBLE */}
      {verticalLines.map((x, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0"
          style={{
            left: `${x}%`,
            width: '1px',
            background: 'rgba(18,18,18,0.08)',
          }}
        />
      ))}
      
      {/* Grille horizontale - PLUS VISIBLE */}
      {horizontalLines.map((y, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0"
          style={{
            top: `${y}%`,
            height: '1px',
            background: 'rgba(18,18,18,0.08)',
          }}
        />
      ))}
      
      {/* Lignes connecteurs dynamiques - BIEN VISIBLES */}
      {connectors.map((connector, i) => (
        <motion.div
          key={`connector-${i}`}
          className="absolute left-[10%] right-[10%]"
          style={{
            top: `${connector.y}%`,
            height: '2px',
            background: connector.highlight 
              ? 'rgba(124, 58, 237, 0.8)' 
              : 'rgba(124, 58, 237, 0.25)',
            borderRadius: '1px',
          }}
          animate={{
            opacity: connector.highlight ? 1 : 0.7,
            scaleX: connector.highlight ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
      
      {/* Points de jonction aux intersections - PLUS VISIBLES */}
      {verticalLines.slice(1, -1).map((x, i) => 
        horizontalLines.slice(1, -1).map((y, j) => (
          <div
            key={`dot-${i}-${j}`}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: '3px',
              height: '3px',
              background: 'rgba(18,18,18,0.15)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))
      )}
    </div>
  )
}


// ─── STRIPE RAILS — Lignes fines décalées de 11px vers l'extérieur ───────────
function StripeRails({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const lineColor = theme === 'light' ? 'rgba(18,18,18,0.06)' : 'rgba(255,255,255,0.05)'
  const railOffset = 'max(calc(2rem - 11px), calc((100vw - 1400px) / 2 - 11px))'
  
  return (
    <>
      <div
        className="fixed top-0 bottom-0 pointer-events-none"
        style={{
          left: railOffset,
          width: '1px',
          background: lineColor,
          zIndex: 30,
        }}
      />
      <div
        className="fixed top-0 bottom-0 pointer-events-none"
        style={{
          right: railOffset,
          width: '1px',
          background: lineColor,
          zIndex: 30,
        }}
      />
    </>
  )
}

// ─── LIGNE DE VIE GOLD — Traverse toutes les sections (sous la grille) ───────
function LifeLineGold({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      style={{ zIndex: 6 }}
    >
      <defs>
        <linearGradient id="goldFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(212, 175, 55, 0)" />
          <stop offset="20%" stopColor="rgba(212, 175, 55, 0.08)" />
          <stop offset="50%" stopColor="rgba(212, 175, 55, 0.15)" />
          <stop offset="80%" stopColor="rgba(212, 175, 55, 0.08)" />
          <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
        </linearGradient>
      </defs>
      
      <motion.path
        d="M -100,350 
           C 200,300 400,400 600,350 
           S 1000,280 1200,350 
           S 1600,420 1800,350
           S 2100,300 2300,350
           S 2600,400 2800,350"
        fill="none"
        stroke="url(#goldFlow)"
        strokeWidth="0.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />
      
      <motion.path
        d="M -100,550 
           C 150,600 350,500 550,550 
           S 850,620 1050,550 
           S 1350,480 1550,550
           S 1850,600 2050,550
           S 2250,500 2450,550"
        fill="none"
        stroke="rgba(212, 175, 55, 0.08)"
        strokeWidth="0.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 5, ease: 'easeInOut', delay: 1 }}
      />
    </svg>
  )
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────

interface SignatureBackgroundProps {
  children?: React.ReactNode
  className?: string
  enableParallax?: boolean
  theme?: 'light' | 'dark'
  variant?: BackgroundVariant
}

export function SignatureBackground({ 
  children, 
  className = '', 
  enableParallax = true,
  theme = 'light',
  variant = 'glass',
}: SignatureBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  
  // Track scroll for glass fade-out effect
  const { scrollY } = useScroll()

  useEffect(() => {
    if (!enableParallax) return
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5))
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [enableParallax, mouseX])

  // Padding ajusté pour le décalage des rails (11px)
  const contentPadding = 'max(calc(2rem + 11px), calc((100vw - 1400px) / 2 + 11px))'

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-x-hidden ${className}`}
      style={{
        background: theme === 'light' ? '#FAF9F6' : '#0f172a',
        minHeight: '100%',
      }}
    >
      {/* Background variant-specific */}
      {variant === 'glass' && (
        <>
          {glassShapes
            .filter(s => s.layer === 'back')
            .map(shape => <GlassDalle key={shape.id} shape={shape} mouseX={mouseX} scrollY={scrollY} />)
          }
        </>
      )}
      
      {variant === 'aura' && <AuraBackground />}
      {variant === 'dots' && <PrecisionDots />}
      {variant === 'grid' && <TechnicalGrid />}
      
      {/* Ligne de vie Gold — toujours présente */}
      <LifeLineGold theme={theme} />
      
      {/* Rails — toujours présents */}
      <StripeRails theme={theme} />
      
      {/* Couche avant glass (pour variant glass) */}
      {variant === 'glass' && (
        <>
          {glassShapes
            .filter(s => s.layer === 'front')
            .map(shape => <GlassDalle key={shape.id} shape={shape} mouseX={mouseX} scrollY={scrollY} />)
          }
        </>
      )}
      
      {/* Contenu principal */}
      <div 
        className="relative z-40"
        style={{
          paddingLeft: contentPadding,
          paddingRight: contentPadding,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── VARIANTES PRÉCONFIGURÉES ───────────────────────────────────────────────

export function GlassBackground(props: Omit<SignatureBackgroundProps, 'variant'>) {
  return <SignatureBackground {...props} variant="glass" />
}

export function AuraBackgroundSection(props: Omit<SignatureBackgroundProps, 'variant'>) {
  return <SignatureBackground {...props} variant="aura" />
}

export function DotsBackground(props: Omit<SignatureBackgroundProps, 'variant'>) {
  return <SignatureBackground {...props} variant="dots" />
}

export function GridBackground(props: Omit<SignatureBackgroundProps, 'variant'>) {
  return <SignatureBackground {...props} variant="grid" />
}

export function SignatureBackgroundSimple(props: SignatureBackgroundProps) {
  return <SignatureBackground {...props} variant="none" />
}
