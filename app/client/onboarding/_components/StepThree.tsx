'use client'

interface StepThreeProps {
  bio: string
  location: string
  phone: string
  availability: string[]
  onBioChange: (value: string) => void
  onLocationChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onToggleAvailability: (value: string) => void
}

export default function StepThree({ 
  bio, 
  location, 
  phone, 
  availability,
  onBioChange, 
  onLocationChange, 
  onPhoneChange, 
  onToggleAvailability 
}: StepThreeProps) {
  const availabilityOptions = [
    { value: 'morning', label: 'Matin' },
    { value: 'afternoon', label: 'Après-midi' },
    { value: 'evening', label: 'Soir' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-2">
          Votre profil (optionnel)
        </h2>
        <p className="text-stone-600">
          Complétez votre profil pour une expérience personnalisée
        </p>
      </div>

      <div className="space-y-6">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            placeholder="Parlez-nous un peu de vous..."
            rows={4}
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500 resize-none"
          />
          <p className="text-xs text-stone-500 mt-2">
            {bio.length}/500 caractères
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Localisation (ville/région)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Ex: Paris, Lyon, Île-de-France..."
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Téléphone (optionnel)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="06 12 34 56 78"
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">
            Disponibilité générale
          </label>
          <div className="flex flex-wrap gap-3">
            {availabilityOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center px-4 py-2 border rounded-xl cursor-pointer transition-colors ${
                  availability.includes(option.value)
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={availability.includes(option.value)}
                  onChange={() => onToggleAvailability(option.value)}
                  className="w-4 h-4 text-violet-600 rounded"
                />
                <span className="ml-2 text-stone-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
