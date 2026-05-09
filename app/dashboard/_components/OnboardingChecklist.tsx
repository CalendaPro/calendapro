'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Briefcase,
  Clock,
  Globe,
  CreditCard,
  Share2,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface OnboardingChecklistProps {
  userId: string
  onComplete?: () => void
}

interface ChecklistItem {
  id: string
  label: string
  icon: React.ReactNode
  action: string
  href: string
  isCompleted: boolean
  isOptional?: boolean
}

export function OnboardingChecklist({ userId, onComplete }: OnboardingChecklistProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [progress, setProgress] = useState(0)
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'photo',
      label: 'Photo de profil ajoutée',
      icon: <Camera size={18} />,
      action: 'Ajouter',
      href: '/dashboard/site-customize',
      isCompleted: false,
    },
    {
      id: 'service',
      label: 'Au moins 1 service créé',
      icon: <Briefcase size={18} />,
      action: 'Créer',
      href: '/dashboard/site-customize',
      isCompleted: false,
    },
    {
      id: 'schedule',
      label: 'Disponibilités configurées',
      icon: <Clock size={18} />,
      action: 'Configurer',
      href: '/dashboard/site-customize',
      isCompleted: false,
    },
    {
      id: 'public_page',
      label: 'Page publique vérifiée',
      icon: <Globe size={18} />,
      action: 'Vérifier',
      href: '/dashboard/widget',
      isCompleted: false,
    },
    {
      id: 'stripe',
      label: 'Stripe Connect configuré',
      icon: <CreditCard size={18} />,
      action: 'Connecter',
      href: '/dashboard/settings?section=integrations',
      isCompleted: false,
      isOptional: true,
    },
    {
      id: 'share',
      label: 'Lien partagé sur les réseaux',
      icon: <Share2 size={18} />,
      action: 'Partager',
      href: '/dashboard/widget',
      isCompleted: false,
      isOptional: true,
    },
  ])

  useEffect(() => {
    // Check if checklist was previously dismissed
    const dismissed = localStorage.getItem(`onboarding_checklist_${userId}`)
    if (dismissed === 'dismissed') {
      setIsDismissed(true)
    }

    // Fetch onboarding status from API
    fetchOnboardingStatus()
  }, [userId])

  useEffect(() => {
    const completedCount = items.filter(i => i.isCompleted).length
    const totalRequired = items.filter(i => !i.isOptional).length
    setProgress(Math.round((completedCount / items.length) * 100))

    // Auto-dismiss if all required items are completed
    const allRequiredCompleted = items
      .filter(i => !i.isOptional)
      .every(i => i.isCompleted)
    
    if (allRequiredCompleted && completedCount >= 4) {
      setTimeout(() => {
        handleDismiss()
        onComplete?.()
      }, 2000)
    }
  }, [items])

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status')
      if (!response.ok) return
      
      const data = await response.json()
      
      setItems(prev => prev.map(item => {
        switch (item.id) {
          case 'photo':
            return { ...item, isCompleted: data.hasPhoto }
          case 'service':
            return { ...item, isCompleted: data.hasServices }
          case 'schedule':
            return { ...item, isCompleted: data.hasSchedule }
          case 'public_page':
            return { ...item, isCompleted: data.isPublished }
          case 'stripe':
            return { ...item, isCompleted: data.hasStripeConnect }
          case 'share':
            return { ...item, isCompleted: data.hasShared }
          default:
            return item
        }
      }))
    } catch (error) {
      logger.error('Failed to fetch onboarding status:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(`onboarding_checklist_${userId}`, 'dismissed')
    setTimeout(() => setIsDismissed(true), 300)
  }

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded)
  }

  if (isDismissed) return null

  const completedCount = items.filter(i => i.isCompleted).length
  const optionalCount = items.filter(i => i.isOptional).length
  const requiredTotal = items.length - optionalCount

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05))',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 20,
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: isExpanded ? '1rem' : 0,
              cursor: 'pointer',
            }}
            onClick={handleExpandToggle}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Clash Display', 'DM Sans', sans-serif",
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    marginBottom: 2,
                  }}
                >
 {progress === 100 ? 'Setup terminé ! ' : 'Finalisez votre mise en service'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: 'rgba(0,0,0,0.06)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#7c3aed',
                      fontFamily: "'DM Sans', sans-serif",
                      minWidth: 40,
                      textAlign: 'right',
                    }}
                  >
                    {progress}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748b',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {completedCount}/{requiredTotal} obligatoires
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleExpandToggle()
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  transition: 'all 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ChevronRight size={18} style={{ transform: 'rotate(90deg)' }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDismiss()
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  transition: 'all 0.2s',
                }}
                title="Masquer la checklist"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Expandable items */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 10,
                    marginTop: '0.75rem',
                  }}
                >
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '0.85rem 1rem',
                          background: item.isCompleted
                            ? 'rgba(16,185,129,0.08)'
                            : 'rgba(255,255,255,0.7)',
                          border: `1.5px solid ${
                            item.isCompleted
                              ? 'rgba(16,185,129,0.2)'
                              : item.isOptional
                              ? 'rgba(148,163,184,0.15)'
                              : 'rgba(124,58,237,0.15)'
                          }`,
                          borderRadius: 12,
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: item.isCompleted
                              ? 'rgba(16,185,129,0.15)'
                              : item.isOptional
                              ? 'rgba(148,163,184,0.1)'
                              : 'rgba(124,58,237,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.isCompleted
                              ? '#059669'
                              : item.isOptional
                              ? '#64748b'
                              : '#7c3aed',
                            flexShrink: 0,
                          }}
                        >
                          {item.isCompleted ? <CheckCircle2 size={16} /> : item.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: item.isCompleted ? 500 : 600,
                              color: item.isCompleted ? '#059669' : '#0f172a',
                              textDecoration: item.isCompleted ? 'line-through' : 'none',
                              opacity: item.isCompleted ? 0.7 : 1,
                            }}
                          >
                            {item.label}
                          </div>
                          {item.isOptional && (
                            <div
                              style={{
                                fontSize: '0.65rem',
                                color: '#94a3b8',
                                marginTop: 2,
                              }}
                            >
                              Optionnel
                            </div>
                          )}
                        </div>
                        {!item.isCompleted && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#7c3aed',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.action} →
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {progress === 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 12,
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#059669',
                      }}
                    >
 Votre page est prête à recevoir des clients !
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
