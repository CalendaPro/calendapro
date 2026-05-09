'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchBarProps {
  onSearch: (query: string) => void
  onCategoryChange: (category: string) => void
  onCityChange: (city: string) => void
  onPriceChange: (price: number) => void
  onRatingChange: (rating: number) => void
  onAvailabilityChange: (availability: string) => void
}

interface Suggestions {
  categories: { id: string; label: string; icon: React.ReactNode }[]
  cities: { city: string }[]
  history: { query: string }[]
  popular: { query: string }[]
}

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg> },
  { id: 'barbier', label: 'Barbiers', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.5 6.5 11 9"/><path d="m13 13 4 4"/><path d="M20 20h-6"/><path d="M20 14v6"/></svg> },
  { id: 'coach', label: 'Coachs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5 12 12"/><path d="m12 12 4 4"/><path d="m12 12-3-3"/></svg> },
  { id: 'photo', label: 'Photographes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> },
  { id: 'freelance', label: 'Freelances', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg> },
  { id: 'therapeute', label: 'Thérapeutes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M2 8c0-2.2.7-4.3 2-6"/><path d="M22 8a10 10 0 0 0-2-6"/></svg> },
  { id: 'sport', label: 'Coachs sportifs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5 17.5 17.5"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path d="m15 15 3-3"/><path d="m9 9-3 3"/></svg> },
  { id: 'consultant', label: 'Consultants', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg> },
  { id: 'creatif', label: 'Créatifs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> },
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
  const [suggestions, setSuggestions] = useState<Suggestions>({ categories: [], cities: [], history: [], popular: [] })
  const [category, setCategory] = useState('all')
  const [city, setCity] = useState('Toutes les villes')
  const [price, setPrice] = useState(200)
  const [rating, setRating] = useState(0)
  const [availability, setAvailability] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`)
      if (res.ok) setSuggestions(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    if (!showSuggestions) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, showSuggestions, fetchSuggestions])

  const logSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) return
    await fetch('/api/search/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q.trim() }),
    }).catch(() => {})
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  const handleSubmit = () => {
    setLoading(true)
    setShowSuggestions(false)
    void logSearch(query)
    setTimeout(() => { setLoading(false) }, 400)
  }

  const handleSuggestionClick = (label: string) => {
    setQuery(label)
    setShowSuggestions(false)
    onSearch(label)
    void logSearch(label)
  }

  const handleFilterSubmit = () => {
    setLoading(true)
    setShowFilters(false)
    setTimeout(() => setLoading(false), 400)
  }

  const hasSuggestions =
    suggestions.categories.length > 0 ||
    suggestions.cities.length > 0 ||
    suggestions.history.length > 0 ||
    suggestions.popular.length > 0

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
            onClick={handleSubmit}
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
        <AnimatePresence>
          {showSuggestions && hasSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-64 mt-2 bg-white/98 backdrop-blur-sm border border-violet-100 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {suggestions.categories.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <div className="text-xs font-700 text-stone-400 uppercase tracking-wider mb-1">Catégories</div>
                  {suggestions.categories.map(c => (
                    <button key={c.id} onClick={() => handleSuggestionClick(c.label)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-violet-50 transition-colors text-left">
                      <span>{c.icon}</span><span className="text-stone-700 text-sm">{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.cities.length > 0 && (
                <div className="px-4 pt-2 pb-1">
                  <div className="text-xs font-700 text-stone-400 uppercase tracking-wider mb-1">Villes</div>
                  {suggestions.cities.map(c => (
                    <button key={c.city} onClick={() => handleSuggestionClick(c.city)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-violet-50 transition-colors text-left">
 <span></span><span className="text-stone-700 text-sm">{c.city}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.history.length > 0 && (
                <div className="px-4 pt-2 pb-1">
                  <div className="text-xs font-700 text-stone-400 uppercase tracking-wider mb-1">Récentes</div>
                  {suggestions.history.map((h, i) => (
                    <button key={i} onClick={() => handleSuggestionClick(h.query)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-violet-50 transition-colors text-left">
 <span></span><span className="text-stone-700 text-sm">{h.query}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions.popular.length > 0 && !query && (
                <div className="px-4 pt-2 pb-3">
                  <div className="text-xs font-700 text-stone-400 uppercase tracking-wider mb-1">Populaires cette semaine</div>
                  {suggestions.popular.map((p, i) => (
                    <button key={i} onClick={() => handleSuggestionClick(p.query)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-violet-50 transition-colors text-left">
 <span></span><span className="text-stone-700 text-sm">{p.query}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
                    {cat.label}
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
              <span className="inline-flex items-center">{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
