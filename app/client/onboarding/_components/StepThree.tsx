'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Globe, Sunrise, Sun, Moon } from 'lucide-react'
import type { OnboardingData } from '../page'

interface StepThreeProps {
  city: string
  searchRadius: number
  includeOnline: boolean
  availableTimes: string[]
  onChange: (updates: Partial<OnboardingData>) => void
}

const FRENCH_CITIES = [
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier',
  'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon',
  'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Saint-Denis', 'Le Mans',
  'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Limoges', 'Tours', 'Amiens',
  'Perpignan', 'Metz', 'Besançon', 'Orléans', 'Saint-Denis', 'Rouen', 'Montreuil',
  'Argenteuil', 'Mulhouse', 'Caen', 'Nancy', 'Saint-Paul', 'Roubaix', 'Tourcoing',
  'Nanterre', 'Vitry-sur-Seine', 'Créteil', 'Avignon', 'Poitiers', 'Aubervilliers',
  'Asnières-sur-Seine', 'Aulnay-sous-Bois', 'Colombes', 'Dunkerque', 'Saint-Pierre',
  'Versailles', 'Courbevoie', 'Cherbourg-en-Cotentin', 'Rueil-Malmaison', 'Béziers',
  'La Rochelle', 'Champigny-sur-Marne', 'Pau', 'Mérignac', 'Saint-Maur-des-Fossés',
  'Antibes', 'Cannes', 'Saint-Nazaire', 'Drancy', 'Noisy-le-Grand', 'La Seyne-sur-Mer',
  'Calais', 'Venissieux', 'Clichy', 'Issy-les-Moulineaux', 'Levallois-Perret',
  'Pessac', 'Valence', 'Bourges', 'Ivry-sur-Seine', 'Quimper', 'Cergy', 'Cayenne',
  'Montauban', 'Albi', 'Neuilly-sur-Seine', 'Chambéry', 'Pantin', 'Lorient',
  'Les Abymes', 'Le Tampon', 'Villejuif', 'Sarcelles', 'Maisons-Alfort', 'Saint-André',
  'Meaux', 'Fontenay-sous-Bois', 'Hyères', 'Évry-Courcouronnes', 'Vénissieux',
  'Bondy', 'Arles', 'Cholet', 'Clamart', 'Fréjus', 'Sartrouville', 'Saint-Quentin',
  'Saint-Louis', 'Villeneuve-d\'Ascq', 'Sevran', 'Corbeil-Essonnes', 'Saint-Ouen-sur-Seine',
  'Massy', 'Vaulx-en-Velin', 'Gennevilliers', 'Livry-Gargan', 'Rosny-sous-Bois',
  'Saint-Laurent-du-Maroni', 'Saint-Priest', 'Saint-Malo', 'Vincennes', 'Cagnes-sur-Mer',
  'Charleville-Mézières', 'Suresnes', 'Martigues', 'Saint-Brieuc', 'Montrouge',
  'Carcassonne', 'Saint-Germain-en-Laye', 'Bobigny', 'Belfort', 'Alfortville',
  'Chalon-sur-Saône', 'Sète', 'Sainte-Geneviève-des-Bois', 'Saint-Chamond',
  'Villepinte', 'Saint-Joseph', 'Vienne', 'Fontenay-aux-Roses', 'Thonon-les-Bains',
  'Athis-Mons', 'Roanne', 'Le Cannet', 'Schiltigheim', 'Épinay-sur-Seine',
  'Le Port', 'Garges-lès-Gonesse', 'Châlons-en-Champagne', 'Saint-Martin-d\'Hères',
  'Conflans-Sainte-Honorine', 'Talence', 'Angoulême', 'Haguenau', 'Bagneux',
  'Brunoy', 'Pontault-Combault', 'Wattrelos', 'Villenave-d\'Ornon', 'Villeurbanne',
  'Castres', 'Thionville', 'Bastia', 'Colmar', 'Douai', 'Melun', 'Le Perreux-sur-Marne',
  'Gagny', 'Gap', 'Aix-les-Bains', 'Draguignan', 'Marcq-en-Barœul', 'Compiègne',
  'Anglet', 'Saint-Étienne-du-Rouvray', 'Chatou', 'Le Chesnay-Rocquencourt',
  'Chartres', 'Saint-Leu', 'Joué-lès-Tours', 'Villefranche-sur-Saône', 'Saint-Fons',
  'L\'Haÿ-les-Roses', 'Le Kremlin-Bicêtre', 'Ermont', 'Sannois', 'Clichy-sous-Bois',
  'Villemomble', 'Dumbéa', 'Rillieux-la-Pape', 'Palaiseau', 'Châtellerault',
  'Sainte-Marie', 'Villiers-sur-Marne', 'Sanary-sur-Mer', 'Les Mureaux',
  'Montigny-le-Bretonneux', 'Mantes-la-Jolie', 'Marignane', 'Maurepas',
  'Bezons', 'Guyancourt', 'Cachan', 'Pierrefitte-sur-Seine', 'Malakoff',
  'Voisins-le-Bretonneux', 'Décines-Charpieu', 'Fresnes', 'Vélizy-Villacoublay',
  'Saint-Cloud', 'Charenton-le-Pont', 'Taverny', 'Villeparisis', 'Bourg-la-Reine',
  'Lunel', 'Sainte-Anne', 'Montbéliard', 'Le Plessis-Robinson', 'La Garenne-Colombes',
  'Lambersart', 'Saintes', 'Houilles', 'Gonesse', 'Meyzieu', 'Le Grand-Quevilly',
  'Montluçon', 'Canteleu', 'Baie-Mahault', 'Orvault', 'Seynod', 'Sainte-Suzanne',
  'Périgueux', 'Lormont', 'Vanves', 'Blagnac', 'Menton', 'La Teste-de-Buch',
  'Biarritz', 'Soissons', 'Les Pavillons-sous-Bois', 'Vichy', 'Romainville',
  'Ris-Orangis', 'Yerres', 'Le Petit-Quevilly', 'Clichy', 'Grigny',
  'Villiers-le-Bel', 'Antony', 'Gennevilliers', 'Le Gosier', 'Oullins',
  'Mons-en-Barœul', 'Loos', 'Brive-la-Gaillarde', 'La Possession', 'Vienne',
  'Agde', 'Loudun', 'Gradignan', 'Le Bouscat', 'Brétigny-sur-Orge',
  'Illkirch-Graffenstaden', 'Vernon', 'Lannion', 'Le Kremlin-Bicêtre',
  'Six-Fours-les-Plages', 'Auxerre', 'Neuilly-sur-Marne', 'Saint-Mandé',
  'Châtenay-Malabry', 'Échirolles', 'Rochefort', 'Saint-Maximin-la-Sainte-Baume',
  'Vence', 'Muret', 'Sèvremoine', 'Mâcon', 'Matoury', 'Bourg-en-Bresse',
  'Élancourt', 'Cournon-d\'Auvergne', 'Cavaillon', 'Le Robert', 'Le François',
  'Sainte-Rose', 'Fleury-les-Aubrais', 'Montfermeil', 'Éragny', 'Le Lamentin',
  'Mont-Saint-Aignan', 'Rambouillet', 'Montgeron', 'Saint-Genis-Laval',
  'La Garde', 'Le Mée-sur-Seine', 'Ollioules', 'Arcueil', 'Eaubonne',
  'Bègles', 'Mougins', 'Le Plessis-Trévise', 'Villefontaine',
]

const RADIUS_OPTIONS = [5, 10, 20, 50]

const TIME_OPTIONS = [
  { id: 'morning', label: 'Matin', icon: Sunrise },
  { id: 'afternoon', label: 'Après-midi', icon: Sun },
  { id: 'evening', label: 'Soir', icon: Moon },
]

export function StepThree({ city, searchRadius, includeOnline, availableTimes, onChange }: StepThreeProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredCities, setFilteredCities] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCityChange = (value: string) => {
    onChange({ city: value })
    if (value.length > 0) {
      const filtered = FRENCH_CITIES.filter(c =>
        c.toLowerCase().startsWith(value.toLowerCase())
      ).slice(0, 5)
      setFilteredCities(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      setShowDropdown(false)
    }
  }

  const selectCity = (selectedCity: string) => {
    onChange({ city: selectedCity })
    setShowDropdown(false)
  }

  const toggleTime = (timeId: string) => {
    const newTimes = availableTimes.includes(timeId)
      ? availableTimes.filter(t => t !== timeId)
      : [...availableTimes, timeId]
    onChange({ availableTimes: newTimes })
  }

  return (
    <div>
      <h1 className="step-title">Où êtes-vous basé ?</h1>
      <p className="step-subtitle">Pour trouver les pros près de chez vous</p>

      {/* City Input */}
      <div className="form-section" ref={wrapperRef}>
        <p className="form-section-title">Votre ville</p>
        <div className="cb-input-wrapper">
          <MapPin className="cb-input-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="Paris, Lyon, Marseille..."
            className="cb-input with-icon"
          />
          {showDropdown && (
            <div className="autocomplete-dropdown">
              {filteredCities.map((c) => (
                <div
                  key={c}
                  className="autocomplete-item"
                  onClick={() => selectCity(c)}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Radius Selector */}
      <div className="form-section">
        <p className="form-section-title">Rayon de recherche</p>
        <div className="radius-selector">
          {RADIUS_OPTIONS.map((radius) => (
            <button
              key={radius}
              className={`radius-option ${searchRadius === radius ? 'selected' : ''}`}
              onClick={() => onChange({ searchRadius: radius })}
            >
              {radius} km
            </button>
          ))}
        </div>
      </div>

      {/* Include Online Toggle */}
      <div className="form-section">
        <div className="cb-toggle-container">
          <div className="cb-toggle-label">
            <Globe size={20} />
            <div>
              <p className="cb-toggle-text">Inclure les professionnels en ligne</p>
            </div>
          </div>
          <div
            className={`cb-toggle ${includeOnline ? 'active' : ''}`}
            onClick={() => onChange({ includeOnline: !includeOnline })}
          >
            <div className="cb-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Available Times */}
      <div className="form-section">
        <p className="form-section-title">Vos disponibilités préférées</p>
        <div className="time-selector">
          {TIME_OPTIONS.map((time) => {
            const Icon = time.icon
            const isSelected = availableTimes.includes(time.id)

            return (
              <button
                key={time.id}
                className={`time-option ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleTime(time.id)}
              >
                <Icon size={18} />
                <span>{time.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
