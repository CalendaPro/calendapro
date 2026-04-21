'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  generateColorPalette,
  getComplementaryColor,
  getAnalogousColors,
  getTriadicColors,
  type ColorPalette,
} from '@/lib/themes-complete'

interface AccentColorContextValue {
  accentColor: string
  setAccentColor: (color: string) => void
  isLoading: boolean
  palette: ColorPalette
  complementary: string
  analogous: [string, string]
  triadic: [string, string]
}

const AccentColorContext = createContext<AccentColorContextValue>({
  accentColor: '#7c3aed',
  setAccentColor: () => {},
  isLoading: true,
  palette: generateColorPalette('#7c3aed'),
  complementary: '#9b3aed',
  analogous: ['#3aed7c', '#ed3a7c'],
  triadic: ['#3a7ced', '#ed7c3a'],
})

export function useAccentColor() {
  return useContext(AccentColorContext)
}

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<string>('#7c3aed')
  const [palette, setPalette] = useState<ColorPalette>(generateColorPalette('#7c3aed'))
  const [complementary, setComplementary] = useState<string>('#9b3aed')
  const [analogous, setAnalogous] = useState<[string, string]>(['#3aed7c', '#ed3a7c'])
  const [triadic, setTriadic] = useState<[string, string]>(['#3a7ced', '#ed7c3a'])
  const [isLoading, setIsLoading] = useState(true)

  // Apply accent color to CSS variables with full palette
  const applyAccentColor = useCallback((color: string) => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Generate full palette
    const generatedPalette = generateColorPalette(color)
    setPalette(generatedPalette)

    // Generate color harmonies
    setComplementary(getComplementaryColor(color))
    setAnalogous(getAnalogousColors(color))
    setTriadic(getTriadicColors(color))

    // Convert hex to RGB for opacity variations
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Set full accent palette (50-900)
    root.style.setProperty('--accent-50', generatedPalette[50])
    root.style.setProperty('--accent-100', generatedPalette[100])
    root.style.setProperty('--accent-200', generatedPalette[200])
    root.style.setProperty('--accent-300', generatedPalette[300])
    root.style.setProperty('--accent-400', generatedPalette[400])
    root.style.setProperty('--accent-500', generatedPalette[500])
    root.style.setProperty('--accent-600', generatedPalette[600])
    root.style.setProperty('--accent-700', generatedPalette[700])
    root.style.setProperty('--accent-800', generatedPalette[800])
    root.style.setProperty('--accent-900', generatedPalette[900])

    // Set primary accent (legacy aliases)
    root.style.setProperty('--accent-primary', color)
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
    root.style.setProperty('--accent-10', `rgba(${r}, ${g}, ${b}, 0.1)`)
    root.style.setProperty('--accent-15', `rgba(${r}, ${g}, ${b}, 0.15)`)
    root.style.setProperty('--accent-20', `rgba(${r}, ${g}, ${b}, 0.2)`)
    root.style.setProperty('--accent-25', `rgba(${r}, ${g}, ${b}, 0.25)`)
    root.style.setProperty('--accent-30', `rgba(${r}, ${g}, ${b}, 0.3)`)
    root.style.setProperty('--accent-40', `rgba(${r}, ${g}, ${b}, 0.4)`)
    root.style.setProperty('--accent-50-rgba', `rgba(${r}, ${g}, ${b}, 0.5)`)
    root.style.setProperty('--accent-hover', generatedPalette[600])

    // Dashboard-specific accents
    root.style.setProperty('--dl-accent', color)
    root.style.setProperty('--dl-accent-light', generatedPalette[100])
    root.style.setProperty('--dl-accent-border', `rgba(${r}, ${g}, ${b}, 0.3)`)

    // Client-specific accents
    root.style.setProperty('--cl-accent', color)
    root.style.setProperty('--cl-accent-soft', generatedPalette[200])
    root.style.setProperty('--cl-accent-glow', `rgba(${r}, ${g}, ${b}, 0.4)`)

    // Update orb colors for client layout
    root.style.setProperty('--cl-orb-1', `rgba(${r}, ${g}, ${b}, 0.4)`)
    root.style.setProperty('--cl-orb-2', `rgba(${Math.min(255, r + 50)}, ${Math.max(0, g - 20)}, ${Math.min(255, b + 30)}, 0.3)`)
    root.style.setProperty('--cl-orb-3', `rgba(${Math.max(0, r - 30)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 50)}, 0.25)`)

    // Color harmonies
    root.style.setProperty('--complementary', getComplementaryColor(color))
    root.style.setProperty('--analogous-1', getAnalogousColors(color)[0])
    root.style.setProperty('--analogous-2', getAnalogousColors(color)[1])
    root.style.setProperty('--triadic-1', getTriadicColors(color)[0])
    root.style.setProperty('--triadic-2', getTriadicColors(color)[1])
  }, [])

  // Load accent color from API
  useEffect(() => {
    fetch('/api/user/preferences')
      .then(r => r.json())
      .then((data: { accent_color_override?: string | null }) => {
        if (data.accent_color_override) {
          setAccentColorState(data.accent_color_override)
          applyAccentColor(data.accent_color_override)
        }
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [applyAccentColor])

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color)
    applyAccentColor(color)

    // Save to API
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accent_color_override: color }),
    }).catch(() => {})
  }, [applyAccentColor])

  return (
    <AccentColorContext.Provider
      value={{
        accentColor,
        setAccentColor,
        isLoading,
        palette,
        complementary,
        analogous,
        triadic,
      }}
    >
      {children}
    </AccentColorContext.Provider>
  )
}
