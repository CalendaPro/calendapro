'use client'

import Link from 'next/link'

interface StepHeaderProps {
  currentStep: number
  totalSteps: number
}

export function StepHeader({ currentStep, totalSteps }: StepHeaderProps) {
  return (
    <header className="onboarding-header">
      <Link href="/" className="header-logo">
        <div className="header-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="url(#logoGrad)" strokeWidth="1.8"/>
            <path d="M16 2v4M8 2v4M3 10h18" stroke="url(#logoGrad)" strokeWidth="1.8" strokeLinecap="round"/>
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed"/>
                <stop offset="100%" stopColor="#ec4899"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span>Calenda<span className="header-logo-pro">Pro</span></span>
      </Link>
      <span className="header-step-indicator">
        ÉTAPE {currentStep} / {totalSteps}
      </span>
    </header>
  )
}
