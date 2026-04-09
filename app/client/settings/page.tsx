'use client'

import { useUser } from '@clerk/nextjs'

export default function ClientSettingsPage() {
  const { user } = useUser()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Paramètres
        </h1>
        <p className="text-stone-600">
          Gérez vos paramètres de compte
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              Informations du compte
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-500 mb-1">Email</p>
                <p className="text-stone-700">{user?.emailAddresses?.[0]?.emailAddress}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Nom</p>
                <p className="text-stone-700">{user?.fullName || 'Non renseigné'}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              Préférences
            </h2>
            <p className="text-stone-600">
              Plus d'options de paramètres seront bientôt disponibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
