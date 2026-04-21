'use client'

import React, { useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import { Calendar, Clock, User, Check } from 'lucide-react'

interface AppointmentBlock {
  id: number
  day: number
  color: 'indigo' | 'violet' | 'pink'
  client: string
  time: string
  duration: number
  isNew?: boolean
}

const appointments: AppointmentBlock[] = [
  { id: 1, day: 0, color: 'indigo', client: 'Marie L.', time: '09:00', duration: 2 },
  { id: 2, day: 1, color: 'violet', client: 'Karim D.', time: '10:30', duration: 1 },
  { id: 3, day: 2, color: 'indigo', client: 'Sophie B.', time: '14:00', duration: 2 },
  { id: 4, day: 3, color: 'pink', client: 'Jean P.', time: '11:00', duration: 1 },
  { id: 5, day: 4, color: 'violet', client: 'Lucie M.', time: '16:30', duration: 1 },
  { id: 6, day: 1, color: 'indigo', client: 'Ahmed K.', time: '15:00', duration: 2 },
]

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const colorMap = {
  indigo: {
    bg: 'rgba(79, 70, 229, 0.2)',
    border: 'rgba(79, 70, 229, 0.4)',
    borderActive: 'rgba(79, 70, 229, 0.8)',
    glow: 'rgba(79, 70, 229, 0.5)',
    text: '#818cf8',
    shockwave: 'rgba(79, 70, 229, 0.6)'
  },
  violet: {
    bg: 'rgba(124, 58, 237, 0.2)',
    border: 'rgba(124, 58, 237, 0.4)',
    borderActive: 'rgba(124, 58, 237, 0.8)',
    glow: 'rgba(124, 58, 237, 0.5)',
    text: '#a78bfa',
    shockwave: 'rgba(124, 58, 237, 0.6)'
  },
  pink: {
    bg: 'rgba(236, 72, 153, 0.2)',
    border: 'rgba(236, 72, 153, 0.4)',
    borderActive: 'rgba(236, 72, 153, 0.8)',
    glow: 'rgba(236, 72, 153, 0.5)',
    text: '#f472b6',
    shockwave: 'rgba(236, 72, 153, 0.6)'
  }
}

// Ultra-premium Spring configuration
const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 1 }

interface ShockwaveEffectProps {
  color: string
  onComplete: () => void
}

function ShockwaveEffect({ color, onComplete }: ShockwaveEffectProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Inner shockwave */}
      <motion.div
        className="absolute inset-0 rounded-md"
        initial={{ scale: 0.8, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          border: `2px solid ${color}`,
          boxShadow: `0 0 20px ${color}, inset 0 0 20px ${color}`
        }}
      />
      {/* Outer shockwave */}
      <motion.div
        className="absolute inset-[-4px] rounded-lg"
        initial={{ scale: 0.6, opacity: 1 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        style={{
          border: `1px solid ${color}`,
          boxShadow: `0 0 30px ${color}`
        }}
      />
    </motion.div>
  )
}

export default function ScrollCalendar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  const [visibleCount, setVisibleCount] = useState(0)
  const [activeAppointments, setActiveAppointments] = useState<number[]>([])
  const [shockwaveId, setShockwaveId] = useState<number | null>(null)

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setVisibleCount(prev => {
            if (prev >= appointments.length) {
              clearInterval(interval)
              return prev
            }
            // Trigger shockwave when appointment appears
            setShockwaveId(appointments[prev].id)
            setActiveAppointments(prevActive => [...prevActive, appointments[prev].id])
            return prev + 1
          })
        }, 600)
        return () => clearInterval(interval)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isInView])

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-12">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={SPRING_CONFIG}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            background: 'rgba(124, 58, 237, 0.15)',
            color: '#a78bfa',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Calendar size={12} />
          Module Pro
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING_CONFIG, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{
            fontFamily: 'Clash Display, sans-serif',
            color: 'white',
            letterSpacing: '-0.02em'
          }}
        >
          Calendrier{' '}
          <span style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Dynamique</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING_CONFIG, delay: 0.2 }}
          className="text-slate-400 text-lg max-w-xl mx-auto"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Vos créneaux se remplissent automatiquement. Visualisez votre semaine en un coup d'œil.
        </motion.p>
      </div>

      {/* Calendar Container - Ultra Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ ...SPRING_CONFIG, delay: 0.3 }}
        className="relative rounded-3xl p-6 md:p-8 overflow-visible"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.6) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          boxShadow: `
            0 25px 80px rgba(124, 58, 237, 0.2), 
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 0 0 1px rgba(255, 255, 255, 0.02)
          `
        }}
      >
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.03) 0%, transparent 30%, transparent 70%, rgba(236, 72, 153, 0.02) 100%)'
          }}
        />

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-3 h-3 rounded-full bg-emerald-500"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(16, 185, 129, 0.5)',
                  '0 0 20px rgba(16, 185, 129, 0.8)',
                  '0 0 10px rgba(16, 185, 129, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-slate-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Semaine du 14 avril 2026
            </span>
          </div>
          <div className="flex gap-2">
            <div 
              className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{
                background: 'rgba(79, 70, 229, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(79, 70, 229, 0.3)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Clock size={12} />
              6 RDV
            </div>
            <div 
              className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Check size={12} />
              Confirmés
            </div>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-6 gap-2 mb-3 relative z-10">
          <div 
            className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center"
            style={{ fontFamily: 'DM Sans, sans-serif', height: '40px' }}
          >
            Heure
          </div>
          {days.map((day, i) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING_CONFIG, delay: 0.4 + i * 0.05 }}
              className="text-center text-sm font-semibold py-2 rounded-lg"
              style={{
                fontFamily: 'Clash Display, sans-serif',
                color: i === 2 ? '#a78bfa' : '#94a3b8',
                background: i === 2 ? 'rgba(124, 58, 237, 0.2)' : 'rgba(30, 41, 59, 0.3)',
                border: i === 2 ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {day}
            </motion.div>
          ))}
        </div>

        {/* Time Grid - Increased padding and spacing for visibility */}
        <div className="space-y-3 relative z-10 pb-4">
          {hours.map((hour, hourIndex) => (
            <div key={hour} className="grid grid-cols-6 gap-2 relative">
              {/* Time Label */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ ...SPRING_CONFIG, delay: 0.5 + hourIndex * 0.03 }}
                className="text-xs font-medium text-slate-500 flex items-center"
                style={{ fontFamily: 'DM Sans, sans-serif', height: '52px' }}
              >
                {hour}
              </motion.div>

              {/* Day Cells */}
              {days.map((_, dayIndex) => {
                const appointment = appointments.find(
                  (apt, aptIndex) =>
                    aptIndex < visibleCount &&
                    apt.day === dayIndex &&
                    Math.floor(parseInt(apt.time.split(':')[0])) === parseInt(hour.split(':')[0])
                )

                const isJustAppeared = appointment && shockwaveId === appointment.id

                return (
                  <div
                    key={dayIndex}
                    className="rounded-lg relative overflow-visible"
                    style={{
                      height: '52px',
                      background: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <AnimatePresence>
                      {isJustAppeared && (
                        <ShockwaveEffect 
                          color={colorMap[appointment.color].shockwave}
                          onComplete={() => setShockwaveId(null)}
                        />
                      )}
                    </AnimatePresence>
                    
                    {appointment && (
                      <motion.div
                        initial={{ x: -80, opacity: 0, scale: 0.9 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                          delay: appointments.indexOf(appointment) * 0.05
                        }}
                        className="absolute inset-1 rounded-md flex flex-col justify-center px-2 cursor-pointer overflow-hidden"
                        style={{
                          background: colorMap[appointment.color].bg,
                          border: `1px solid ${colorMap[appointment.color].border}`,
                          boxShadow: `0 4px 15px ${colorMap[appointment.color].glow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                          minHeight: appointment.duration > 1 ? `${appointment.duration * 52 - 8}px` : 'calc(100% - 8px)',
                          height: 'auto',
                          zIndex: 20,
                          backdropFilter: 'blur(8px)'
                        }}
                        whileHover={{
                          scale: 1.03,
                          boxShadow: `0 8px 30px ${colorMap[appointment.color].glow}, 0 0 0 1px ${colorMap[appointment.color].borderActive}`,
                          borderColor: colorMap[appointment.color].borderActive
                        }}
                      >
                        {/* Glassmorphism shine effect */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)'
                          }}
                        />
                        <div className="flex items-center gap-1.5 relative z-10">
                          <User size={10} style={{ color: colorMap[appointment.color].text }} />
                          <span
                            className="text-xs font-semibold truncate"
                            style={{
                              fontFamily: 'Clash Display, sans-serif',
                              color: colorMap[appointment.color].text
                            }}
                          >
                            {appointment.client}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 relative z-10 mt-0.5">
                          <Clock size={9} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {appointment.time}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Ambient Glow */}
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
      </motion.div>
    </div>
  )
}
