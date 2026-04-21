'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ActiveMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  activeMode: ActiveMode
  setThemeMode: (mode: ThemeMode) => void
  isLoaded: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  activeMode: 'light',
  setThemeMode: () => {},
  isLoaded: false,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [systemMode, setSystemMode] = useState<ActiveMode>('light')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from API first (priority), then fallback to localStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try to load from API first
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.theme_mode && ['light', 'dark', 'auto'].includes(data.theme_mode)) {
            setMode(data.theme_mode as ThemeMode)
            // Sync localStorage with API value
            localStorage.setItem('cp-theme-mode', data.theme_mode)
            setIsLoaded(true)
            return
          }
        }
      } catch {
        // Fall back to localStorage on error
      }

      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('cp-theme-mode') as ThemeMode | null
        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          setMode(saved)
        }
      } catch {}
      setIsLoaded(true)
    }

    loadTheme()
  }, [])

  // Listen for storage changes (sync across tabs)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cp-theme-mode' && e.newValue) {
        if (e.newValue === 'light' || e.newValue === 'dark' || e.newValue === 'auto') {
          setMode(e.newValue as ThemeMode)
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Detect system preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemMode(media.matches ? 'dark' : 'light')
    const listener = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const activeMode: ActiveMode = mode === 'auto' ? systemMode : mode

  // Apply class to <html> with transition
  useEffect(() => {
    const root = document.documentElement
    if (activeMode === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }
  }, [activeMode])

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode)
    try {
      localStorage.setItem('cp-theme-mode', newMode)
    } catch {}
    // Also sync to API for persistence
    try {
      fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_mode: newMode }),
      }).catch(() => {})
    } catch {}
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, activeMode, setThemeMode, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  )
}
