'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'

const SPRING_SOFT = { stiffness: 60, damping: 20 }

// ─── DATA SPHERE ─────────────────────────────────────────────────────────────
function DataSphere({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [12, -12])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-12, 12])
  const smoothX = useSpring(rotateX, SPRING_SOFT)
  const smoothY = useSpring(rotateY, SPRING_SOFT)

  const orbitRings = [
    { rx: 80, ry: 22, rot: 0,   delay: 0,   duration: 12 },
    { rx: 64, ry: 20, rot: 55,  delay: 0,   duration: 18 },
    { rx: 52, ry: 16, rot: -35, delay: 0,   duration: 9  },
  ]

  return (
    <motion.div
      style={{ rotateX: smoothX, rotateY: smoothY, transformStyle: 'preserve-3d', perspective: 800 }}
      className="vision-sphere-wrap"
    >
      <div style={{ position: 'relative', width: 220, height: 220 }}>
        {/* Outer glow */}
        <div style={{
          position: 'absolute', inset: -40,
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(236,72,153,0.08) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(20px)',
        }} />

        {/* Core sphere */}
        <div style={{
          position: 'absolute', inset: 20,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 35% 35%, rgba(167,139,250,0.25) 0%, rgba(124,58,237,0.12) 40%, rgba(15,23,42,0.8) 100%)',
          border: '1px solid rgba(167,139,250,0.15)',
          boxShadow: '0 0 60px rgba(124,58,237,0.2), inset 0 0 40px rgba(124,58,237,0.08)',
        }} />

        {/* SVG orbit rings */}
        <svg
          width={220} height={220}
          viewBox="-110 -110 220 220"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {orbitRings.map((ring, i) => (
            <g key={i} transform={`rotate(${ring.rot})`}>
              <ellipse
                cx={0} cy={0}
                rx={ring.rx} ry={ring.ry}
                fill="none"
                stroke={`rgba(167,139,250,${0.12 - i * 0.03})`}
                strokeWidth={0.8}
                strokeDasharray={i === 1 ? '3 6' : 'none'}
              />
              <circle r={2.5} fill={`rgba(167,139,250,${0.7 - i * 0.15})`}>
                <animateMotion
                  dur={`${ring.duration}s`}
                  repeatCount="indefinite"
                  begin={`${ring.delay}s`}
                >
                  <mpath href={`#orbit-${i}`} />
                </animateMotion>
              </circle>
              <path
                id={`orbit-${i}`}
                d={`M ${ring.rx} 0 A ${ring.rx} ${ring.ry} 0 1 1 ${ring.rx - 0.01} 0`}
                fill="none"
                style={{ display: 'none' }}
              />
            </g>
          ))}

          {/* Data dots scattered around sphere */}
          {[
            { cx: -85, cy: -18, r: 1.8, op: 0.5 },
            { cx: 88,  cy: 12,  r: 1.4, op: 0.4 },
            { cx: -40, cy: 72,  r: 1.2, op: 0.35 },
            { cx: 52,  cy: -68, r: 1.6, op: 0.45 },
            { cx: -68, cy: 55,  r: 1,   op: 0.3  },
            { cx: 78,  cy: -42, r: 1.8, op: 0.4  },
          ].map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="rgba(167,139,250,1)" opacity={d.op} />
          ))}
        </svg>

        {/* Center nucleus */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 12, height: 12, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.9) 0%, rgba(124,58,237,0.6) 100%)',
          boxShadow: '0 0 20px rgba(236,72,153,0.5)',
        }} />
      </div>
    </motion.div>
  )
}

// ─── VISION SECTION ──────────────────────────────────────────────────────────
export default function VisionSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: false, margin: '-5% 0px' })

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      rawX.set((e.clientX - rect.left) / rect.width - 0.5)
      rawY.set((e.clientY - rect.top) / rect.height - 0.5)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [rawX, rawY])

  return (
    <section
      ref={ref}
      className="noise-dark section-full"
      style={{
        background: '#0a0f1a',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
      }}
    >
      {/* Deep radial canvas */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '80vw', height: '80vh',
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, rgba(236,72,153,0.04) 40%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '-10%',
          width: '40vw', height: '40vh',
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.05) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', left: '-5%',
          width: '35vw', height: '35vh',
          background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.04) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)',
        }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="vision-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '4rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Left: massive title */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.1 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.35rem 0.9rem', borderRadius: 40,
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(167,139,250,0.15)',
              marginBottom: '2rem',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(167,139,250,0.7)' }} />
              <span style={{ fontSize: 11, color: 'rgba(167,139,250,0.8)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Vision</span>
            </div>

            <h2 style={{
              fontFamily: 'Clash Display, DM Sans, system-ui',
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              marginBottom: '1.8rem',
              maxWidth: 620,
            }}>
              L&apos;orchestration<br />
              au service de<br />
              <span style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.95) 0%, rgba(236,72,153,0.85) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                votre temps.
              </span>
            </h2>

            <p style={{
              fontSize: 17,
              color: 'rgba(148,163,184,0.75)',
              lineHeight: 1.8,
              maxWidth: 480,
              marginBottom: '2.5rem',
            }}>
              CalendaPro ne gère pas des rendez-vous.<br />Il restitue du temps. De l&apos;attention. De la liberté.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 32, height: 1,
                background: 'linear-gradient(90deg, rgba(124,58,237,0.6), transparent)',
              }} />
              <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.08em' }}>
                CHAQUE MILLISECONDE COMPTE
              </span>
            </div>
          </motion.div>

          {/* Right: interactive sphere */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <DataSphere mouseX={rawX} mouseY={rawY} />
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .vision-grid { grid-template-columns: 1fr !important; }
          .vision-sphere-wrap { display: none; }
        }
        @keyframes vision-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}
