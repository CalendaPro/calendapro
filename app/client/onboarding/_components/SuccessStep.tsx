'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Scissors, Heart, Activity, Camera, Lightbulb, Stethoscope, Palette, Briefcase, Music, Wrench } from 'lucide-react'

interface SuccessStepProps {
  city: string
  interests: string[]
  onExplore: () => void
  onCompleteProfile: () => void
  onBookPro?: () => void
  flow?: 'explore' | 'direct'
  proName?: string
}

const categoryIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  hair: Scissors,
  wellness: Heart,
  fitness: Activity,
  photo: Camera,
  coaching: Lightbulb,
  health: Stethoscope,
  art: Palette,
  business: Briefcase,
  entertainment: Music,
  repair: Wrench,
}

const categoryLabels: Record<string, string> = {
  hair: 'Coiffure',
  wellness: 'Bien-être',
  fitness: 'Fitness',
  photo: 'Photo',
  coaching: 'Coaching',
  health: 'Santé',
  art: 'Art',
  business: 'Business',
  entertainment: 'Divertissement',
  repair: 'Services',
}

export function SuccessStep({ city, interests, onExplore, onCompleteProfile, onBookPro, flow = 'explore', proName }: SuccessStepProps) {
  // Get top 3 categories or defaults
  const topCategories = interests.slice(0, 3).length > 0
    ? interests.slice(0, 3)
    : ['hair', 'wellness', 'fitness']

  useEffect(() => {
    // Confetti effect could be added here
  }, [])

  return (
    <div className="success-screen">
      <motion.div
        className="success-animation"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
      >
        <div className="success-circle">
          <CheckCircle size={48} color="white" strokeWidth={2.5} />
        </div>
      </motion.div>

      <motion.h1
        className="success-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        Vous êtes prêt !
      </motion.h1>

      <motion.p
        className="success-subtitle"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {flow === 'direct' && proName
          ? `Vous pouvez maintenant réserver avec ${proName}`
          : `Découvrez des centaines de professionnels vérifiés${city ? ` près de ${city}` : ''}`
        }
      </motion.p>

      <motion.div
        className="success-categories"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {topCategories.map((categoryId) => {
          const Icon = categoryIcons[categoryId] || Scissors
          const label = categoryLabels[categoryId] || categoryId

          return (
            <div key={categoryId} className="success-category">
              <Icon size={16} />
              <span>{label}</span>
            </div>
          )
        })}
      </motion.div>

      <motion.div
        className="success-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        {flow === 'direct' && onBookPro ? (
          <>
            <button className="success-btn-primary" onClick={onBookPro}>
              Réserver maintenant →
            </button>
            <button className="success-btn-secondary" onClick={onExplore}>
              Explorer la Marketplace
            </button>
          </>
        ) : (
          <>
            <button className="success-btn-primary" onClick={onExplore}>
              Explorer la Marketplace
            </button>
            <button className="success-btn-secondary" onClick={onCompleteProfile}>
              Compléter mon profil plus tard
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
