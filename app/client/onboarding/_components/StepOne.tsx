'use client'

interface StepOneProps {
  howFound: string
  howFoundOther: string
  onHowFoundChange: (value: string) => void
  onHowFoundOtherChange: (value: string) => void
}

export default function StepOne({ howFound, howFoundOther, onHowFoundChange, onHowFoundOtherChange }: StepOneProps) {
  const options = [
    { value: 'google', label: 'Google Search' },
    { value: 'recommendation', label: 'Recommandation' },
    { value: 'social', label: 'Réseaux sociaux' },
    { value: 'friend_family', label: 'Ami/Famille' },
    { value: 'advertising', label: 'Publicité' },
    { value: 'other', label: 'Autre' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-2">
          Comment avez-vous trouvé CalendaPro ?
        </h2>
        <p className="text-stone-600">
          Sélectionnez une option pour nous aider à améliorer notre service
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
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
              onChange={(e) => onHowFoundChange(e.target.value)}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-3 text-stone-700">{option.label}</span>
          </label>
        ))}
      </div>

      {howFound === 'other' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Pouvez-vous nous en dire plus ?
          </label>
          <textarea
            value={howFoundOther}
            onChange={(e) => onHowFoundOtherChange(e.target.value)}
            placeholder="Expliquez comment vous avez trouvé CalendaPro..."
            rows={3}
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>
      )}
    </div>
  )
}
