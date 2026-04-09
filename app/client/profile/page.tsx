'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function ClientProfilePage() {
  const { user } = useUser()

  // TODO: Fetch profile data from Supabase
  const mockProfile = {
    full_name: user?.fullName || 'Utilisateur',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    bio: '',
    interests: [],
    how_found: '',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Mon profil
        </h1>
        <p className="text-stone-600">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-semibold text-3xl">
            {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-stone-900 mb-1">
              {mockProfile.full_name}
            </h2>
            <p className="text-stone-600 mb-4">{mockProfile.email}</p>
            <Link
              href="/client/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Éditer mon profil
            </Link>
          </div>
        </div>

        {/* Preferences */}
        <div className="border-t border-stone-100 pt-6">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">
            Vos préférences
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-stone-500 mb-1">Comment avez-vous trouvé CalendaPro ?</p>
              <p className="text-stone-700">{mockProfile.how_found || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-sm text-stone-500 mb-1">Centres d'intérêt</p>
              <div className="flex flex-wrap gap-2">
                {mockProfile.interests.length > 0 ? (
                  mockProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm capitalize"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-stone-400">Aucun centre d'intérêt renseigné</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/client/settings"
          className="bg-white border border-stone-200 p-4 rounded-xl hover:border-violet-400 transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-medium text-stone-900">Paramètres</span>
        </Link>
      </div>
    </div>
  )
}
