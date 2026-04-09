'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { motion } from 'framer-motion'
import type { Variants, Transition } from 'framer-motion'

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
  Scissors: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  ),
  Target: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Camera: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Laptop: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.37 20H3.63a1 1 0 0 1-.91-1.45L4 16"/>
    </svg>
  ),
  Heart: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Palette: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  Briefcase: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Activity: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
}

// ─── ORBITAL CANVAS ────────────────────────────────────────────────────────────
function OrbitalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId: number
    let t = 0
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)
    const orbits = [
      { radius: 110, speed: 0.4,  size: 7,  color: '#7c3aed', label: 'RDV',      angle: 0,   trail: 24 },
      { radius: 170, speed: 0.25, size: 5,  color: '#ec4899', label: 'SMS',      angle: 2.1, trail: 18 },
      { radius: 230, speed: 0.15, size: 9,  color: '#a78bfa', label: 'Paiement', angle: 4.2, trail: 30 },
      { radius: 290, speed: 0.08, size: 4,  color: '#f472b6', label: 'Client',   angle: 1.0, trail: 14 },
      { radius: 340, speed: 0.05, size: 6,  color: '#c084fc', label: 'IA',       angle: 3.5, trail: 20 },
    ]
    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const cy = h / 2
      ctx.clearRect(0, 0, w, h)
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70)
      glow.addColorStop(0, 'rgba(124,58,237,0.35)')
      glow.addColorStop(0.4, 'rgba(124,58,237,0.10)')
      glow.addColorStop(1, 'rgba(124,58,237,0)')
      ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2)
      ctx.fillStyle = glow; ctx.fill()
      const cd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10)
      cd.addColorStop(0, '#ffffff'); cd.addColorStop(1, '#7c3aed')
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.fillStyle = cd; ctx.fill()
      orbits.forEach((orb) => {
        const angle = orb.angle + t * orb.speed
        const x = cx + Math.cos(angle) * orb.radius
        const y = cy + Math.sin(angle) * (orb.radius * 0.38)
        ctx.beginPath()
        ctx.ellipse(cx, cy, orb.radius, orb.radius * 0.38, 0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(124,58,237,0.10)'; ctx.lineWidth = 1; ctx.stroke()
        for (let i = 0; i < orb.trail; i++) {
          const ta = angle - i * 0.045
          const tx = cx + Math.cos(ta) * orb.radius
          const ty = cy + Math.sin(ta) * (orb.radius * 0.38)
          const alpha = (1 - i / orb.trail) * 0.35
          const r = orb.size * (1 - i / orb.trail) * 0.7
          ctx.beginPath()
          ctx.arc(tx, ty, Math.max(r, 0.5), 0, Math.PI * 2)
          ctx.fillStyle = `${orb.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
          ctx.fill()
        }
        const dg = ctx.createRadialGradient(x, y, 0, x, y, orb.size * 3)
        dg.addColorStop(0, orb.color + 'aa'); dg.addColorStop(1, orb.color + '00')
        ctx.beginPath(); ctx.arc(x, y, orb.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = dg; ctx.fill()
        ctx.beginPath(); ctx.arc(x, y, orb.size, 0, Math.PI * 2)
        ctx.fillStyle = orb.color; ctx.shadowColor = orb.color
        ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0
        ctx.font = '600 10px "DM Sans", sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.55)'
        ctx.fillText(orb.label, x + orb.size + 5, y + 4)
      })
      t += 0.012
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ─── BOOKING FLOW ANIMATION ────────────────────────────────────────────────────
function BookingFlowSVG() {
  return (
    <div style={{ position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '32px', pointerEvents: 'none' }}>
      <svg width="100%" height="32" viewBox="0 0 320 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        {/* Path ligne courbe */}
        <path
          id="flow-path"
          d="M10 16 C60 4, 120 28, 160 16 C200 4, 260 28, 310 16"
          stroke="rgba(124,58,237,0.18)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
        />
        {/* Point lumineux animé */}
        <circle r="4" fill="#7c3aed" style={{ filter: 'drop-shadow(0 0 6px #7c3aed)' }}>
          <animateMotion dur="2.8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#flow-path" />
          </animateMotion>
        </circle>
        <circle r="2" fill="white" opacity="0.9">
          <animateMotion dur="2.8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#flow-path" />
          </animateMotion>
        </circle>
        {/* Labels endpoints */}
        <text x="0" y="28" fontSize="7" fill="rgba(124,58,237,0.5)" fontFamily="DM Sans, sans-serif" fontWeight="600">CLIENT</text>
        <text x="270" y="28" fontSize="7" fill="rgba(236,72,153,0.5)" fontFamily="DM Sans, sans-serif" fontWeight="600">DASHBOARD</text>
      </svg>
    </div>
  )
}

// ─── LIVE CALENDAR ANIMATION ───────────────────────────────────────────────────
function LiveCalendar() {
  const [confirmedIdx, setConfirmedIdx] = useState<number[]>([])
  const [currentFill, setCurrentFill] = useState<number | null>(null)

  useEffect(() => {
    // Séquence : on remplit une case toutes les 1.8s, puis on repart
    const slots = [2, 5, 8, 11, 14]
    let step = 0
    const run = () => {
      if (step < slots.length) {
        setCurrentFill(slots[step])
        setTimeout(() => {
          setConfirmedIdx(prev => [...prev, slots[step]])
          setCurrentFill(null)
          step++
          setTimeout(run, 900)
        }, 600)
      } else {
        // Reset après pause
        setTimeout(() => {
          step = 0
          setConfirmedIdx([])
          setTimeout(run, 400)
        }, 2200)
      }
    }
    const timer = setTimeout(run, 800)
    return () => clearTimeout(timer)
  }, [])

  const days = ['L', 'M', 'M', 'J', 'V']
  const rows = 3

  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: '16px',
      padding: '1.2rem',
      width: '220px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Avril 2026</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
      </div>
      {/* Jours header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {days.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.55rem', color: '#475569', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
        {Array.from({ length: 5 * rows }).map((_, i) => {
          const isConfirmed = confirmedIdx.includes(i)
          const isFilling = currentFill === i
          return (
            <div
              key={i}
              style={{
                height: '28px',
                borderRadius: '6px',
                border: isConfirmed
                  ? '1px solid rgba(124,58,237,0.5)'
                  : isFilling
                  ? '1px solid rgba(124,58,237,0.8)'
                  : '1px solid rgba(255,255,255,0.06)',
                background: isConfirmed
                  ? 'rgba(124,58,237,0.25)'
                  : isFilling
                  ? 'rgba(124,58,237,0.15)'
                  : 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.4s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isConfirmed && (
                <span style={{ fontSize: '0.5rem', color: '#a78bfa', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>✓</span>
              )}
              {isFilling && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)',
                  animation: 'shimmer 0.6s ease-in-out',
                }} />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(124,58,237,0.5)', border: '1px solid #7c3aed' }} />
        <span style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'DM Sans, sans-serif' }}>
          {confirmedIdx.length} créneau{confirmedIdx.length > 1 ? 'x' : ''} confirmé{confirmedIdx.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

// ─── FRANCE GLOBE SVG ──────────────────────────────────────────────────────────
function FranceGlobe() {
  const cities = [
    { cx: 135, cy: 88,  label: 'Paris',     delay: 0 },
    { cx: 112, cy: 148, label: 'Bordeaux',  delay: 0.4 },
    { cx: 160, cy: 158, label: 'Lyon',      delay: 0.8 },
    { cx: 178, cy: 178, label: 'Nice',      delay: 1.2 },
    { cx: 98,  cy: 115, label: 'Nantes',    delay: 1.6 },
    { cx: 185, cy: 95,  label: 'Strasbourg',delay: 2.0 },
    { cx: 145, cy: 195, label: 'Marseille', delay: 2.4 },
    { cx: 125, cy: 118, label: 'Clermont',  delay: 2.8 },
  ]

  return (
    <div style={{ position: 'relative', width: '280px', height: '260px', margin: '0 auto' }}>
      <svg viewBox="0 60 280 200" width="280" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Hexagonal grid wireframe background */}
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <circle
              key={`grid-${row}-${col}`}
              cx={col * 38 + (row % 2 === 0 ? 0 : 19) + 10}
              cy={row * 32 + 70}
              r="1"
              fill="rgba(124,58,237,0.15)"
            />
          ))
        )}
        {/* Connection lines between nearby cities */}
        {[
          [135,88, 98,115], [135,88, 185,95], [135,88, 160,158],
          [98,115, 112,148], [112,148, 145,195], [160,158, 178,178],
          [160,158, 145,195], [178,178, 145,195], [185,95, 160,158],
        ].map(([x1,y1,x2,y2], i) => (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(124,58,237,0.12)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}
        {/* Animated connection pulses */}
        {cities.map((city, i) => (
          <g key={`city-${i}`}>
            {/* Outer ring pulse */}
            <circle cx={city.cx} cy={city.cy} r="12" fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1">
              <animate attributeName="r" values="6;16;6" dur="3s" begin={`${city.delay}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" begin={`${city.delay}s`} repeatCount="indefinite" />
            </circle>
            {/* Dot */}
            <circle cx={city.cx} cy={city.cy} r="3.5" fill="#7c3aed">
              <animate attributeName="fill" values="#7c3aed;#ec4899;#7c3aed" dur="3s" begin={`${city.delay}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={city.cx} cy={city.cy} r="1.5" fill="white" opacity="0.9" />
          </g>
        ))}
      </svg>
      {/* Floating city labels */}
      {cities.slice(0, 4).map((city, i) => (
        <motion.div
          key={`label-${i}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
          transition={{ duration: 3, delay: city.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: city.cx + 8,
            top: city.cy - 18,
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '6px',
            padding: '2px 6px',
            fontSize: '0.55rem',
            color: '#a78bfa',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {city.label}
        </motion.div>
      ))}
    </div>
  )
}

// ─── NAV ───────────────────────────────────────────────────────────────────────
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
      transition={{ duration: 0.6, ease: 'easeOut' } as Transition}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 2.5rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(250,250,248,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}
    >
      <BrandLogo />
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {[
          { label: 'Fonctionnalités', href: '#features' },
          { label: 'Tarifs', href: '#pricing' },
          { label: 'Marketplace', href: '/marketplace' },
        ].map((item) => (
          <a key={item.label} href={item.href} style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseOver={(e: ME) => (e.currentTarget.style.color = '#0f172a')}
            onMouseOut={(e: ME) => (e.currentTarget.style.color = '#64748b')}
          >{item.label}</a>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/login" style={{ fontSize: '0.85rem', fontWeight: 500, color: '#0f172a', textDecoration: 'none', padding: '0.45rem 1.1rem', borderRadius: '100px', border: '1px solid rgba(0,0,0,0.14)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
          Connexion
        </Link>
        <Link href="/login" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', textDecoration: 'none', padding: '0.5rem 1.3rem', borderRadius: '100px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(124,58,237,0.35)', transition: 'all 0.2s' }}
          onMouseOver={(e: ME) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.45)' }}
          onMouseOut={(e: ME) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.35)' }}
        >
          Commencer gratuitement
        </Link>
      </div>
    </motion.nav>
  )
}

// ─── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  const c: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }
  const i: Variants = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } as Transition } }
  const f1: Transition = { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  const f2: Transition = { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }
  const f3: Transition = { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }

  return (
    <section className="hero-grid" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '6rem 4rem 4rem', gap: '4rem', maxWidth: '1280px', margin: '0 auto' }}>
      <motion.div variants={c} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div variants={i}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0.35rem 1rem', borderRadius: '100px', fontFamily: 'DM Sans, sans-serif' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Bêta publique · Inscrivez-vous gratuitement
          </span>
        </motion.div>
        <motion.h1 variants={i} style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: 'clamp(2.8rem, 5vw, 5.2rem)', fontWeight: 700, lineHeight: 1.0, letterSpacing: '-0.04em', color: '#0f172a', margin: 0 }}>
          Vos rendez-vous,{' '}
          <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 60%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            enfin maîtrisés
          </span>
        </motion.h1>
        <motion.p variants={i} style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.75, fontFamily: 'DM Sans, sans-serif', fontWeight: 300, maxWidth: '480px', margin: 0 }}>
          CalendaPro centralise votre agenda, vos clients et vos paiements. La plateforme tout-en-un pour les professionnels qui veulent <strong style={{ color: '#0f172a', fontWeight: 600 }}>croître</strong>, pas gérer.
        </motion.p>
        <motion.div variants={i} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 2rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', borderRadius: '100px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 8px 32px rgba(124,58,237,0.35)', transition: 'all 0.25s ease' }}
            onMouseOver={(e: ME) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(124,58,237,0.45)' }}
            onMouseOut={(e: ME) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)' }}
          >
            Démarrer gratuitement <Icons.Arrow />
          </Link>
          <Link href="/client-sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 2rem', background: 'transparent', color: '#0f172a', borderRadius: '100px', fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid rgba(0,0,0,0.12)', transition: 'all 0.2s' }}
            onMouseOver={(e: ME) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = '#7c3aed' }}
            onMouseOut={(e: ME) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.color = '#0f172a' }}
          >
            Trouver un professionnel
          </Link>
        </motion.div>

        {/* ── STATS : uniquement ce qui est vrai ── */}
        <motion.div variants={i} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {[
            { num: '0€', label: 'Pour commencer' },
            { num: 'Bêta', label: 'Accès anticipé' },
            { num: '∞', label: 'RDV en Premium' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', fontFamily: 'DM Sans, sans-serif' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 } as Transition} style={{ position: 'relative', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: '10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'rgba(15,23,42,0.03)', borderRadius: '24px', border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden' }}>
          <OrbitalCanvas />

          {/* ── NOUVEAU : Flux de réservation ── */}
          <BookingFlowSVG />

          <motion.div animate={{ y: [0, -8, 0] }} transition={f1} style={{ position: 'absolute', top: '14%', right: '8%', background: 'white', borderRadius: '14px', padding: '0.75rem 1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}><Icons.Calendar /></span>
            <div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: '#0f172a' }}>RDV confirmé</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>Karim · 14h30</div>
            </div>
          </motion.div>
          <motion.div animate={{ y: [0, 8, 0] }} transition={f2} style={{ position: 'absolute', bottom: '16%', left: '6%', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', borderRadius: '14px', padding: '0.75rem 1rem', boxShadow: '0 8px 32px rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Icons.Bell /></span>
            <div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: 'white' }}>SMS envoyé</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans, sans-serif' }}>Rappel automatique</div>
            </div>
          </motion.div>
          <motion.div animate={{ y: [0, -6, 0] }} transition={f3} style={{ position: 'absolute', bottom: '30%', right: '5%', background: 'white', borderRadius: '14px', padding: '0.75rem 1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: '1px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><Icons.CreditCard /></span>
            <div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: '#0f172a' }}>+45€ encaissé</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>Acompte reçu</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

// ─── MARQUEE ───────────────────────────────────────────────────────────────────
function Marquee() {
  const items = ['Prise de RDV en ligne', 'Rappels automatiques', 'Paiement intégré', 'Mini-site personnalisé', 'Suivi client complet', 'Marketplace pros', 'Statistiques avancées', 'IA CalendaPro Infinity']
  return (
    <div style={{ padding: '1.5rem 0', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f1f0eb', overflow: 'hidden' }}>
      <div style={{ display: 'flex', overflow: 'hidden' }}>
        <div className="marquee-track">
          {[...Array(2)].map((_, idx) => items.map(item => (
            <div key={`${idx}-${item}`} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
              {item}
            </div>
          )))}
        </div>
      </div>
    </div>
  )
}

// ─── FEATURES ──────────────────────────────────────────────────────────────────
const featureList = [
  { Icon: Icons.Calendar, title: 'Calendrier intelligent', desc: 'Synchronisation Google & Outlook, gestion des créneaux, détection des conflits en temps réel.' },
  { Icon: Icons.Bell, title: 'Rappels automatiques', desc: 'Email, SMS et WhatsApp envoyés automatiquement. Réduisez les no-shows de 65%.' },
  { Icon: Icons.CreditCard, title: 'Paiement en ligne', desc: 'Acompte ou paiement complet via Stripe. Factures générées automatiquement.' },
  { Icon: Icons.Users, title: 'CRM client intégré', desc: 'Fiches clients, historique des RDV, notes et relances automatisées.' },
  { Icon: Icons.Globe, title: 'Mini-site personnalisable', desc: 'Votre page de booking branded en 2 minutes. URL personnalisée incluse.' },
  { Icon: Icons.Store, title: 'Marketplace CalendaPro', desc: 'Soyez trouvé par de nouveaux clients. Référencement par catégorie et localisation.' },
  { Icon: Icons.BarChart, title: 'Statistiques avancées', desc: 'CA mensuel, taux de remplissage, clients fidèles. Toutes les données pour grandir.' },
  { Icon: Icons.Code, title: "Widget d'intégration", desc: 'Ajoutez un bouton de réservation sur votre site existant en 2 lignes de code.' },
  { Icon: Icons.Sparkles, title: 'CalendaPro Infinity', desc: 'Assistant IA, recommandations intelligentes et automatisations avancées. Bientôt disponible.' },
]

function Features() {
  return (
    <section id="features" style={{ padding: '8rem 2.5rem', background: '#0f172a' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '6rem', alignItems: 'start' }}>
          {/* Left sticky header */}
          <div style={{ position: 'sticky', top: '6rem' }}>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa', background: 'rgba(124,58,237,0.15)', padding: '0.3rem 0.9rem', borderRadius: '100px', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>
              Fonctionnalités
            </div>
            <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'white', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Tout ce dont vous avez besoin,{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>rien de superflu.</span>
            </h2>
            <p style={{ color: '#475569', fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 300, lineHeight: 1.75, marginBottom: '2rem' }}>
              Un seul outil remplace Calendly, un CRM, Linktree — et ajoute la marketplace.
            </p>

            {/* ── NOUVEAU : Calendrier vivant ── */}
            <div style={{ marginBottom: '2rem' }}>
              <LiveCalendar />
            </div>

            <Link href="/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1.6rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', borderRadius: '100px', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
              Essayer gratuitement <Icons.Arrow />
            </Link>
          </div>

          {/* Right grid with scroll reveal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', overflow: 'hidden' }}>
            {featureList.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: idx * 0.06, ease: 'easeOut' } as Transition}
                className="feat-card"
                style={{ background: '#0f172a', padding: '2rem', transition: 'background 0.3s' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', marginBottom: '1.2rem' }}>
                  <f.Icon />
                </div>
                <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 600, color: 'white', marginBottom: '0.5rem', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>{f.title}</div>
                <div style={{ color: '#475569', fontSize: '0.825rem', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FOR WHO ───────────────────────────────────────────────────────────────────
const professions = [
  { Icon: Icons.Scissors, label: 'Barbiers & Coiffeurs' },
  { Icon: Icons.Target, label: 'Coachs de vie' },
  { Icon: Icons.Camera, label: 'Photographes' },
  { Icon: Icons.Laptop, label: 'Freelances' },
  { Icon: Icons.Heart, label: 'Thérapeutes' },
  { Icon: Icons.Palette, label: 'Artistes & Créatifs' },
  { Icon: Icons.Briefcase, label: 'Consultants' },
  { Icon: Icons.Activity, label: 'Coachs sportifs' },
]

function ForWho() {
  return (
    <section style={{ padding: '8rem 2.5rem', background: '#fafaf8' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }} className="forwho-grid">
          {/* Left : texte + globe */}
          <div>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(124,58,237,0.07)', padding: '0.3rem 0.9rem', borderRadius: '100px', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>Pour qui</div>
            <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Conçu pour les professionnels indépendants
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 300, lineHeight: 1.75, marginBottom: '2.5rem' }}>
              De Paris à Marseille, les indépendants font confiance à CalendaPro pour gérer leur activité au quotidien.
            </p>

            {/* ── NOUVEAU : Globe France ── */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.06)', display: 'inline-block' }}>
              <FranceGlobe />
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Disponible partout en France
                </span>
              </div>
            </div>
          </div>

          {/* Right : cards professions avec scroll reveal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {professions.map((p, idx) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.07, ease: 'easeOut' } as Transition}
                className="who-card"
                style={{ background: 'white', borderRadius: '18px', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', border: '1px solid rgba(0,0,0,0.06)', cursor: 'default', transition: 'all 0.3s' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(124,58,237,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                  <p.Icon />
                </div>
                <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: '#0f172a', letterSpacing: '-0.01em' }}>{p.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ───────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Starter',
    price: '0',
    period: 'pour toujours',
    features: ['20 rendez-vous / mois', 'Page publique de réservation', 'Rappels par email', 'Dashboard de base'],
    cta: 'Commencer gratuitement',
    href: '/onboarding',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '19',
    period: '/ mois',
    features: ['Rendez-vous illimités', 'SMS & WhatsApp inclus (30/mois)', 'Référencement Marketplace', "Widget d'intégration", 'Statistiques avancées', 'Support prioritaire'],
    cta: 'Passer au Premium',
    href: '/onboarding',
    highlight: true,
  },
  {
    name: 'Infinity',
    price: '49',
    period: '/ mois',
    badge: 'IA',
    features: ['Tout Premium inclus', 'Assistant IA (200 SMS/mois)', 'Automatisations avancées', 'Priorité Marketplace', 'Sous-domaine personnalisé', 'Accès API'],
    cta: 'Découvrir Infinity',
    href: '/onboarding',
    highlight: false,
  },
]

function Pricing() {
  return (
    <section id="pricing" style={{ padding: '8rem 2.5rem', background: '#f8f7f4' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(124,58,237,0.07)', padding: '0.3rem 0.9rem', borderRadius: '100px', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>Tarifs</div>
          <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '1rem' }}>
            Simple, transparent, sans surprise.
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>
            Démarrez gratuitement. Upgradez quand vous êtes prêt.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="pricing-grid">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' } as Transition}
              style={{ background: plan.highlight ? '#0f172a' : 'white', borderRadius: '24px', padding: '2.5rem', border: plan.highlight ? 'none' : '1px solid rgba(0,0,0,0.08)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: plan.highlight ? '0 24px 64px rgba(124,58,237,0.25)' : 'none', transform: plan.highlight ? 'scale(1.04)' : 'scale(1)' }}
            >
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 1.2rem', borderRadius: '100px', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                  Recommandé
                </div>
              )}
              {plan.badge && (
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0.25rem 0.7rem', borderRadius: '100px', fontFamily: 'DM Sans, sans-serif' }}>
                  {plan.badge}
                </div>
              )}
              <div>
                <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: plan.highlight ? '#a78bfa' : '#7c3aed', marginBottom: '1rem' }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: plan.highlight ? 'white' : '#0f172a', lineHeight: 1 }}>{plan.price}€</span>
                  <span style={{ fontSize: '0.85rem', color: plan.highlight ? '#475569' : '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>{plan.period}</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '1px', background: plan.highlight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', flexGrow: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: plan.highlight ? '#94a3b8' : '#64748b', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: plan.highlight ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.08)', color: plan.highlight ? '#a78bfa' : '#7c3aed', flexShrink: 0, marginTop: 2 }}>
                      <Icons.Check />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{ display: 'block', textAlign: 'center', padding: '0.9rem', borderRadius: '14px', background: plan.highlight ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'transparent', color: plan.highlight ? 'white' : '#7c3aed', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', border: plan.highlight ? 'none' : '1.5px solid rgba(124,58,237,0.25)', transition: 'all 0.2s' }}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ──────────────────────────────────────────────────────────────
const testimonials = [
  { text: "CalendaPro a réduit ma charge administrative de 2h par semaine. Mes clients adorent la simplicité de la prise de RDV en ligne.", name: 'Marie-Laure P.', role: 'Coach de vie · Paris', initials: 'ML', accent: '#7c3aed' },
  { text: "Depuis que j'utilise CalendaPro, mes absences ont chuté de 70%. Les rappels automatiques, c'est la fonctionnalité qui change tout.", name: 'Karim D.', role: 'Barbier · Lyon', initials: 'KD', accent: '#ec4899' },
  { text: "La marketplace m'a apporté 8 nouveaux clients en un mois sans aucune prospection. Le retour sur investissement est exceptionnel.", name: 'Sophie B.', role: 'Photographe · Bordeaux', initials: 'SB', accent: '#a78bfa' },
]

function Testimonials() {
  return (
    <section style={{ padding: '8rem 2.5rem', background: '#0f172a' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa', background: 'rgba(124,58,237,0.15)', padding: '0.3rem 0.9rem', borderRadius: '100px', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>Témoignages</div>
          <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'white' }}>
            Des professionnels qui ont repris le contrôle.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' } as Transition}
              style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div style={{ display: 'flex', gap: '3px' }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.75, color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontStyle: 'italic', flexGrow: 1 }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Clash Display', sans-serif", flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 600, fontSize: '0.875rem', color: 'white' }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'DM Sans, sans-serif' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA FINAL ─────────────────────────────────────────────────────────────────
function CtaFinal() {
  return (
    <section style={{ padding: '8rem 2.5rem', background: '#fafaf8', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: 'easeOut' } as Transition}
        style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}
      >
        <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c3aed', background: 'rgba(124,58,237,0.07)', padding: '0.3rem 0.9rem', borderRadius: '100px', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>Rejoignez-nous</div>

        {/* ── TEXTE REMPLACÉ ── */}
        <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.05 }}>
          Rejoignez le futur de la gestion de rendez-vous.
        </h2>
        <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>
          CalendaPro, l&apos;outil ultime pour simplifier la vie des indépendants.<br />
          <strong style={{ color: '#7c3aed', fontWeight: 600 }}>Inscrivez-vous pour la bêta.</strong>
        </p>

        <Link href="/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '1rem 2.5rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', borderRadius: '100px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 8px 40px rgba(124,58,237,0.35)', transition: 'all 0.2s' }}
          onMouseOver={(e: ME) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 50px rgba(124,58,237,0.45)' }}
          onMouseOut={(e: ME) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(124,58,237,0.35)' }}
        >
          Accéder à la bêta gratuitement <Icons.Arrow />
        </Link>
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {['Gratuit pour commencer', 'Sans carte bancaire', 'Annulation à tout moment'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>
              <span style={{ color: '#7c3aed' }}><Icons.Check /></span> {t}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

// ─── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#07070b', padding: '5rem 2.5rem 3rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '4rem' }} className="footer-grid">
          <div>
            <BrandLogo variant="dark" />
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.75, fontFamily: 'DM Sans, sans-serif', maxWidth: '280px', marginTop: '1rem', fontWeight: 300 }}>
              La plateforme tout-en-un pour les professionnels qui veulent gérer leur activité sans friction.
            </p>
          </div>
          {[
            { title: 'Produit', links: [{ l: 'Fonctionnalités', h: '#features' }, { l: 'Tarifs', h: '#pricing' }, { l: 'Marketplace', h: '/marketplace' }, { l: 'Widget', h: '/dashboard/widget' }] },
            { title: 'Ressources', links: [{ l: 'Documentation', h: '#' }, { l: 'Blog', h: '#' }, { l: 'Support', h: '#' }, { l: 'API', h: '#' }] },
            { title: 'Légal', links: [{ l: 'CGU', h: '#' }, { l: 'Confidentialité', h: '#' }, { l: 'Mentions légales', h: '#' }, { l: 'Contact', h: '#' }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569', marginBottom: '1.5rem' }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {col.links.map(link => (
                  <li key={link.l}>
                    <a href={link.h} style={{ fontSize: '0.85rem', color: '#334155', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 300, transition: 'color 0.2s' }}
                      onMouseOver={(e: ME) => (e.currentTarget.style.color = '#7c3aed')}
                      onMouseOut={(e: ME) => (e.currentTarget.style.color = '#334155')}
                    >{link.l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: '#1e293b', fontFamily: 'DM Sans, sans-serif' }}>
          <span>© 2026 CalendaPro. Tous droits réservés.</span>
          <span>Fait avec soin pour les professionnels français</span>
        </div>
      </div>
    </footer>
  )
}

// ─── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .marquee-track {
          animation: marquee 30s linear infinite;
          display: flex;
          gap: 3rem;
          width: max-content;
        }
        .feat-card:hover { background: rgba(124,58,237,0.06) !important; }
        .who-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); border-color: rgba(124,58,237,0.2) !important; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; padding: 5rem 1.5rem 3rem !important; }
          .nav-links { display: none !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .forwho-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ background: '#fafaf8', minHeight: '100vh', overflowX: 'hidden' }}>
        <Nav />
        <Hero />
        <Marquee />
        <Features />
        <ForWho />
        <Pricing />
        <Testimonials />
        <CtaFinal />
        <Footer />
      </div>
    </>
  )
}
