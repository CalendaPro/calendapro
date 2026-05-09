'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

interface CityOption {
  nom: string
  code: string
  codesPostaux?: string[]
}

interface CityAutocompleteProps {
  value: string
  onChange: (city: string, validated: boolean) => void
  accentColor: string
  showError?: boolean
}

export default function CityAutocomplete({ value, onChange, accentColor, showError }: CityAutocompleteProps) {
  const [search, setSearch] = useState(value)
  const [suggestions, setSuggestions] = useState<CityOption[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSelected, setHasSelected] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setLoading(true)
    try {
      const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,codesPostaux,code&boost=population&limit=8`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erreur API')
      const data = await res.json() as Array<{ nom: string; code: string; codesPostaux?: string[] }>
      const mapped = data.map(c => ({ 
        nom: c.nom, 
        code: c.code,
        codesPostaux: c.codesPostaux 
      }))
      setSuggestions(mapped)
      setShowSuggestions(mapped.length > 0)
    } catch {
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (value && value !== search.split(' (')[0]) {
      setSearch(value)
      setHasSelected(true)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    setHasSelected(false)
    onChange(val, false) // Not validated when typing
    setError(null)
    void fetchCities(val)
  }

  const handleSelectCity = (city: CityOption) => {
    const displayName = `${city.nom} (${city.codesPostaux?.[0] ?? city.code})`
    setSearch(displayName)
    setHasSelected(true)
    onChange(city.nom, true) // Validated when selected from list
    setError(null)
    setShowSuggestions(false)
    setSuggestions([])
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
  }

  const handleBlur = () => {
    // Delay to allow click on dropdown to register
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false)
      // Only validate if we haven't explicitly selected a city
      if (!hasSelected && search) {
        // Check if current search matches any suggestion
        const exactMatch = suggestions.find(c => 
          c.nom.toLowerCase() === search.toLowerCase() ||
          search.toLowerCase().startsWith(c.nom.toLowerCase())
        )
        if (!exactMatch) {
          setError('Veuillez sélectionner une ville dans la liste')
          onChange(search, false)
        } else {
          // Auto-select the matched city
          handleSelectCity(exactMatch)
        }
      }
    }, 150)
  }

  const handleFocus = () => {
    // Cancel any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (search.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true)
    } else if (search.length >= 2) {
      void fetchCities(search)
    }
  }

  const isValid = value && !error && hasSelected

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="elite-input"
          value={search}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="Ex: Lyon"
          style={{
            borderColor: error ? '#ef4444' : isValid ? '#10b981' : undefined,
            paddingRight: 40,
          }}
        />
        {isValid && (
          <span style={{ 
            position: 'absolute', 
            right: 12, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#10b981',
            fontSize: '1.2rem'
          }}>

          </span>
        )}
        {loading && (
          <span style={{ 
            position: 'absolute', 
            right: 12, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#94a3b8'
          }}>
            ⟳
          </span>
        )}
      </div>
      
      {error && (
        <div style={{ 
          marginTop: 6, 
          fontSize: '0.75rem', 
          color: '#ef4444',
          fontFamily: 'DM Sans, sans-serif',
        }}>
 {error}
        </div>
      )}
      
      {/* DEBUG: Visible counter */}
      <div style={{fontSize: '10px', color: '#666', marginTop: 2, fontFamily: 'monospace'}}>
        Suggestions: {suggestions.length} | Show: {showSuggestions ? 'yes' : 'no'} | Loading: {loading ? 'yes' : 'no'}
      </div>
      
      {/* DROPDOWN: Always render but toggle visibility with display CSS */}
      <div
        ref={dropdownRef}
        onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking dropdown
        style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'white',
          border: '2px solid #7c3aed',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 99999,
          maxHeight: 240,
          overflowY: 'auto',
          display: (showSuggestions && suggestions.length > 0) ? 'block' : 'none',
        }}
      >
          {suggestions.map((city) => (
            <button
              key={city.code}
              type="button"
              onClick={() => handleSelectCity(city)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.65rem 1rem',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'DM Sans, sans-serif',
                color: '#0f172a',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f3ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>{city.nom}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {city.codesPostaux?.[0] ?? city.code}
              </span>
            </button>
          ))}
        </div>
    </div>
  )
}

// Helper to check if city is valid (can be called from parent)
export function isCityValid(cityName: string, suggestions: CityOption[]): boolean {
  return suggestions.some(c => 
    c.nom.toLowerCase() === cityName.toLowerCase()
  )
}
