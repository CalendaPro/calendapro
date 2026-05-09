'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Hash, Megaphone, MoreHorizontal } from 'lucide-react'
import type { OnboardingData } from '../page'

interface StepOneProps {
  source: string
  sourceOther: string
  onChange: (updates: Partial<OnboardingData>) => void
}

const options = [
  { value: 'google', label: 'Via Google', icon: Search },
  { value: 'recommendation', label: "Recommandation d'un ami", icon: Users },
  { value: 'social', label: 'Réseaux sociaux', icon: Hash },
  { value: 'advertising', label: 'Publicité', icon: Megaphone },
  { value: 'other', label: 'Autre', icon: MoreHorizontal },
]

export function StepOne({ source, sourceOther, onChange }: StepOneProps) {
  return (
    <div>
      <h1 className="step-title">Bienvenue sur CalendaPro</h1>
      <p className="step-subtitle">
        Trouvez et réservez les meilleurs professionnels près de chez vous
      </p>

      <div className="form-section">
        <p className="form-section-title">Comment avez-vous découvert CalendaPro ?</p>
        <div className="selection-grid single">
          {options.map((option, i) => {
            const Icon = option.icon
            const isSelected = source === option.value

            return (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.28, ease: 'easeOut' }}
                className={`selection-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onChange({ source: option.value, sourceOther: '' })}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                style={{ originX: 0.5 }}
              >
                <div className="selection-icon">
                  <Icon size={17} />
                </div>
                <span className="selection-label">{option.label}</span>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      className="selection-check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >

                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {source === 'other' && (
          <motion.div
            key="other"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="form-section"
          >
            <p className="form-section-title">Précisez comment vous nous avez découvert</p>
            <textarea
              value={sourceOther}
              onChange={(e) => onChange({ sourceOther: e.target.value })}
              placeholder="Expliquez brièvement..."
              rows={3}
              className="cb-input"
              style={{ resize: 'none' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
