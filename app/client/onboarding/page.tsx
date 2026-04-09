'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserMenuButton from '@/components/UserMenuButton'
import { BrandLogo } from '@/components/BrandLogo'

export default function ClientOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Étape 1 : Comment avez-vous trouvé CalendaPro ?
  const [howFound, setHowFound] = useState('')

  // Étape 2 : Quels services vous intéressent ?
  const [interests, setInterests] = useState<string[]>([])

  // Étape 3 : Votre profil (optionnel)
  const [bio, setBio] = useState('')

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    // TODO: Sauvegarder les données en BD (howFound, interests, bio)
    // TODO: Mettre onboarding_completed = true
    
    setTimeout(() => {
      setLoading(false)
      router.push('/client/marketplace')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <BrandLogo />
            <UserMenuButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= i
                      ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {i}
                </div>
                {i < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > i ? 'bg-gradient-to-r from-violet-600 to-rose-500' : 'bg-stone-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-stone-900 mb-2">
                  Bienvenue sur CalendaPro !
                </h1>
                <p className="text-stone-600">
                  Comment avez-vous trouvé CalendaPro ?
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'google', label: 'Google Search' },
                  { value: 'recommendation', label: 'Recommandation' },
                  { value: 'social', label: 'Réseaux sociaux' },
                  { value: 'other', label: 'Autre' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                      howFound === option.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="howFound"
                      value={option.value}
                      checked={howFound === option.value}
                      onChange={(e) => setHowFound(e.target.value)}
                      className="w-4 h-4 text-violet-600"
                    />
                    <span className="ml-3 text-stone-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-stone-900 mb-2">
                  Quels services vous intéressent ?
                </h2>
                <p className="text-stone-600">
                  Sélectionnez les catégories qui vous intéressent
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'coiffure', label: 'Coiffure' },
                  { value: 'coaching', label: 'Coaching' },
                  { value: 'photographie', label: 'Photographie' },
                  { value: 'beaute', label: 'Beauté' },
                  { value: 'sante', label: 'Santé' },
                  { value: 'sport', label: 'Sport' },
                  { value: 'massage', label: 'Massage' },
                  { value: 'autre', label: 'Autre' },
                ].map((category) => (
                  <label
                    key={category.value}
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                      interests.includes(category.value)
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={interests.includes(category.value)}
                      onChange={() => toggleInterest(category.value)}
                      className="w-4 h-4 text-violet-600 rounded"
                    />
                    <span className="ml-3 text-stone-700">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-stone-900 mb-2">
                  Votre profil (optionnel)
                </h2>
                <p className="text-stone-600">
                  Ajoutez une bio pour personnaliser votre expérience
                </p>
              </div>

              <div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parlez-nous un peu de vous..."
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500 resize-none"
                />
                <p className="text-xs text-stone-500 mt-2">
                  {bio.length}/500 caractères
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-stone-100">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="px-6 py-3 text-stone-600 hover:text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Retour
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : step === 3 ? 'Commencer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
