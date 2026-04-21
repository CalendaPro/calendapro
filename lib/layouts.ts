// Unified Modern-Premium Layout - Single design system for all users

export interface LayoutConfig {
  id: string
  name: string
  vars: Record<string, string>
  description?: string
  idealFor?: string
  preview?: {
    bg: string
    sidebar: string
    card: string
    accent: string
    text: string
    textMuted: string
  }
}

// ── Unified Dashboard Layout (Modern-Premium) ─────────────────────────────────

export const MODERN_PREMIUM_LAYOUT: LayoutConfig = {
  id: 'modern-premium',
  name: 'Modern Premium',
  idealFor: 'Tous les secteurs — design élégant et professionnel',
  description: 'Élégant avec dégradés et animations fluides',
  preview: {
    bg: '#f8f7f4',
    sidebar: '#ffffff',
    card: '#ffffff',
    accent: '#7c3aed',
    text: '#0f172a',
    textMuted: '#94a3b8',
  },
  vars: {
    // Sidebar
    '--dl-sidebar-bg':             '#ffffff',
    '--dl-sidebar-border':         '#ede9e3',
    '--dl-sidebar-text':           '#64748b',
    '--dl-sidebar-text-hover':     '#0f172a',
    '--dl-sidebar-hover-bg':       '#f8f7f4',
    '--dl-sidebar-active-bg':      '#f5f3ff',
    '--dl-sidebar-active-border':  '#ede9fe',
    '--dl-sidebar-section-label':  '#c4bfb8',
    // Main content
    '--dl-main-bg':                '#f8f7f4',
    '--dl-bg':                     '#f8f7f4',
    // Cards
    '--dl-card-bg':                '#ffffff',
    '--dl-card-border':            '#e7e5e4',
    '--dl-card-shadow':            '0 1px 8px rgba(0,0,0,0.04)',
    // Typography
    '--dl-text-primary':           '#0f172a',
    '--dl-text-muted':             '#94a3b8',
    // Branding
    '--dl-user-bg':                '#fafaf8',
    '--dl-logo-border':            '#f0ede8',
    '--dl-font-scale':             '1',
  },
}

// ── Client Layout (Unified) ────────────────────────────────────────────────────

export const CLIENT_MODERN_LAYOUT: LayoutConfig = {
  id: 'client-modern',
  name: 'Client Modern',
  vars: {
    '--cl-bg':           '#0c0a13',
    '--cl-glass-sidebar': 'rgba(12,10,19,0.7)',
    '--cl-glass-navbar':  'rgba(12,10,19,0.65)',
    '--cl-text-primary':  '#f1f5f9',
    '--cl-text-muted':    'rgba(255,255,255,0.4)',
  },
}

// ── Legacy Helpers (deprecated - maintained for backwards compatibility) ────────

export function getProLayout(_id?: string): LayoutConfig {
  return MODERN_PREMIUM_LAYOUT
}

export function getClientLayout(_id?: string): LayoutConfig {
  return CLIENT_MODERN_LAYOUT
}

// Legacy exports for backwards compatibility
export type ProLayoutId = 'modern'
export type ClientLayoutId = 'modern'
export const PRO_LAYOUTS = { modern: MODERN_PREMIUM_LAYOUT }
export const CLIENT_LAYOUTS = { modern: CLIENT_MODERN_LAYOUT }
export const PRO_LAYOUT_IDS: ProLayoutId[] = ['modern']
export const CLIENT_LAYOUT_IDS: ClientLayoutId[] = ['modern']
