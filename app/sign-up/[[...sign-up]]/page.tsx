'use client'

import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function safeRelativeRedirect(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return undefined
  return raw
}

function SignUpWithRedirect() {
  const searchParams = useSearchParams()
  
  // Récupérer planId et redirect_url des query params
  const planId = searchParams.get('planId')
  const redirectUrl = safeRelativeRedirect(searchParams.get('redirect_url'))
  
  // Construire le callback URL avec planId s'il existe
  let finalRedirectUrl = redirectUrl || '/api/auth/sync'
  
  // Si on a un planId, l'ajouter au redirect_url (qui va vers /api/auth/sync)
  if (planId) {
    const separator = finalRedirectUrl.includes('?') ? '&' : '?'
    finalRedirectUrl = `${finalRedirectUrl}${separator}planId=${encodeURIComponent(planId)}`
  }
  
  const callbackUrl = `/api/auth/callback?role=pro&redirect_url=${encodeURIComponent(finalRedirectUrl)}`

  return (
    <SignUp 
      fallbackRedirectUrl={callbackUrl}
      unsafeMetadata={{ role: 'pro', planId: planId || 'starter' }}
      routing="path"
      path="/sign-up"
    />
  )
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div className="text-stone-500 text-sm">Chargement…</div>}>
        <SignUpWithRedirect />
      </Suspense>
    </div>
  )
}
