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
  
  // Si un redirect_url est fourni, on le passe au callback
  // Sinon, on laisse le callback décider selon le rôle (PRO/CLIENT)
  const redirectUrl = safeRelativeRedirect(searchParams.get('redirect_url'))
  
  const callbackUrl = redirectUrl
    ? `/api/auth/callback?role=pro&redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/api/auth/callback?role=pro'

  return <SignUp forceRedirectUrl={callbackUrl} />
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
