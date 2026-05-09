'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie_consent'

type ConsentType = 'all' | 'essential' | null

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [consent, setConsent] = useState<ConsentType>(null)

  useEffect(() => {
    // Vérifier le consentement existant
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setIsVisible(true)
    } else {
      setConsent(stored as ConsentType)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(STORAGE_KEY, 'all')
    setConsent('all')
    setIsVisible(false)
    setShowPreferences(false)
    // Activer Google Analytics si présent
    if (typeof window !== 'undefined' && (window as any).gtag) {  // reason: gtag global injected by Google script, no TS types
      (window as any).gtag('consent', 'update', {  // reason: gtag global injected by Google script, no TS types
        analytics_storage: 'granted',
      })
    }
  }

  const handleRefuse = () => {
    localStorage.setItem(STORAGE_KEY, 'essential')
    setConsent('essential')
    setIsVisible(false)
    setShowPreferences(false)
    // Désactiver Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {  // reason: gtag global injected by Google script, no TS types
      (window as any).gtag('consent', 'update', {  // reason: gtag global injected by Google script, no TS types
        analytics_storage: 'denied',
      })
    }
  }

  const handleOpenPreferences = () => {
    setShowPreferences(true)
  }

  const handleClosePreferences = () => {
    setShowPreferences(false)
  }

  // Mode préférences détaillées
  if (showPreferences) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      >
        <div 
          className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Clash Display, sans-serif' }}>
              Paramètres des cookies
            </h3>
            <button
              onClick={handleClosePreferences}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Personnalisez vos préférences en matière de cookies. Les cookies essentiels sont toujours actifs.
          </p>

          <div className="space-y-4 mb-6">
            {/* Cookies essentiels - toujours actifs */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="w-4 h-4 text-violet-600 rounded border-gray-300 cursor-not-allowed opacity-60"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">Cookies essentiels</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Nécessaires au fonctionnement du site (authentification, paiement, sécurité).
                </p>
              </div>
              <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
                Obligatoire
              </span>
            </div>

            {/* Cookies analytiques */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-violet-200 transition-colors">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="analytics"
                  className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="analytics" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Cookies analytiques
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Nous aident à comprendre comment vous utilisez le site (Google Analytics).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              }}
            >
              Enregistrer et tout accepter
            </button>
            <button
              onClick={handleRefuse}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Refuser les analytiques
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link 
              href="/legal/politique-cookies" 
              className="text-xs text-violet-600 hover:text-violet-700 transition-colors"
            >
              En savoir plus sur notre politique de cookies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Mode bannière standard
  if (!isVisible) return null

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[9998] p-4 sm:p-6"
      style={{
        background: 'linear-gradient(to top, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Clash Display, sans-serif' }}>
 Nous utilisons des cookies
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ce site utilise des cookies essentiels pour son fonctionnement et des cookies analytiques 
              pour comprendre son utilisation. Vous pouvez gérer vos préférences ou consulter notre{' '}
              <Link 
                href="/legal/politique-cookies" 
                className="text-violet-600 hover:text-violet-700 underline"
              >
                politique de cookies
              </Link>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              }}
            >
              Accepter tout
            </button>
            <button
              onClick={handleRefuse}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Refuser
            </button>
            <button
              onClick={handleOpenPreferences}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600 transition-colors"
            >
              Personnaliser
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
