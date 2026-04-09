'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SearchBarProps {
  onSearch: (query: string) => void
  onCategoryChange: (category: string) => void
  onCityChange: (city: string) => void
  onPriceChange: (price: number) => void
  onRatingChange: (rating: number) => void
  onAvailabilityChange: (availability: string) => void
}

const CATEGORIES = [
  { id: 'all', label: 'Tous', emoji: '✦' },
  { id: 'barbier', label: 'Barbiers', emoji: '✂️' },
  { id: 'coach', label: 'Coachs', emoji: '🎯' },
  { id: 'photo', label: 'Photographes', emoji: '📸' },
  { id: 'freelance', label: 'Freelances', emoji: '💻' },
  { id: 'therapeute', label: 'Thérapeutes', emoji: '💆' },
  { id: 'sport', label: 'Coachs sportifs', emoji: '🏋️' },
  { id: 'consultant', label: 'Consultants', emoji: '📊' },
  { id: 'creatif', label: 'Créatifs', emoji: '🎨' },
]

const POPULAR_CITIES = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes']

export default function SearchBar({
  onSearch,
  onCategoryChange,
  onCityChange,
  onPriceChange,
  onRatingChange,
  onAvailabilityChange,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [category, setCategory] = useState('all')
  const [city, setCity] = useState('Toutes les villes')
  const [price, setPrice] = useState(200)
  const [rating, setRating] = useState(0)
  const [availability, setAvailability] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)

  const suggestions = query.length > 0
    ? [
        { type: 'category', label: `Coiffeur à ${query}`, icon: '✂️' },
        { type: 'category', label: `Coach ${query}`, icon: '🎯' },
        { type: 'city', label: `${query} (ville)`, icon: '📍' },
      ]
    : []

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.label)
    setShowSuggestions(false)
    onSearch(suggestion.label)
  }

  const handleFilterSubmit = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setShowFilters(false)
    }, 500)
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Coiffeur, coach, photographe... ou ville"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-violet-100 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-all ${
              showFilters
                ? 'bg-violet-50 border-violet-400 text-violet-700'
                : 'bg-white/70 backdrop-blur-sm border-violet-100 text-stone-700 hover:border-violet-400'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 12.46 22 3"/>
              <line x1="10" y1="5" x2="10" y2="12"/>
              <line x1="14" y1="5" x2="14" y2="12"/>
            </svg>
            Filtres
          </button>
          <button
            onClick={handleFilterSubmit}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <>
                Rechercher
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-violet-100 rounded-xl shadow-xl z-50 overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-violet-50 transition-colors text-left"
              >
                <span className="text-lg">{suggestion.icon}</span>
                <span className="text-stone-700">{suggestion.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/70 backdrop-blur-sm border border-violet-100 rounded-xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Catégorie</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  onCategoryChange(e.target.value)
                }}
                className="w-full px-4 py-2 border border-violet-100 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Ville</label>
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  onCityChange(e.target.value)
                }}
                className="w-full px-4 py-2 border border-violet-100 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
              >
                <option value="Toutes les villes">Toutes les villes</option>
                {POPULAR_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Prix max: {price}€
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={price}
                onChange={(e) => {
                  setPrice(Number(e.target.value))
                  onPriceChange(Number(e.target.value))
                }}
                className="w-full accent-violet-600"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Note min</label>
              <select
                value={rating}
                onChange={(e) => {
                  setRating(Number(e.target.value))
                  onRatingChange(Number(e.target.value))
                }}
                className="w-full px-4 py-2 border border-violet-100 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
              >
                <option value="0">Toutes les notes</option>
                <option value="3">⭐⭐⭐ et plus</option>
                <option value="4">⭐⭐⭐⭐ et plus</option>
                <option value="4.5">⭐⭐⭐⭐⭐</option>
              </select>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Disponibilité</label>
            <div className="flex gap-3">
              {['all', 'today', 'this_week'].map((option) => (
                <label
                  key={option}
                  className={`flex-1 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                    availability === option
                      ? 'bg-violet-50 border-violet-400 text-violet-700'
                      : 'border-violet-100 hover:border-violet-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    value={option}
                    checked={availability === option}
                    onChange={(e) => {
                      setAvailability(e.target.value)
                      onAvailabilityChange(e.target.value)
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm">
                    {option === 'all' ? 'Toutes' : option === 'today' ? "Aujourd'hui" : 'Cette semaine'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Categories */}
      {!showFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-stone-500 self-center">Populaire:</span>
          {CATEGORIES.slice(1, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id)
                onCategoryChange(cat.id)
              }}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                category === cat.id
                  ? 'bg-violet-100 text-violet-700 border border-violet-300'
                  : 'bg-white/70 backdrop-blur-sm border border-violet-100 text-stone-600 hover:border-violet-400'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
