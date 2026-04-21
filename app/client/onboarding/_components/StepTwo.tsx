'use client'

import { motion } from 'framer-motion'
import { Scissors, Heart, Activity, Camera, Lightbulb, Stethoscope, Palette, Briefcase, Music, Wrench } from 'lucide-react'
import type { OnboardingData } from '../page'

interface StepTwoProps {
  interests: string[]
  onChange: (updates: Partial<OnboardingData>) => void
}

const categories = [
  { id: 'hair', label: 'Coiffure & Beauté', icon: Scissors },
  { id: 'wellness', label: 'Bien-être & Spa', icon: Heart },
  { id: 'fitness', label: 'Sport & Fitness', icon: Activity },
  { id: 'photo', label: 'Photographie', icon: Camera },
  { id: 'coaching', label: 'Coaching & Psy', icon: Lightbulb },
  { id: 'health', label: 'Santé & Médical', icon: Stethoscope },
  { id: 'art', label: 'Art & Créatif', icon: Palette },
  { id: 'business', label: 'Conseil & Business', icon: Briefcase },
  { id: 'entertainment', label: 'Divertissement', icon: Music },
  { id: 'repair', label: 'Réparation & Service', icon: Wrench },
]

const MAX_INTERESTS = 5

export function StepTwo({ interests, onChange }: StepTwoProps) {
  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      onChange({ interests: interests.filter(i => i !== id) })
    } else if (interests.length < MAX_INTERESTS) {
      onChange({ interests: [...interests, id] })
    }
  }

  return (
    <div>
      <h1 className="step-title">Quels services vous intéressent ?</h1>
      <p className="step-subtitle">Choisissez jusqu&apos;à 5 catégories — on personnalisera vos recommandations</p>

      <div className="selection-grid three">
        {categories.map((category, i) => {
          const Icon = category.icon
          const isSelected = interests.includes(category.id)
          const isDisabled = !isSelected && interests.length >= MAX_INTERESTS

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: isDisabled ? 0.4 : 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
              className={`selection-card ${isSelected ? 'selected' : ''}`}
              onClick={() => !isDisabled && toggleInterest(category.id)}
              whileHover={isDisabled ? {} : { scale: 1.04 }}
              whileTap={isDisabled ? {} : { scale: 0.96 }}
              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            >
              <div className="selection-icon">
                <Icon size={17} />
              </div>
              <span className="selection-label">{category.label}</span>
            </motion.div>
          )
        })}
      </div>

      <p className={`selection-counter ${interests.length >= MAX_INTERESTS ? 'warning' : ''}`}>
        {interests.length} / {MAX_INTERESTS} sélectionnés
      </p>
    </div>
  )
}
