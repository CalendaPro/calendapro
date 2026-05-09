'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

interface Appointment {
  id: string
  day: number
  hour: number
  client: string
  time: string
  color: 'violet' | 'pink' | 'indigo'
}

interface SlotProps {
  dayIndex: number
  hour: string
  hourIndex: number
  isInView: boolean
  onSlotClick: (day: number, hour: number) => void
  appointments: Appointment[]
  isMagicFilling: boolean
  magicTarget: { day: number; hour: number } | null
}

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const colorMap = {
  violet: { bg: 'rgba(124, 58, 237, 0.25)', border: 'rgba(124, 58, 237, 0.5)', text: '#7C3AED', glow: 'rgba(124, 58, 237, 0.4)' },
  pink: { bg: 'rgba(236, 72, 153, 0.25)', border: 'rgba(236, 72, 153, 0.5)', text: '#EC4899', glow: 'rgba(236, 72, 153, 0.4)' },
  indigo: { bg: 'rgba(79, 70, 229, 0.25)', border: 'rgba(79, 70, 229, 0.5)', text: '#4F46E5', glow: 'rgba(79, 70, 229, 0.4)' },
}

// Confetti component
function Confetti({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: 0,
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            scale: 1.5,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: ['#7C3AED', '#EC4899', '#4F46E5', '#10B981'][i % 4],
          }}
        />
      ))}
    </div>
  )
}

// Ghost cursor component
function GhostCursor({ target }: { target: { day: number; hour: number } | null }) {
  if (!target) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      style={{
        position: 'absolute',
        width: 20,
        height: 20,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="#1A1A46" strokeWidth="1.5">
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"/>
      </svg>
    </motion.div>
  )
}

function CalendarSlot({ dayIndex, hour, hourIndex, isInView, onSlotClick, appointments, isMagicFilling, magicTarget }: SlotProps) {
  const hourNum = parseInt(hour.split(':')[0])
  const appointment = appointments.find(a => a.day === dayIndex && a.hour === hourNum)
  const isMagicTarget = magicTarget?.day === dayIndex && magicTarget?.hour === hourNum
  const [showConfetti, setShowConfetti] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (!appointment) {
      onSlotClick(dayIndex, hourNum)
      setShowConfetti(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ delay: hourIndex * 0.02 + dayIndex * 0.01 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: '52px',
        background: appointment
          ? colorMap[appointment.color].bg
          : isHovered
            ? 'rgba(124, 58, 237, 0.08)'
            : 'rgba(255, 255, 255, 0.15)',
        border: `1px solid ${appointment ? colorMap[appointment.color].border : isHovered ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.25)'}`,
        borderRadius: 8,
        cursor: appointment ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.2s ease',
        boxShadow: appointment
          ? `0 2px 8px ${colorMap[appointment.color].glow}`
          : isHovered
            ? '0 0 0 2px rgba(124, 58, 237, 0.2)'
            : 'none',
      }}
    >
      {/* Ghost cursor highlight */}
      {isMagicTarget && !appointment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            inset: -4,
            border: '2px dashed rgba(124, 58, 237, 0.5)',
            borderRadius: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Confetti */}
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

      {/* Appointment badge */}
      <AnimatePresence>
        {appointment && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'absolute',
              inset: 2,
              background: colorMap[appointment.color].bg,
              border: `1px solid ${colorMap[appointment.color].border}`,
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 8px',
            }}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: colorMap[appointment.color].text,
              fontFamily: "'Satoshi', sans-serif",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {appointment.client}
            </span>
            <span style={{
              fontSize: 8,
              color: 'rgba(74, 74, 106, 0.7)',
              fontFamily: "'Satoshi', sans-serif",
            }}>
              {appointment.time}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ScrollCalendar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-100px' })
  // Get current week date in French
  const getCurrentWeekDate = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
    return now.toLocaleDateString('fr-FR', options)
  }

  const names = [
    'Marie L.', 'Karim D.', 'Sophie B.', 'Jean P.', 'Lucie M.', 'Ahmed K.', 'Emma R.', 'Thomas G.',
    'Laura M.', 'Nicolas P.', 'Camille D.', 'Alexandre L.', 'Julie B.', 'Maxime S.', 'Sarah T.',
    'Antoine F.', 'Claire V.', 'Hugo C.', 'Manon J.', 'Romain G.', 'Émilie R.', 'David M.',
    'Inès L.', 'Mathieu K.', 'Chloé P.', 'Sébastien B.', 'Anne-Sophie D.', 'François X.', 'Marion C.'
  ]

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', day: 0, hour: 9, client: 'Marie L.', time: '09:00', color: 'violet' },
    { id: '2', day: 1, hour: 10, client: 'Karim D.', time: '10:30', color: 'pink' },
    { id: '3', day: 2, hour: 14, client: 'Sophie B.', time: '14:00', color: 'indigo' },
    { id: '4', day: 0, hour: 11, client: 'Thomas G.', time: '11:00', color: 'pink' },
    { id: '5', day: 1, hour: 15, client: 'Laura M.', time: '15:00', color: 'indigo' },
    { id: '6', day: 3, hour: 16, client: 'Nicolas P.', time: '16:00', color: 'violet' },
  ])
  const [notification, setNotification] = useState<string | null>(null)
  const [isMagicFilling, setIsMagicFilling] = useState(false)
  const [magicTarget, setMagicTarget] = useState<{ day: number; hour: number } | null>(null)

  // Magic Fill animation
  useEffect(() => {
    if (!isInView) return

    const magicSlots = [
      { day: 3, hour: 11, client: 'Jean P.', time: '11:00', color: 'pink' as const },
      { day: 4, hour: 16, client: 'Lucie M.', time: '16:30', color: 'violet' as const },
    ]

    let index = 0
    const interval = setInterval(() => {
      if (index >= magicSlots.length) {
        clearInterval(interval)
        setIsMagicFilling(false)
        return
      }

      const slot = magicSlots[index]
      setIsMagicFilling(true)
      setMagicTarget({ day: slot.day, hour: slot.hour })

      setTimeout(() => {
        setAppointments(prev => [...prev, { ...slot, id: `magic-${index}` }])
        setNotification(`RDV Confirmé & SMS envoyé à ${slot.client}`)
        setMagicTarget(null)

        setTimeout(() => setNotification(null), 2500)
      }, 600)

      index++
    }, 2500)

    return () => clearInterval(interval)
  }, [isInView])

  const handleSlotClick = useCallback((day: number, hour: number) => {
    const availableNames = names.filter(n => !appointments.some(a => a.client === n && a.day === day))
    const name = availableNames.length > 0
      ? availableNames[Math.floor(Math.random() * availableNames.length)]
      : names[Math.floor(Math.random() * names.length)]
    const colors: ('violet' | 'pink' | 'indigo')[] = ['violet', 'pink', 'indigo']
    const color = colors[Math.floor(Math.random() * colors.length)]

    const newAppt: Appointment = {
      id: `user-${Date.now()}`,
      day,
      hour,
      client: name,
      time: `${hour}:00`,
      color,
    }

    setAppointments(prev => [...prev, newAppt])
    setNotification(`RDV Confirmé & SMS envoyé à ${name}`)
    setTimeout(() => setNotification(null), 2500)
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        {/* Badge - Premium unified style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.4rem 0.9rem',
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.12)',
            borderRadius: '100px',
            fontSize: '0.7rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#7C3AED',
            fontFamily: "'Cabinet Grotesk', sans-serif",
            marginBottom: '24px',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7C3AED' }} />
          Calendrier Pro
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: '#1A1A2E',
            marginBottom: 8,
          }}
        >
          Calendrier Dynamique
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontFamily: "'Satoshi', sans-serif",
            fontSize: '1.1rem',
            fontWeight: 400,
            color: '#6B7280',
            letterSpacing: '-0.01em',
          }}
        >
          L&apos;interface qui réfléchit à votre place.
        </motion.p>
      </div>

      {/* Notification - Fixed position relative to calendar */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 16, minHeight: 44 }}>
        <AnimatePresence mode="wait">
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: 100,
                fontFamily: "'Satoshi', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {notification}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glass Calendar Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8) inset',
          padding: 24,
          position: 'relative',
        }}
      >
        {/* Calendar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
            }} />
            <span style={{
              fontFamily: "'Satoshi', sans-serif",
              fontSize: 13,
              color: '#6B7280',
            }}>
              Semaine du {getCurrentWeekDate()}
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(124, 58, 237, 0.1)',
            borderRadius: 100,
            fontFamily: "'Satoshi', sans-serif",
            fontSize: 12,
            color: '#7C3AED',
          }}>
            <span>{appointments.length} RDV</span>
          </div>
        </div>

        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'Satoshi', sans-serif" }}>Heure</div>
          {days.map((day, i) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.05 }}
              style={{
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: i === 2 ? '#7C3AED' : '#4A4A6A',
                fontFamily: "'Satoshi', sans-serif",
                padding: '8px 0',
                background: i === 2 ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                borderRadius: 8,
              }}
            >
              {day}
            </motion.div>
          ))}
        </div>

        {/* Time Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hours.map((hour, hourIndex) => (
            <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 8, alignItems: 'center' }}>
              <div style={{
                fontSize: 11,
                color: '#9CA3AF',
                fontFamily: "'Satoshi', sans-serif",
              }}>
                {hour}
              </div>
              {days.map((_, dayIndex) => (
                <CalendarSlot
                  key={`${hourIndex}-${dayIndex}`}
                  dayIndex={dayIndex}
                  hour={hour}
                  hourIndex={hourIndex}
                  isInView={isInView}
                  onSlotClick={handleSlotClick}
                  appointments={appointments}
                  isMagicFilling={isMagicFilling}
                  magicTarget={magicTarget}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Ghost cursor indicator */}
        {isMagicFilling && magicTarget && (
          <GhostCursor target={magicTarget} />
        )}
      </motion.div>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
        style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 12,
          color: '#9CA3AF',
          fontFamily: "'Satoshi', sans-serif",
        }}
      >
        Cliquez sur un créneau vide pour réserver
      </motion.p>
    </div>
  )
}
