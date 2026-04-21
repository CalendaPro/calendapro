'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { 
  Bell, 
  Calendar, 
  MessageSquare, 
  Wallet, 
  Smartphone, 
  Zap, 
  Signal,
  User,
  TrendingUp,
  Clock,
  Wifi
} from 'lucide-react'

interface Notification {
  id: number
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  time: string
  color: string
}

const notifications: Notification[] = [
  {
    id: 1,
    icon: Calendar,
    iconBg: 'rgba(124, 58, 237, 0.2)',
    iconColor: '#a78bfa',
    title: 'Nouveau RDV confirmé',
    subtitle: 'Marketplace · Coupe & Style',
    time: 'Maintenant',
    color: '#7c3aed'
  },
  {
    id: 2,
    icon: MessageSquare,
    iconBg: 'rgba(59, 130, 246, 0.2)',
    iconColor: '#60a5fa',
    title: 'SMS de rappel envoyé',
    subtitle: 'À Jean D. pour demain 14h',
    time: 'Il y a 2s',
    color: '#3b82f6'
  },
  {
    id: 3,
    icon: Wallet,
    iconBg: 'rgba(16, 185, 129, 0.2)',
    iconColor: '#34d399',
    title: '+45€ crédités',
    subtitle: 'Sur votre Wallet CalendaPro',
    time: 'Il y a 4s',
    color: '#10b981'
  }
]

// Spring config for 3D tilt
const TILT_SPRING = { stiffness: 150, damping: 20 }

export default function SmartNotifications() {
  const containerRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  const [visibleNotifications, setVisibleNotifications] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shimmerTrigger, setShimmerTrigger] = useState(0)

  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring-based rotation (max 3 degrees)
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [3, -3]), TILT_SPRING)
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-3, 3]), TILT_SPRING)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!phoneRef.current) return
    const rect = phoneRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  useEffect(() => {
    if (isInView && currentIndex < notifications.length) {
      const timer = setTimeout(() => {
        setVisibleNotifications(prev => [...prev, notifications[currentIndex].id])
        setCurrentIndex(prev => prev + 1)
        // Trigger shimmer on each new notification
        setShimmerTrigger(prev => prev + 1)
      }, currentIndex === 0 ? 600 : 2200)

      return () => clearTimeout(timer)
    }
  }, [isInView, currentIndex])

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl mx-auto py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="text-center md:text-left">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Bell size={12} />
            Preuve Sociale
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'Clash Display, sans-serif',
              color: '#1A1A1A',
              letterSpacing: '-0.02em'
            }}
          >
            Smart{' '}
            <span style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Notifications</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
            className="text-lg mb-8"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#78716c' }}
          >
            Restez informé en temps réel. Chaque action importante vous parvient instantanément sur votre téléphone.
          </motion.p>

          {/* Feature List - Using Lucide Icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
            className="space-y-4"
          >
            {[
              { icon: Bell, text: 'Notifications push instantanées', color: '#f472b6' },
              { icon: Smartphone, text: 'Disponible sur iOS & Android', color: '#a78bfa' },
              { icon: Zap, text: 'Zero delay, temps réel', color: '#fbbf24' }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.color}20` }}
                >
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <span
                  style={{ fontFamily: 'DM Sans, sans-serif', color: '#4b5563' }}
                >
                  {item.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right - 3D Phone Mockup with Tilt Effect */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
          className="relative flex justify-center items-center min-h-[600px]"
          style={{ perspective: '1000px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Phone Frame with 3D Tilt */}
          <motion.div
            ref={phoneRef}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d'
            }}
            className="relative w-80 rounded-[40px] p-3"
          >
            {/* Phone outer frame */}
            <div
              className="absolute inset-0 rounded-[40px]"
              style={{
                background: 'linear-gradient(145deg, #334155 0%, #1e293b 50%, #0f172a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `
                  0 50px 100px rgba(0, 0, 0, 0.5),
                  0 30px 60px rgba(124, 58, 237, 0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.15),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `,
                transform: 'translateZ(-10px)'
              }}
            />

            {/* Notch */}
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full z-30"
              style={{
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            />

            {/* Screen with Shimmer - Increased height for visibility */}
            <div
              className="relative rounded-[32px] overflow-hidden"
              style={{
                height: '520px',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Screen Shimmer Effect */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={shimmerTrigger}
                  className="absolute inset-0 z-20 pointer-events-none"
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: '200%', opacity: [0, 0.4, 0] }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
                    width: '50%'
                  }}
                />
              </AnimatePresence>

              {/* Glass overlay for depth */}
              <div 
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.03) 0%, transparent 30%, transparent 70%, rgba(236, 72, 153, 0.02) 100%)'
                }}
              />

              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-6 pt-2 z-20">
                <span className="text-xs font-semibold text-white" style={{ fontFamily: 'SF Pro Display, sans-serif' }}>
                  14:30
                </span>
                <div className="flex items-center gap-1.5">
                  <Signal size={14} className="text-white" />
                  <Wifi size={14} className="text-white" />
                  {/* iPhone-style Battery - 70%, rounded corners, smaller */}
                  <div 
                    className="flex items-center"
                    style={{ height: '11px', width: '20px' }}
                  >
                    <div 
                      className="relative flex items-center"
                      style={{ 
                        width: '18px', 
                        height: '9px',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '2.5px',
                        padding: '1px'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '70%',
                          height: '100%',
                          background: 'white',
                          borderRadius: '1px'
                        }}
                      />
                    </div>
                    {/* Battery tip */}
                    <div 
                      style={{
                        width: '1.5px',
                        height: '3.5px',
                        background: 'rgba(255,255,255,0.4)',
                        borderRadius: '0 0.5px 0.5px 0',
                        marginLeft: '0.5px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Screen Content */}
              <div className="absolute inset-0 pt-14 px-4">
                {/* App Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>Bonjour,</p>
                    <p
                      className="text-lg font-bold text-white"
                      style={{ fontFamily: 'Clash Display, sans-serif' }}
                    >
                      Karim
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                      boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
                    }}
                  >
                    <span className="text-sm font-bold text-white">KD</span>
                  </motion.div>
                </div>

                {/* Stats Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="rounded-2xl p-4 mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(124, 58, 237, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        Aujourd'hui
                      </p>
                      <div className="flex items-baseline gap-1">
                        <p
                          className="text-2xl font-bold text-white"
                          style={{ fontFamily: 'Clash Display, sans-serif' }}
                        >
                          4
                        </p>
                        <span className="text-sm text-slate-400">RDV</span>
                      </div>
                    </div>
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                    >
                      <TrendingUp size={20} className="text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-xs text-emerald-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      +2 vs hier
                    </p>
                  </div>
                </motion.div>

                {/* Notifications Container */}
                <div className="space-y-3">
                  <p
                    className="text-xs text-slate-500 uppercase tracking-wider mb-2"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Notifications
                  </p>

                  <AnimatePresence>
                    {visibleNotifications.map((notifId, index) => {
                      const notif = notifications.find(n => n.id === notifId)!
                      const IconComponent = notif.icon
                      
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: -30, scale: 0.9, rotateX: -15 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            rotateX: 0
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                            delay: index * 0.05
                          }}
                          whileHover={{ 
                            scale: 1.03,
                            y: -3,
                            boxShadow: `0 12px 35px ${notif.color}40, 0 6px 20px rgba(0, 0, 0, 0.4)`
                          }}
                          className="rounded-xl p-3 flex items-center gap-3 cursor-pointer"
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          {/* Icon with enhanced styling */}
                          <motion.div
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: index * 0.1 + 0.1 }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ 
                              background: notif.iconBg,
                              boxShadow: `0 4px 15px ${notif.color}20`
                            }}
                          >
                            <IconComponent size={18} className="transition-colors" style={{ color: notif.iconColor }} />
                          </motion.div>
                          
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold text-white truncate"
                              style={{ fontFamily: 'Clash Display, sans-serif' }}
                            >
                              {notif.title}
                            </p>
                            <p
                              className="text-xs text-slate-400 truncate"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                            >
                              {notif.subtitle}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <Clock size={10} className="text-slate-500" />
                            <span
                              className="text-[10px] text-slate-500 whitespace-nowrap"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                            >
                              {notif.time}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {/* Empty placeholders with subtle animation */}
                  <AnimatePresence>
                    {[...Array(3 - visibleNotifications.length)].map((_, i) => (
                      <motion.div
                        key={`empty-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl p-3 h-[60px]"
                        style={{
                          background: 'rgba(30, 41, 59, 0.3)',
                          border: '1px dashed rgba(255, 255, 255, 0.05)'
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Ambient Glow on Screen */}
              <div
                className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(to top, rgba(124, 58, 237, 0.15) 0%, transparent 100%)'
                }}
              />
            </div>

            {/* Side Buttons */}
            <div
              className="absolute right-[-3px] top-24 w-[4px] h-14 rounded-l-sm"
              style={{ 
                background: 'linear-gradient(180deg, #475569 0%, #334155 100%)',
                boxShadow: '-1px 0 2px rgba(0, 0, 0, 0.3)'
              }}
            />
            <div
              className="absolute right-[-3px] top-44 w-[4px] h-10 rounded-l-sm"
              style={{ 
                background: 'linear-gradient(180deg, #475569 0%, #334155 100%)',
                boxShadow: '-1px 0 2px rgba(0, 0, 0, 0.3)'
              }}
            />
            <div
              className="absolute left-[-3px] top-32 w-[4px] h-20 rounded-r-sm"
              style={{ 
                background: 'linear-gradient(180deg, #475569 0%, #334155 100%)',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.3)'
              }}
            />
          </motion.div>

          {/* Enhanced Glow Effect Behind Phone - More visible */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(236, 72, 153, 0.25) 25%, rgba(124, 58, 237, 0.1) 50%, transparent 70%)',
              filter: 'blur(60px)',
              transform: 'translate(-50%, -50%) translateZ(-50px)'
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
