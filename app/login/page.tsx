'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/BrandLogo'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté et rediriger selon son rôle
    fetch('/api/auth/check')
      .then((res) => {
        if (res.redirected) {
          router.push(res.url)
        }
      })
      .catch(console.error)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <BrandLogo />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl"
      >
        <h1 className="text-3xl font-semibold text-center text-stone-900 mb-2">
          Choisissez votre profil
        </h1>
        <p className="text-center text-stone-600 mb-10">
          Je souhaite me connecter en tant que...
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div variants={cardVariants}>
            <Link
              href="/sign-in"
              className="group block h-full"
            >
              <div className="h-full bg-white rounded-2xl p-8 border border-stone-200 hover:border-violet-400 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-violet-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-violet-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-stone-900 mb-2">
                  Je suis un PRO
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Je propose mes services et je veux gérer mes rendez-vous
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Link
              href="/client-sign-in"
              className="group block h-full"
            >
              <div className="h-full bg-white rounded-2xl p-8 border border-stone-200 hover:border-rose-400 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-rose-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-200 transition-colors">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-stone-900 mb-2">
                  Je suis un CLIENT
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Je cherche un professionnel et je veux prendre rendez-vous
                </p>
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={cardVariants}
          className="mt-8 text-center"
        >
          <p className="text-stone-500 text-sm">
            Pas encore de compte ?{' '}
            <Link
              href="/login"
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Choisissez votre profil pour vous inscrire
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
