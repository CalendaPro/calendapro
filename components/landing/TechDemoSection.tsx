'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const T = {
  bg: '#FAF9F6',
  accent: '#7c3aed',
  accentSoft: 'rgba(124,58,237,0.08)',
  accentBorder: 'rgba(124,58,237,0.15)',
  pink: '#ec4899',
  text: '#1A1A1A',
  muted: '#78716c',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(26,26,26,0.07)',
}
const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 }

const SCENES = [
  { id: 0, tab: 'Disponibilité', title: 'Une onde qui révèle', highlight: "l'intelligence.", sub: 'Le moteur analyse vos calendriers en temps réel et détecte chaque créneau libre avec une précision chirurgicale.' },
  { id: 1, tab: 'Pipeline', title: 'Des données qui', highlight: 'voyagent.', sub: "Chaque requête traverse un pipeline validé en millisecondes, de l'API à la confirmation finale." },
  { id: 2, tab: 'Confirmation', title: "L'instant où tout", highlight: 'converge.', sub: 'Le dashboard révèle la confirmation au premier plan, pendant que le moteur se synchronise silencieusement.' },
]

function GlassCard({ children, style = {}, blur = 16 }: { children: React.ReactNode; style?: React.CSSProperties; blur?: number }) {
  return (
    <div style={{
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      background: T.glass,
      border: `1px solid ${T.glassBorder}`,
      borderRadius: 20,
      boxShadow: '0 4px 32px rgba(26,26,26,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
      ...style,
    }}>
      {children}
    </div>
  )
}

function AvailabilityScene({ active }: { active: boolean }) {
  const [wave, setWave] = useState(0)
  useEffect(() => {
    if (!active) { setWave(0); return }
    const iv = setInterval(() => setWave(p => (p + 1) % 120), 30)
    return () => clearInterval(iv)
  }, [active])

  const r = (wave / 120) * 340
  const waveOpacity = wave < 60 ? 1 - wave / 60 : 0
  const slots = [
    { label: '09h00', free: true,  x: 60,  y: 110 },
    { label: '10h30', free: false, x: 160, y: 70  },
    { label: '14h00', free: true,  x: 240, y: 130 },
    { label: '15h30', free: true,  x: 310, y: 85  },
    { label: '17h00', free: false, x: 200, y: 170 },
    { label: '18h30', free: true,  x: 100, y: 155 },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', padding: '1.5rem' }}>
      <svg width="100%" height="100%" viewBox="0 0 380 220" style={{ position: 'absolute', inset: 0 }}>
        {[0, 0.3, 0.6].map((offset, i) => {
          const rr = Math.max(0, r - offset * 80)
          const op = Math.max(0, waveOpacity - i * 0.3)
          return (
            <circle key={i} cx={190} cy={110} r={rr} fill="none"
              stroke={`rgba(124,58,237,${op * 0.5})`}
              strokeWidth={1.5 - i * 0.4}
            />
          )
        })}
        {slots.map((s, i) => {
          const dist = Math.sqrt((s.x - 190) ** 2 + (s.y - 110) ** 2)
          const revealed = r > dist
          return (
            <g key={i} style={{ opacity: revealed ? 1 : 0.07, transition: 'opacity 0.5s ease' }}>
              <rect x={s.x - 28} y={s.y - 12} width={56} height={24} rx={8}
                fill={s.free ? 'rgba(124,58,237,0.1)' : 'rgba(236,72,153,0.08)'}
                stroke={s.free ? 'rgba(124,58,237,0.3)' : 'rgba(236,72,153,0.25)'}
                strokeWidth={1}
              />
              <text x={s.x} y={s.y + 4.5} textAnchor="middle"
                fill={s.free ? T.accent : T.pink}
                fontSize={9} fontFamily="DM Sans, system-ui" fontWeight={500}
              >{s.label}</text>
            </g>
          )
        })}
        <circle cx={190} cy={110} r={4} fill={T.accent} opacity={0.4} />
        <circle cx={190} cy={110} r={2} fill={T.accent} />
      </svg>
      <div style={{ position: 'absolute', bottom: '1.2rem', left: '1.5rem', right: '1.5rem', display: 'flex', gap: 8 }}>
        {[{label: 'Libre', color: T.accent}, {label: 'Occupé', color: T.pink}].map(item => (
          <GlassCard key={item.label} style={{ padding: '0.45rem 0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, opacity: 0.7 }} />
            <span style={{ fontSize: 11, color: T.muted, fontFamily: 'DM Sans, system-ui' }}>{item.label}</span>
          </GlassCard>
        ))}
        <GlassCard style={{ padding: '0.45rem 0.9rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, color: T.accent, fontFamily: 'DM Sans, system-ui', fontWeight: 500 }}>3 sources</span>
        </GlassCard>
      </div>
    </div>
  )
}

const NODES = [
  { label: 'API',    x: 55,  y: 105 },
  { label: 'Auth',   x: 155, y: 58  },
  { label: 'Engine', x: 230, y: 118 },
  { label: 'Notify', x: 305, y: 65  },
  { label: 'Sync',   x: 345, y: 148 },
]
const EDGES = [[0,1],[1,2],[2,3],[2,4]]

function cubicBezierPoint(t: number, p0x: number, p0y: number, p3x: number, p3y: number) {
  const cp1x = (p0x + p3x) / 2; const cp1y = p0y
  const cp2x = (p0x + p3x) / 2; const cp2y = p3y
  const u = 1 - t
  return {
    x: u**3*p0x + 3*u**2*t*cp1x + 3*u*t**2*cp2x + t**3*p3x,
    y: u**3*p0y + 3*u**2*t*cp1y + 3*u*t**2*cp2y + t**3*p3y,
  }
}

function PipelineScene({ active }: { active: boolean }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => setTick(p => p + 1), 16)
    return () => clearInterval(iv)
  }, [active])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', padding: '1rem' }}>
      <svg width="100%" height="100%" viewBox="0 0 400 210" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {EDGES.map(([fi, ti], ei) => {
          const n0 = NODES[fi]; const n1 = NODES[ti]
          const mx = (n0.x + n1.x) / 2
          return (
            <path key={ei}
              d={`M${n0.x},${n0.y} C${mx},${n0.y} ${mx},${n1.y} ${n1.x},${n1.y}`}
              fill="none" stroke="rgba(124,58,237,0.07)" strokeWidth={1.5} strokeDasharray="3 4"
            />
          )
        })}
        {EDGES.flatMap(([fi, ti], ei) => {
          const n0 = NODES[fi]; const n1 = NODES[ti]
          return [0, 0.4, 0.7].map((off, pi) => {
            const t = ((tick * 0.008 + off + ei * 0.2) % 1)
            const pos = cubicBezierPoint(t, n0.x, n0.y, n1.x, n1.y)
            const alpha = Math.sin(t * Math.PI) * 0.9
            return (
              <g key={`${ei}-${pi}`}>
                <circle cx={pos.x} cy={pos.y} r={5} fill={T.accent} opacity={alpha * 0.15} />
                <circle cx={pos.x} cy={pos.y} r={2.5} fill={T.accent} opacity={alpha * 0.7} />
                <circle cx={pos.x} cy={pos.y} r={1.2} fill="white" opacity={alpha} />
              </g>
            )
          })
        })}
        {NODES.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={19} fill="rgba(255,255,255,0.9)" stroke="rgba(26,26,26,0.06)" strokeWidth={1} />
            <circle cx={n.x} cy={n.y} r={14} fill={T.accentSoft} stroke={T.accentBorder} strokeWidth={1} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fill={T.accent} fontSize={8} fontFamily="DM Sans, system-ui" fontWeight={600}>{n.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', right: '1.5rem' }}>
        <GlassCard style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: 'DM Sans, system-ui' }}>Latence pipeline</span>
          <span style={{ fontSize: 12, color: T.accent, fontFamily: 'DM Sans, system-ui', fontWeight: 600 }}>38ms</span>
        </GlassCard>
      </div>
    </div>
  )
}

function DashboardScene({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: '1.5rem', filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none' }}>
        <GlassCard style={{ position: 'absolute', top: 12, left: 16, width: 110, padding: '0.7rem', borderRadius: 12 }}>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 3 }}>RDV du jour</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>12</div>
        </GlassCard>
        <GlassCard style={{ position: 'absolute', top: 12, right: 16, width: 120, padding: '0.7rem', borderRadius: 12 }}>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 3 }}>Confirmations</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>97%</div>
        </GlassCard>
        <GlassCard style={{ position: 'absolute', bottom: 32, left: 24, right: 24, padding: '0.7rem', borderRadius: 12 }}>
          <div style={{ height: 7, background: 'rgba(26,26,26,0.06)', borderRadius: 4, marginBottom: 6 }} />
          <div style={{ height: 7, background: 'rgba(26,26,26,0.06)', borderRadius: 4, width: '65%' }} />
        </GlassCard>
      </div>
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 16 }}
        animate={active ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.85, opacity: 0, y: 16 }}
        transition={{ ...SPRING, delay: 0.15 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 260 }}
      >
        <div style={{
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(124,58,237,0.18)', borderRadius: 24, padding: '1.6rem',
          boxShadow: '0 24px 64px rgba(124,58,237,0.12), 0 4px 16px rgba(26,26,26,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: `linear-gradient(135deg, ${T.accent}, ${T.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Confirmé</div>
              <div style={{ fontSize: 10, color: T.muted }}>3 calendriers synchronisés</div>
            </div>
          </div>
          <div style={{ padding: '0.85rem', background: T.accentSoft, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>Mardi 22 avril 2025</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>14h30 — 15h30</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Consultation initiale</div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['Google', 'Outlook', 'Apple'].map(cal => (
              <div key={cal} style={{ flex: 1, padding: '0.35rem', background: T.accentSoft, borderRadius: 7, textAlign: 'center', border: `1px solid ${T.accentBorder}` }}>
                <div style={{ fontSize: 9, color: T.accent, fontWeight: 500 }}>{cal}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function TechDemoSection() {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: false, margin: '-10% 0px' })

  useEffect(() => {
    if (!isInView) return
    const iv = setInterval(() => setActive(p => (p + 1) % SCENES.length), 5000)
    return () => clearInterval(iv)
  }, [isInView])

  const SceneMap = [AvailabilityScene, PipelineScene, DashboardScene]
  const ActiveScene = SceneMap[active]
  const scene = SCENES[active]

  return (
    <section ref={ref} className="noise-overlay section-full" style={{ background: T.bg, position: 'relative', overflow: 'hidden', minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)' }} />

      <div style={{ width: '100%', padding: '4rem 6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '6rem', alignItems: 'center', width: '100%', maxWidth: 1400, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ ...SPRING, delay: 0.2 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: '2.5rem', flexWrap: 'wrap' }}>
              {SCENES.map((s, i) => (
                <button key={s.id} onClick={() => setActive(i)} style={{
                  padding: '0.45rem 1rem', borderRadius: 40, border: active === i ? `1px solid ${T.accentBorder}` : '1px solid rgba(26,26,26,0.08)',
                  background: active === i ? T.accentSoft : 'transparent', color: active === i ? T.accent : T.muted,
                  fontSize: 13, fontWeight: active === i ? 600 : 400, cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                  transition: 'all 0.25s ease',
                }}>{s.tab}</button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={SPRING}>
                <h3 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: T.text, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '0.6rem' }}>
                  {scene.title}<br />
                  <span style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.pink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {scene.highlight}
                  </span>
                </h3>
                <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, maxWidth: 380 }}>{scene.sub}</p>
              </motion.div>
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 6, marginTop: '2rem' }}>
              {SCENES.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} style={{
                  width: active === i ? 24 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0,
                  background: active === i ? T.accent : 'rgba(124,58,237,0.18)',
                  transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                }} />
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ ...SPRING, delay: 0.3 }}>
            <GlassCard style={{ height: 320, overflow: 'hidden', position: 'relative' }}>
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={SPRING} style={{ position: 'absolute', inset: 0 }}>
                  <ActiveScene active={isInView} />
                </motion.div>
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}