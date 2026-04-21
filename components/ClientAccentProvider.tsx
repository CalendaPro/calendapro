'use client'

import { useEffect } from 'react'
import { generateColorPalette, getComplementaryColor, getAnalogousColors, getTriadicColors } from '@/lib/themes-complete'

interface ClientAccentProviderProps {
  accentColor: string
  children: React.ReactNode
}

export function ClientAccentProvider({ accentColor, children }: ClientAccentProviderProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Generate full palette
    const palette = generateColorPalette(accentColor)

    // Convert hex to RGB for opacity variations
    const hex = accentColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Set full accent palette (50-900)
    root.style.setProperty('--accent-50', palette[50])
    root.style.setProperty('--accent-100', palette[100])
    root.style.setProperty('--accent-200', palette[200])
    root.style.setProperty('--accent-300', palette[300])
    root.style.setProperty('--accent-400', palette[400])
    root.style.setProperty('--accent-500', accentColor)
    root.style.setProperty('--accent-600', palette[600])
    root.style.setProperty('--accent-700', palette[700])
    root.style.setProperty('--accent-800', palette[800])
    root.style.setProperty('--accent-900', palette[900])

    // Legacy aliases
    root.style.setProperty('--accent', accentColor)
    root.style.setProperty('--accent-primary', accentColor)
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
    root.style.setProperty('--accent-hover', palette[600])

    // Client-specific accents
    root.style.setProperty('--cl-accent', accentColor)
    root.style.setProperty('--cl-accent-soft', palette[200])
    root.style.setProperty('--cl-accent-glow', `rgba(${r}, ${g}, ${b}, 0.4)`)

    // Color harmonies
    root.style.setProperty('--complementary', getComplementaryColor(accentColor))
    root.style.setProperty('--analogous-1', getAnalogousColors(accentColor)[0])
    root.style.setProperty('--analogous-2', getAnalogousColors(accentColor)[1])
    root.style.setProperty('--triadic-1', getTriadicColors(accentColor)[0])
    root.style.setProperty('--triadic-2', getTriadicColors(accentColor)[1])
  }, [accentColor])

  return <>{children}</>
}
