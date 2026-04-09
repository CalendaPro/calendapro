'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClientDashboardPage() {
  const { user } = useUser()
  const router = useRouter()

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Bienvenue{user?.firstName ? `, ${user.firstName}` : ''} !
        </h1>
        <p className="text-stone-600">
          Trouvez le professionnel idéal pour vos besoins
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/client/marketplace"
          className="bg-gradient-to-br from-violet-600 to-rose-500 text-white p-6 rounded-2xl hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Chercher un professionnel</h2>
              <p className="text-white/80">Trouvez le pro idéal pour vous</p>
            </div>
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </Link>

        <Link
          href="/client/profile"
          className="bg-white border border-stone-200 p-6 rounded-2xl hover:border-violet-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-900 mb-2">Mon profil</h2>
              <p className="text-stone-600">Gérez vos préférences</p>
            </div>
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
        </Link>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Vos statistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-violet-600">0</div>
            <div className="text-sm text-stone-600">Rendez-vous à venir</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-600">0</div>
            <div className="text-sm text-stone-600">Profils favoris</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-stone-900">0</div>
            <div className="text-sm text-stone-600">Recherches</div>
          </div>
        </div>
      </div>
    </div>
  )
}
