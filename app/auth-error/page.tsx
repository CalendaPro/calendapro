'use client'

import { Suspense } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import ErrorContent from './error-content'

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F7F5F0' }}>
        <div className="animate-pulse">
          <BrandLogo />
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
