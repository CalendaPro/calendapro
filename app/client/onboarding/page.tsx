'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import { StepHeader } from './_components/StepHeader'
import { StepOne } from './_components/StepOne'
import { StepTwo } from './_components/StepTwo'
import { StepThree } from './_components/StepThree'
import { StepFour } from './_components/StepFour'
import { SuccessStep } from './_components/SuccessStep'
import { Navigation } from './_components/Navigation'
import { getProSelection, clearProSelection, getSourceChannel, buildPostOnboardingRedirect } from '@/lib/tunnel-tracking'
import './styles.css'

export type OnboardingData = {
  // Étape 1
  source: string
  sourceOther: string
  // Étape 2
  interests: string[]
  // Étape 3
  city: string
  searchRadius: number
  includeOnline: boolean
  availableTimes: string[]
  // Étape 4
  phone: string
  avatarUrl: string | null
  smsReminders: boolean
}

const TOTAL_STEPS = 4

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

function ClientOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const glowRef = useRef<HTMLDivElement>(null)

  // Detect flow type from URL: 'direct' (express) vs 'explore' (full discovery)
  const flow = searchParams.get('flow') ?? 'explore'
  const proUsername = searchParams.get('pro') ?? ''
  const isDirectFlow = flow === 'direct' && proUsername

  // For direct flow, skip to last step or reduce steps
  const EFFECTIVE_TOTAL_STEPS = isDirectFlow ? 1 : TOTAL_STEPS

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    source: '',
    sourceOther: '',
    interests: [],
    city: '',
    searchRadius: 10,
    includeOnline: false,
    availableTimes: [],
    phone: '',
    avatarUrl: null,
    smsReminders: false,
  })

  // Redirection automatique vers le tableau de bord après onboarding terminé
  useEffect(() => {
    if (completed) {
      const timer = setTimeout(() => {
        if (isDirectFlow) {
          // Flow direct: redirige vers le pro ou le marketplace
          const targetPro = proUsername || getProSelection()?.proUsername
          if (targetPro) {
            clearProSelection()
            router.push(`/${targetPro}`)
          } else {
            router.push('/marketplace')
          }
        } else {
          // Flow explore: redirige vers le marketplace
          const redirectUrl = buildPostOnboardingRedirect()
          router.push(redirectUrl)
        }
      }, 1500) // 1.5s pour laisser voir le message de succès
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, isDirectFlow, router, proUsername])

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (glowRef.current) {
      glowRef.current.style.left = `${e.clientX}px`
      glowRef.current.style.top = `${e.clientY}px`
    }
  }, [])

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.source !== ''
      case 2:
        return data.interests.length > 0 && data.interests.length <= 5
      case 3:
        return data.city !== ''
      case 4:
        return true // Tout optionnel
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep(step + 1)
    } else {
      await handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep(step + 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)

    try {
      const response = await fetch('/api/client-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: data.source,
          sourceOther: data.sourceOther || null,
          interests: data.interests,
          city: data.city,
          radius: data.searchRadius,
          includeOnline: data.includeOnline,
          availableTimes: data.availableTimes,
          phone: data.phone || null,
          avatarUrl: data.avatarUrl,
          smsReminders: data.smsReminders,
          referrerName: null,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }

      setCompleted(true)
    } catch (err: any) {
      console.error('Error saving onboarding:', err)
      console.error('Error details:', err?.message, err?.code, err?.details)
      alert('Erreur lors de la sauvegarde: ' + (err?.message || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  const handleExplore = () => {
    // Smart redirect: check for pending pro selection first
    const redirectUrl = buildPostOnboardingRedirect()
    router.push(redirectUrl)
  }

  const handleBookPro = () => {
    // Direct flow: go to the pro's booking page
    const targetPro = proUsername || getProSelection()?.proUsername
    if (targetPro) {
      clearProSelection()
      router.push(`/${targetPro}`)
    } else {
      router.push('/marketplace')
    }
  }

  const handleCompleteProfile = () => {
    router.push('/client/profile')
  }

  if (completed) {
    return (
      <SuccessStep
        city={data.city}
        interests={data.interests}
        onExplore={handleExplore}
        onCompleteProfile={handleCompleteProfile}
        onBookPro={isDirectFlow ? handleBookPro : undefined}
        flow={isDirectFlow ? 'direct' : 'explore'}
        proName={proUsername}
      />
    )
  }

  return (
    <div className="client-onboarding" onMouseMove={handleMouseMove}>
      <div ref={glowRef} className="mouse-glow" style={{ left: '50vw', top: '50vh' }} />
      <div className="ambient-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      {/* Header */}
      <StepHeader currentStep={step} totalSteps={TOTAL_STEPS} />

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>

      {/* Main Content */}
      <main className="onboarding-main">
        <div className="onboarding-card">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="step-content"
            >
              {step === 1 && (
                <StepOne
                  source={data.source}
                  sourceOther={data.sourceOther}
                  onChange={updateData}
                />
              )}
              {step === 2 && (
                <StepTwo
                  interests={data.interests}
                  onChange={updateData}
                />
              )}
              {step === 3 && (
                <StepThree
                  city={data.city}
                  searchRadius={data.searchRadius}
                  includeOnline={data.includeOnline}
                  availableTimes={data.availableTimes}
                  onChange={updateData}
                />
              )}
              {step === 4 && (
                <StepFour
                  phone={data.phone}
                  avatarUrl={data.avatarUrl}
                  smsReminders={data.smsReminders}
                  onChange={updateData}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <Navigation
            step={step}
            totalSteps={TOTAL_STEPS}
            canProceed={canProceed()}
            loading={loading}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        </div>
      </main>
    </div>
  )
}

export default function ClientOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stone-600">Chargement...</p>
        </div>
      </div>
    }>
      <ClientOnboardingContent />
    </Suspense>
  )
}
