'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import Link from 'next/link'

function safeRelativeRedirect(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return undefined
  return raw
}

function SignInWithRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const redirectUrl = safeRelativeRedirect(searchParams.get('redirect_url'))
      router.push(redirectUrl || '/dashboard')
    }
  }, [isLoaded, isSignedIn, router, searchParams])

  // Récupérer planId et redirect_url des query params (comme sign-up)
  const planId = searchParams.get('planId')
  const redirectUrl = safeRelativeRedirect(searchParams.get('redirect_url'))

  // Construire le redirect_url avec planId si fourni
  // Si planId est fourni, passer par /api/auth/sync pour gérer le paiement du plan
  // Sinon, ne PAS passer par sync (il redirige toujours vers onboarding),
  // le callback fera la bonne redirection selon l'état onboarding
  let callbackUrl: string
  if (planId) {
    let syncUrl = `/api/auth/sync?planId=${encodeURIComponent(planId)}`
    callbackUrl = `/api/auth/callback?role=pro&redirect_url=${encodeURIComponent(redirectUrl || syncUrl)}`
  } else {
    callbackUrl = redirectUrl
      ? `/api/auth/callback?role=pro&redirect_url=${encodeURIComponent(redirectUrl)}`
      : `/api/auth/callback?role=pro`
  }

  // Pendant le chargement ou si déjà connecté, ne pas afficher le formulaire
  if (!isLoaded || isSignedIn) {
    return <div className="text-stone-500 text-sm">Redirection...</div>
  }

  // Utiliser fallbackRedirectUrl au lieu de forceRedirectUrl pour Clerk v7
  // fallbackRedirectUrl est plus fiable pour les redirections post-auth
  // routing="path" nécessaire pour les catch-all routes [[...sign-in]]
  return (
    <SignIn 
      fallbackRedirectUrl={callbackUrl} 
      signUpUrl="/sign-up"
      routing="path"
      path="/sign-in"
    />
  )
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#F7F5F0' }}>
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-stone-500 text-sm">Chargement…</div>}>
          <SignInWithRedirect />
        </Suspense>
        <div className="mt-4 text-center">
          <p className="text-stone-600 text-sm">
            Pas encore de compte ?{' '}
            <Link href="/sign-up" className="text-violet-600 hover:text-violet-700 font-medium">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
