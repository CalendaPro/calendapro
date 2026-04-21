// lib/theme-pack-provider.tsx
// Provider pour gérer le thème pack sélectionné (parmi les 10 thèmes prédéfinis)

'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  THEME_PACKS,
  DEFAULT_THEME_ID,
  type ThemePack,
  generateThemeCssVariables,
  applyThemeToDocument,
} from '@/lib/themes-complete'

interface ThemePackContextValue {
  themeId: string
  theme: ThemePack
  setTheme: (themeId: string) => void
  isLoading: boolean
  allThemes: ThemePack[]
}

const ThemePackContext = createContext<ThemePackContextValue>({
  themeId: DEFAULT_THEME_ID,
  theme: THEME_PACKS[0],
  setTheme: () => {},
  isLoading: true,
  allThemes: THEME_PACKS,
})

export function useThemePack() {
  return useContext(ThemePackContext)
}

interface ThemePackProviderProps {
  children: React.ReactNode
  accentColor?: string
}

export function ThemePackProvider({ children, accentColor }: ThemePackProviderProps) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID)
  const [isLoading, setIsLoading] = useState(true)

  // Find current theme object
  const theme = THEME_PACKS.find((t) => t.id === themeId) || THEME_PACKS[0]

  // Load theme from API on mount
  useEffect(() => {
    fetch('/api/user/preferences')
      .then((r) => r.json())
      .then((data: { theme_pack_id?: string; accent_color_override?: string | null }) => {
        if (data.theme_pack_id && THEME_PACKS.some((t) => t.id === data.theme_pack_id)) {
          setThemeId(data.theme_pack_id)
        }
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  // Apply theme CSS variables whenever theme or accent changes
  useEffect(() => {
    applyThemeToDocument(themeId, accentColor)
  }, [themeId, accentColor])

  const setTheme = useCallback(
    async (newThemeId: string) => {
      if (!THEME_PACKS.some((t) => t.id === newThemeId)) return

      setThemeId(newThemeId)

      // Save to API
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_pack_id: newThemeId }),
        })
      } catch {
        // Silently fail - theme is already applied locally
      }
    },
    []
  )

  return (
    <ThemePackContext.Provider
      value={{
        themeId,
        theme,
        setTheme,
        isLoading,
        allThemes: THEME_PACKS,
      }}
    >
      {children}
    </ThemePackContext.Provider>
  )
}
