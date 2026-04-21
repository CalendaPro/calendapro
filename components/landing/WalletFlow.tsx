'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle, Shield, Zap, User, Wallet } from 'lucide-react'

interface ParticleBurst {
  id: number
  x: number
  y: number
  angle: number
  delay: number
}

export default function WalletFlow() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  const [particleProgress, setParticleProgress] = useState(0)
  const [showVaultGlow, setShowVaultGlow] = useState(false)
  const [showBadge, setShowBadge] = useState(false)
  const [animationStarted, setAnimationStarted] = useState(false)
  const [particleBursts, setParticleBursts] = useState<ParticleBurst[]>([])
  const [magneticIntensity, setMagneticIntensity] = useState(0)

  // Generate explosion particles on impact
  const triggerParticleExplosion = useCallback(() => {
    const newParticles: ParticleBurst[] = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: 320, // Vault position X
      y: 100, // Vault position Y
      angle: (i * 72) + Math.random() * 30, // Spread in 5 directions
      delay: i * 0.05
    }))
    setParticleBursts(newParticles)
    
    // Clear particles after animation
    setTimeout(() => setParticleBursts([]), 1200)
  }, [])

  useEffect(() => {
    if (isInView && !animationStarted) {
      setAnimationStarted(true)
      const startTime = Date.now()
      const duration = 2500

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ultra-smooth easing with anticipation
        const easeOutQuint = 1 - Math.pow(1 - progress, 5)
        setParticleProgress(easeOutQuint)

        // Magnetic pulse intensity increases as particle approaches
        if (progress > 0.6) {
          setMagneticIntensity((progress - 0.6) * 2.5)
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // Impact! Trigger effects
          setMagneticIntensity(0)
          setShowVaultGlow(true)
          triggerParticleExplosion()
          setTimeout(() => setShowBadge(true), 200)
        }
      }

      setTimeout(() => {
        requestAnimationFrame(animate)
      }, 400)
    }
  }, [isInView, animationStarted, triggerParticleExplosion])

  const getParticlePosition = (progress: number) => {
    const startX = 80
    const startY = 100
    const endX = 320
    const endY = 100
    const controlX = (startX + endX) / 2
    const controlY = 35 // Higher arc for more dramatic effect

    const t = progress
    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY

    return { x, y }
  }

  const particlePos = getParticlePosition(particleProgress)

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-16">
      {/* Header Section */}
      <div className="text-center mb-16">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Shield size={12} />
          Confiance & Sécurité
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{
            fontFamily: 'Clash Display, sans-serif',
            color: '#0f172a',
            letterSpacing: '-0.02em'
          }}
        >
          Flux du{' '}
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Wallet Sécurisé</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
          className="text-slate-600 text-lg max-w-xl mx-auto"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Les acomptes de vos clients voyagent en toute sécurité jusqu'à votre coffre-fort numérique.
        </motion.p>
      </div>

      {/* Animation Container - Ultra Premium Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        className="relative rounded-3xl p-10 md:p-14 overflow-visible"
        style={{
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: `
            0 25px 80px rgba(15, 23, 42, 0.08), 
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset
          `
        }}
      >
        {/* SVG Layer - Premium Particle Animation with SVG Filters */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid meet"
          style={{ zIndex: 5 }}
        >
          {/* SVG Filters for Glow and Motion Blur */}
          <defs>
            {/* Motion blur filter */}
            <filter id="motionBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2,0" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -7" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            </filter>
            
            {/* Radiant glow filter */}
            <filter id="radiantGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gold particle gradient */}
            <radialGradient id="goldParticleGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
              <stop offset="30%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Trail gradient */}
            <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Elegant dotted path */}
          <motion.path
            d="M 80 100 Q 200 35 320 100"
            fill="none"
            stroke="url(#trailGrad)"
            strokeWidth="1"
            strokeDasharray="4 8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={isInView ? { pathLength: 1, opacity: 0.6 } : {}}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Particle with persistent trail (0.5s) */}
          <AnimatePresence>
            {animationStarted && particleProgress < 1 && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Motion blur trail using multiple circles */}
                {[...Array(8)].map((_, i) => {
                  const lag = (i + 1) * 0.015
                  const lagProgress = Math.max(0, particleProgress - lag)
                  const lagPos = getParticlePosition(lagProgress)
                  const size = 10 - i * 1.2
                  const opacity = (0.7 - i * 0.08) * (1 - particleProgress * 0.3)
                  
                  return (
                    <circle
                      key={`trail-${i}`}
                      cx={lagPos.x}
                      cy={lagPos.y}
                      r={Math.max(2, size)}
                      fill="url(#goldParticleGrad)"
                      opacity={opacity}
                      filter={i < 3 ? "url(#motionBlur)" : undefined}
                    />
                  )
                })}
                
                {/* Main radiant particle core */}
                <circle
                  cx={particlePos.x}
                  cy={particlePos.y}
                  r="12"
                  fill="url(#goldParticleGrad)"
                  filter="url(#radiantGlow)"
                />
                <circle
                  cx={particlePos.x}
                  cy={particlePos.y}
                  r="6"
                  fill="#fffbeb"
                />
                <circle
                  cx={particlePos.x}
                  cy={particlePos.y}
                  r="3"
                  fill="#ffffff"
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Golden explosion particles on impact */}
          <AnimatePresence>
            {particleBursts.map((burst) => {
              const endX = burst.x + Math.cos(burst.angle * Math.PI / 180) * 60
              const endY = burst.y + Math.sin(burst.angle * Math.PI / 180) * 60
              
              return (
                <motion.circle
                  key={burst.id}
                  r={4}
                  fill="#fbbf24"
                  filter="url(#radiantGlow)"
                  initial={{ cx: burst.x, cy: burst.y, opacity: 1, scale: 1 }}
                  animate={{ 
                    cx: endX, 
                    cy: endY, 
                    opacity: 0,
                    scale: 0.3
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1,
                    delay: burst.delay,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                />
              )
            })}
          </AnimatePresence>
        </svg>

        {/* Client Icon (Left) */}
        <div className="flex justify-between items-center relative z-10 px-8" style={{ height: '220px' }}>
          {/* Client Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%)',
                border: '1px solid rgba(226, 232, 240, 0.6)',
                boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <User size={40} className="text-slate-500" strokeWidth={1.5} />
              
              {/* Status dot with pulse */}
              <motion.div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '2px solid white'
                }}
                animate={{ 
                  boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 8px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle size={14} className="text-white" strokeWidth={3} />
              </motion.div>
            </div>
            <div className="text-center">
              <p
                className="text-sm font-semibold text-slate-800"
                style={{ fontFamily: 'Clash Display, sans-serif' }}
              >
                Client
              </p>
              <p className="text-xs text-slate-500" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Acompte payé
              </p>
            </div>
          </motion.div>

          {/* Vault Icon (Right) - With Magnetic Pulse */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="w-28 h-28 rounded-2xl flex items-center justify-center relative"
              animate={magneticIntensity > 0 ? {
                scale: [1, 1.02, 0.98, 1.01, 1],
              } : {}}
              transition={{ 
                duration: 0.15, 
                repeat: magneticIntensity > 0 ? Infinity : 0,
                repeatDelay: 0.1
              }}
              style={{
                background: showVaultGlow
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(251, 191, 36, 0.2) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%)',
                border: showVaultGlow
                  ? '1px solid rgba(245, 158, 11, 0.7)'
                  : '1px solid rgba(226, 232, 240, 0.6)',
                boxShadow: showVaultGlow
                  ? `0 12px 40px rgba(245, 158, 11, 0.3), 0 0 80px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3) inset`
                  : magneticIntensity > 0
                    ? `0 12px 40px rgba(245, 158, 11, ${0.1 + magneticIntensity * 0.3}), 0 0 ${40 + magneticIntensity * 40}px rgba(245, 158, 11, ${0.1 + magneticIntensity * 0.2})`
                    : '0 12px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)'
              }}
            >
              {/* Inner glow when activated */}
              {showVaultGlow && (
                <motion.div
                  className="absolute inset-2 rounded-xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.3) 0%, transparent 70%)'
                  }}
                />
              )}

              {/* Vault Icon */}
              <motion.div
                animate={showVaultGlow ? { 
                  rotate: [0, -5, 5, -3, 3, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <Wallet 
                  size={44} 
                  className={showVaultGlow ? 'text-amber-500' : 'text-slate-500'}
                  strokeWidth={1.5}
                />
              </motion.div>

              {/* Acompte Sécurisé Badge - Repositioned to be visible */}
              <AnimatePresence>
                {showBadge && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
                  >
                    <div
                      className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                      style={{
                        fontFamily: 'Clash Display, sans-serif',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                        color: 'white',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        boxShadow: '0 8px 30px rgba(245, 158, 11, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
                      }}
                    >
                      <Zap size={14} fill="currentColor" />
                      Acompte Sécurisé
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <div className="text-center">
              <p
                className="text-sm font-semibold text-slate-800"
                style={{ fontFamily: 'Clash Display, sans-serif' }}
              >
                Coffre-fort
              </p>
              <p className="text-xs text-slate-500" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                CalendaPro
              </p>
            </div>
          </motion.div>
        </div>

        {/* Background Decorations */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 25% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)'
          }}
        />
        <div
          className="absolute top-0 right-0 w-full h-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 75% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)'
          }}
        />
      </motion.div>

      {/* Trust Indicators - Using Lucide Icons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.8 }}
        className="flex justify-center gap-4 mt-8 flex-wrap"
      >
        {[
          { icon: Lock, text: 'Chiffrement SSL', color: '#64748b' },
          { icon: CheckCircle, text: 'Certifié PCI-DSS', color: '#10b981' },
          { icon: Shield, text: 'Stripe Connect', color: '#635bff' }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.9 + i * 0.1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(226, 232, 240, 0.6)',
              color: '#64748b',
              backdropFilter: 'blur(8px)'
            }}
          >
            <item.icon size={14} style={{ color: item.color }} />
            <span>{item.text}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
