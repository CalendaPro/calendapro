'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function safeRelativeRedirect(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return undefined
  return raw
}

function SignInWithRedirect() {
  const searchParams = useSearchParams()

  // Si un redirect_url est fourni (ex: depuis /:username), on le passe au callback
  // pour que le client soit renvoyé vers la page du pro après connexion.
  const redirectUrl = safeRelativeRedirect(searchParams.get('redirect_url'))

  const callbackUrl = redirectUrl
    ? `/api/auth/callback?role=pro&redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/api/auth/callback?role=pro'

  return <SignIn forceRedirectUrl={callbackUrl} />
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div className="text-stone-500 text-sm">Chargement…</div>}>
        <SignInWithRedirect />
      </Suspense>
    </div>
  )
}
