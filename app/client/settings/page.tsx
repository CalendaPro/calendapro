'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

export default function ClientSettingsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  
  // Section 1: Account Info
  const [fullName, setFullName] = useState(user?.fullName || '')
  
  // Section 2: Preferences
  const [notifications, setNotifications] = useState(true)
  const [newsletter, setNewsletter] = useState(false)
  const [frequency, setFrequency] = useState('weekly')
  
  // Section 3: Privacy
  const [profileVisible, setProfileVisible] = useState(true)
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState(true)

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Paramètres
        </h1>
        <p className="text-stone-600">
          Gérez vos paramètres de compte et préférences
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Account Info */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Informations du compte
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <p className="text-stone-600">{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Nom</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-violet-500"
              />
            </div>
            <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Section 2: Preferences */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Préférences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Notifications pour les nouveaux pros</p>
                <p className="text-sm text-stone-600">Recevoir des alertes quand de nouveaux pros rejoignent</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-violet-600' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Newsletters & updates</p>
                <p className="text-sm text-stone-600">Recevoir les dernières actualités de CalendaPro</p>
              </div>
              <button
                onClick={() => setNewsletter(!newsletter)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  newsletter ? 'bg-violet-600' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    newsletter ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Fréquence</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-violet-500 bg-white"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Privacy */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Confidentialité
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Profil visible</p>
                <p className="text-sm text-stone-600">Permettre aux pros de voir votre profil</p>
              </div>
              <button
                onClick={() => setProfileVisible(!profileVisible)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  profileVisible ? 'bg-violet-600' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    profileVisible ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Suggestions personnalisées</p>
                <p className="text-sm text-stone-600">Recevoir des recommandations basées sur vos intérêts</p>
              </div>
              <button
                onClick={() => setPersonalizedSuggestions(!personalizedSuggestions)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  personalizedSuggestions ? 'bg-violet-600' : 'bg-stone-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    personalizedSuggestions ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Security */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Sécurité
          </h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 border border-stone-200 rounded-lg text-left hover:border-violet-400 transition-colors">
              Changer le mot de passe
            </button>
            <button className="w-full px-4 py-3 border border-stone-200 rounded-lg text-left hover:border-violet-400 transition-colors">
              Connecter d'autres appareils
            </button>
            <button className="w-full px-4 py-3 border border-red-200 text-red-600 rounded-lg text-left hover:border-red-400 transition-colors">
              Supprimer le compte
            </button>
          </div>
        </div>

        {/* Section 5: Logout */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
