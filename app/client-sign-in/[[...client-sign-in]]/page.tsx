'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function safeRelativeRedirect(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return undefined
  return raw
}

function ClientSignInWithRedirect() {
  const searchParams = useSearchParams()

  // Si un redirect_url est fourni (ex: depuis /:username), on le passe au callback
  // pour que le client soit renvoyé vers la page du pro après connexion.
  const redirectUrl = safeRelativeRedirect(searchParams.get('redirect_url'))

  const callbackUrl = redirectUrl
    ? `/api/auth/callback?role=client&redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/api/auth/callback?role=client'

  return <SignIn forceRedirectUrl={callbackUrl} />
}

export default function ClientSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-stone-500 text-sm">Chargement…</div>}>
          <ClientSignInWithRedirect />
        </Suspense>
        <div className="mt-4 text-center">
          <p className="text-stone-600 text-sm">
            Pas encore de compte ?{' '}
            <Link href="/client-sign-up" className="text-violet-600 hover:text-violet-700 font-medium">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
