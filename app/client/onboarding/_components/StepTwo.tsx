'use client'

interface StepTwoProps {
  interests: string[]
  onToggleInterest: (interest: string) => void
}

export default function StepTwo({ interests, onToggleInterest }: StepTwoProps) {
  const categories = [
    { value: 'coiffure', label: 'Coiffure' },
    { value: 'coaching', label: 'Coaching' },
    { value: 'photographie', label: 'Photographie' },
    { value: 'consultations', label: 'Consultations' },
    { value: 'massages', label: 'Massages' },
    { value: 'formation', label: 'Cours/Formation' },
    { value: 'medical', label: 'Médical' },
    { value: 'beaute', label: 'Beauté' },
    { value: 'sport', label: 'Sport/Fitness' },
    { value: 'bienetre', label: 'Bien-être' },
    { value: 'divertissement', label: 'Divertissement' },
    { value: 'reparation', label: 'Réparation/Service' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-2">
          Quels services vous intéressent ?
        </h2>
        <p className="text-stone-600">
          Sélectionnez jusqu'à 8 catégories qui vous intéressent
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => (
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
              onChange={() => onToggleInterest(category.value)}
              disabled={interests.length >= 8 && !interests.includes(category.value)}
              className="w-4 h-4 text-violet-600 rounded"
            />
            <span className="ml-3 text-stone-700">{category.label}</span>
          </label>
        ))}
      </div>

      {interests.length >= 8 && (
        <p className="text-sm text-violet-600">
          Vous avez sélectionné le maximum de catégories (8)
        </p>
      )}
    </div>
  )
}
