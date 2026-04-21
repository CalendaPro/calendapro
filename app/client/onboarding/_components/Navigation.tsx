'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface NavigationProps {
  step: number
  totalSteps: number
  canProceed: boolean
  loading: boolean
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function Navigation({
  step,
  totalSteps,
  canProceed,
  loading,
  onNext,
  onBack,
  onSkip,
}: NavigationProps) {
  const isLastStep = step === totalSteps
  const [nextHovered, setNextHovered] = useState(false)

  return (
    <div className="onboarding-navigation">
      <div className="nav-left">
        {step > 1 && (
          <button className="nav-btn nav-btn-back" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Retour</span>
          </button>
        )}
      </div>

      {step < totalSteps && (
        <button className="nav-btn nav-btn-skip" onClick={onSkip}>
          Passer
        </button>
      )}

      <button
        className="nav-btn nav-btn-next"
        onClick={onNext}
        disabled={!canProceed || loading}
        onMouseEnter={() => setNextHovered(true)}
        onMouseLeave={() => setNextHovered(false)}
      >
        {loading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-flex' }}
            >
              <Loader2 size={16} />
            </motion.span>
            <span>Enregistrement...</span>
          </>
        ) : (
          <>
            <span>{isLastStep ? 'Terminer' : 'Suivant'}</span>
            <motion.span
              animate={{ x: nextHovered && canProceed ? 4 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ display: 'inline-flex' }}
            >
              <ArrowRight size={16} />
            </motion.span>
          </>
        )}
      </button>
    </div>
  )
}
