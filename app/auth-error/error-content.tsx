'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/BrandLogo'

export default function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const currentRole = searchParams.get('current_role')
  const expectedRole = searchParams.get('expected_role')

  const getErrorMessage = () => {
    if (error === 'role_mismatch') {
      if (currentRole === 'pro' && expectedRole === 'client') {
        return {
          title: 'Vous avez déjà un compte PRO',
          message: 'Cet email est associé à un compte professionnel. Voulez-vous vous connecter en tant que PRO ?',
          cta: 'Se connecter en tant que PRO',
          ctaLink: '/sign-in',
          secondary: 'Créer un compte CLIENT avec un autre email',
          secondaryLink: '/client-sign-up',
        }
      }
      if (currentRole === 'client' && expectedRole === 'pro') {
        return {
          title: 'Vous avez déjà un compte CLIENT',
          message: 'Cet email est associé à un compte client. Voulez-vous vous connecter en tant que CLIENT ?',
          cta: 'Se connecter en tant que CLIENT',
          ctaLink: '/client-sign-in',
          secondary: 'Créer un compte PRO avec un autre email',
          secondaryLink: '/sign-up',
        }
      }
    }
    return {
      title: 'Erreur d\'authentification',
      message: 'Une erreur est survenue lors de votre connexion.',
      cta: 'Retour à la page de connexion',
      ctaLink: '/login',
      secondary: 'Retour à l\'accueil',
      secondaryLink: '/',
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <BrandLogo />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-lg">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <svg
              className="w-8 h-8 text-rose-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-center text-stone-900 mb-3">
            {errorInfo.title}
          </h1>
          <p className="text-center text-stone-600 mb-8 leading-relaxed">
            {errorInfo.message}
          </p>

          <div className="space-y-3">
            <Link
              href={errorInfo.ctaLink}
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              {errorInfo.cta}
            </Link>
            <Link
              href={errorInfo.secondaryLink}
              className="block w-full text-center py-3 px-4 bg-stone-100 text-stone-700 font-medium rounded-xl hover:bg-stone-200 transition-all duration-200"
            >
              {errorInfo.secondary}
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <Link
              href="/login"
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              Choisir un autre profil
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
