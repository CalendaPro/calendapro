// Unified Layout Provider - Modern Premium is the only layout
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  MODERN_PREMIUM_LAYOUT,
  CLIENT_MODERN_LAYOUT,
  getProLayout,
  getClientLayout,
} from './layouts'

// Layout IDs — 'modern' is the active default, others kept for legacy components
export type DashboardLayoutId = 'modern' | 'pro' | 'minimalist' | 'compact' | 'dark-pro'

interface LayoutContextValue {
  proLayout: DashboardLayoutId
  clientLayout: DashboardLayoutId
  dashboardLayout: DashboardLayoutId
  // Legacy setters - no-op since we only have one layout
  setProLayout: (id: DashboardLayoutId) => void
  setClientLayout: (id: DashboardLayoutId) => void
  setDashboardLayout: (id: DashboardLayoutId) => void
  isLoading: boolean
}

const LayoutContext = createContext<LayoutContextValue>({
  proLayout: 'modern',
  clientLayout: 'modern',
  dashboardLayout: 'modern',
  setProLayout: () => {},
  setClientLayout: () => {},
  setDashboardLayout: () => {},
  isLoading: false,
})

export function useLayout() {
  return useContext(LayoutContext)
}

function applyLayoutVars(vars: Record<string, string>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
}

function applyUnifiedLayout() {
  // Always apply Modern Premium layout
  applyLayoutVars(MODERN_PREMIUM_LAYOUT.vars)
  applyLayoutVars(CLIENT_MODERN_LAYOUT.vars)
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  // Apply unified layout once on mount
  useEffect(() => {
    applyUnifiedLayout()
    setIsLoading(false)
  }, [])

  // No-op setters - layout is unified
  const setProLayout = () => {}
  const setClientLayout = () => {}
  const setDashboardLayout = () => {}

  return (
    <LayoutContext.Provider value={{
      proLayout: 'modern',
      clientLayout: 'modern',
      dashboardLayout: 'modern',
      setProLayout,
      setClientLayout,
      setDashboardLayout,
      isLoading
    }}>
      {children}
    </LayoutContext.Provider>
  )
}
