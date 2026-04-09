'use client'

import { Suspense } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import ErrorContent from './error-content'

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="animate-pulse">
          <BrandLogo />
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
