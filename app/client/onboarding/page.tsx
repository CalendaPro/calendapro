'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepOne from './_components/StepOne'
import StepTwo from './_components/StepTwo'
import StepThree from './_components/StepThree'

export default function ClientOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Étape 1 : Comment avez-vous trouvé CalendaPro ?
  const [howFound, setHowFound] = useState('')
  const [howFoundOther, setHowFoundOther] = useState('')

  // Étape 2 : Quels services vous intéressent ?
  const [interests, setInterests] = useState<string[]>([])

  // Étape 3 : Votre profil (optionnel)
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [availability, setAvailability] = useState<string[]>([])

  const toggleInterest = (interest: string) => {
    if (interests.length >= 8 && !interests.includes(interest)) return
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const toggleAvailability = (value: string) => {
    setAvailability(prev =>
      prev.includes(value)
        ? prev.filter(i => i !== value)
        : [...prev, value]
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
    // TODO: Sauvegarder les données en BD (howFound, howFoundOther, interests, bio, location, phone, availability)
    // TODO: Mettre onboarding_completed = true
    
    setTimeout(() => {
      setLoading(false)
      router.push('/client/marketplace')
    }, 1000)
  }

  return (
    <div>
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
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-stone-900 mb-2">
                  Bienvenue sur CalendaPro !
                </h1>
              </div>
              <StepOne
                howFound={howFound}
                howFoundOther={howFoundOther}
                onHowFoundChange={setHowFound}
                onHowFoundOtherChange={setHowFoundOther}
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <StepTwo
              interests={interests}
              onToggleInterest={toggleInterest}
            />
          )}

          {/* Step 3 */}
          {step === 3 && (
            <StepThree
              bio={bio}
              location={location}
              phone={phone}
              availability={availability}
              onBioChange={setBio}
              onLocationChange={setLocation}
              onPhoneChange={setPhone}
              onToggleAvailability={toggleAvailability}
            />
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
