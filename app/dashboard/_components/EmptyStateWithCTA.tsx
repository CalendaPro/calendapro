'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Users, Briefcase, Clock, Share2, Sparkles } from 'lucide-react'

type EmptyStateType = 'appointments' | 'clients' | 'services' | 'schedule' | 'share'

interface EmptyStateWithCTAProps {
  type: EmptyStateType
  title?: string
  description?: string
}

const configs: Record<EmptyStateType, {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  href: string
  color: string
  bgColor: string
}> = {
  appointments: {
    icon: <Calendar size={24} />,
    title: 'Aucun rendez-vous à venir',
    description: 'Commencez à recevoir des réservations en partageant votre lien de réservation.',
    cta: 'Créer un rendez-vous',
    href: '/dashboard/appointments',
    color: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.1)',
  },
  clients: {
    icon: <Users size={24} />,
    title: 'Aucun client pour l\'instant',
    description: 'Vos clients apparaîtront ici après leur première réservation.',
    cta: 'Ajouter un client',
    href: '/dashboard/clients',
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.1)',
  },
  services: {
    icon: <Briefcase size={24} />,
    title: 'Pas encore de services',
    description: 'Ajoutez vos prestations pour que les clients puissent réserver en ligne.',
    cta: 'Ajouter mon premier service',
    href: '/dashboard/site-customize',
    color: '#059669',
    bgColor: 'rgba(5,150,105,0.1)',
  },
  schedule: {
    icon: <Clock size={24} />,
    title: 'Horaires non configurés',
    description: 'Définissez vos disponibilités pour permettre les réservations en ligne.',
    cta: 'Configurer mes horaires',
    href: '/dashboard/site-customize',
    color: '#d97706',
    bgColor: 'rgba(217,119,6,0.1)',
  },
  share: {
    icon: <Share2 size={24} />,
    title: 'Partagez votre lien de réservation',
    description: 'Votre page est prête ! Partagez-la sur vos réseaux sociaux pour recevoir des clients.',
    cta: 'Obtenir mon lien',
    href: '/dashboard/widget',
    color: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.1)',
  },
}

export function EmptyStateWithCTA({ type, title: customTitle, description: customDesc }: EmptyStateWithCTAProps) {
  const config = configs[type]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '2rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: config.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          color: config.color,
        }}
      >
        {config.icon}
      </div>

      {/* Sparkle decoration for share type */}
      {type === 'share' && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Sparkles 
            size={16} 
            style={{ 
              position: 'absolute', 
              top: -8, 
              right: -20, 
              color: '#fbbf24',
              animation: 'sparkle 2s ease-in-out infinite',
            }} 
          />
          <style>{`
            @keyframes sparkle {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Clash Display', 'DM Sans', sans-serif",
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        {customTitle || config.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '0.85rem',
          color: '#64748b',
          lineHeight: 1.6,
          marginBottom: '1.25rem',
          maxWidth: 280,
          margin: '0 auto 1.25rem',
        }}
      >
        {customDesc || config.description}
      </p>

      {/* CTA Link */}
      <Link
        href={config.href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.65rem 1.25rem',
          background: config.color,
          color: 'white',
          borderRadius: 999,
          fontSize: '0.8rem',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          boxShadow: `0 4px 14px ${config.color}40`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 6px 20px ${config.color}60`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 4px 14px ${config.color}40`
        }}
      >
        {config.cta}
        <ArrowRight size={16} />
      </Link>
    </motion.div>
  )
}

// Simple empty state for inline use
export function SimpleEmptyState({ 
  message, 
  icon,
  action,
  href 
}: { 
  message: string
  icon?: React.ReactNode
  action?: string
  href?: string
}) {
  return (
    <div
      style={{
        padding: '1.5rem',
        textAlign: 'center',
        color: '#64748b',
      }}
    >
      {icon && (
        <div style={{ marginBottom: '0.75rem', opacity: 0.5 }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize: '0.85rem', marginBottom: action ? '0.75rem' : 0 }}>
        {message}
      </p>
      {action && href && (
        <Link
          href={href}
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#7c3aed',
            textDecoration: 'none',
          }}
        >
          {action} →
        </Link>
      )}
    </div>
  )
}
