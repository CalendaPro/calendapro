'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get('session_id')
  const username = searchParams.get('username')

  useEffect(() => {
    if (!sessionId || !username) {
      setStatus('error')
      setError('Paramètres manquants')
      return
    }

    // Vérifier le paiement et créer le rendez-vous
    const verifyAndCreate = async () => {
      try {
        const res = await fetch('/api/stripe/verify-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, username }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setStatus('success')
        } else {
          setStatus('error')
          setError(data.error || 'Erreur lors de la création du rendez-vous')
        }
      } catch (err) {
        setStatus('error')
        setError('Erreur de connexion')
      }
    }

    verifyAndCreate()
  }, [sessionId, username])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stone-600">Confirmation de votre réservation...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Erreur</h1>
          <p className="text-stone-600 mb-6">{error || 'Une erreur est survenue'}</p>
          <Link 
            href={`/client/${username || ''}`}
            className="inline-block px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700"
          >
            Retour au profil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-stone-900 mb-2">Réservation confirmée !</h1>
        <p className="text-stone-600 mb-2">Votre paiement a été accepté.</p>
        <p className="text-stone-500 text-sm mb-6">
          Un email de confirmation vous a été envoyé.
        </p>
        <Link 
          href={`/client/${username || ''}`}
          className="inline-block px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700"
        >
          Retour au profil
        </Link>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stone-600">Chargement...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
