export type BtnStyle = 'gradient' | 'solid' | 'outline' | 'glassmorphic'

export interface ProTheme {
  id: string
  name: string
  accent: string
  font: string
  bg: string
  text: string
  muted: string
  border: string
  btn_style: BtnStyle
  dark: boolean
}

export const PRO_THEMES: ProTheme[] = [
  {
    id: 'minimalist',
    name: 'Minimaliste Zen',
    accent: '#7c3aed',
    font: 'Inter',
    bg: '#f8fafc',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    btn_style: 'gradient',
    dark: false,
  },
  {
    id: 'barber',
    name: 'Barbier Vintage',
    accent: '#f43f5e',
    font: 'Playfair Display',
    bg: '#1a1a1a',
    text: '#f0e4cc',
    muted: '#9a8060',
    border: '#2a2010',
    btn_style: 'solid',
    dark: true,
  },
  {
    id: 'studio_flash',
    name: 'Studio Flash',
    accent: '#ec4899',
    font: 'Poppins',
    bg: '#0f0f0f',
    text: '#ffffff',
    muted: '#a1a1aa',
    border: '#27272a',
    btn_style: 'glassmorphic',
    dark: true,
  },
  {
    id: 'luxury',
    name: 'Boutique Luxe',
    accent: '#d4af37',
    font: 'Playfair Display',
    bg: '#1a1a2e',
    text: '#f8f4e8',
    muted: '#9d8b6a',
    border: '#2a2a40',
    btn_style: 'outline',
    dark: true,
  },
  {
    id: 'modern_grid',
    name: 'Modern Grid',
    accent: '#00d9ff',
    font: 'IBM Plex Sans',
    bg: '#ffffff',
    text: '#0a0a0a',
    muted: '#525252',
    border: '#e5e5e5',
    btn_style: 'solid',
    dark: false,
  },
]

export const DEFAULT_SECTIONS = {
  about: true,
  reviews: true,
  schedule: true,
  gallery: false,
  blog: false,
}

export type Sections = typeof DEFAULT_SECTIONS

export function getTheme(id: string): ProTheme {
  return PRO_THEMES.find(t => t.id === id) ?? PRO_THEMES[0]
}

export const ACCENT_COLORS = [
  { hex: '#7c3aed', name: 'Violet' },
  { hex: '#ec4899', name: 'Rose' },
  { hex: '#f43f5e', name: 'Rouge' },
  { hex: '#10b981', name: 'Émeraude' },
  { hex: '#3b82f6', name: 'Bleu' },
  { hex: '#f59e0b', name: 'Ambre' },
  { hex: '#d4af37', name: 'Or' },
  { hex: '#00d9ff', name: 'Cyan' },
  { hex: '#8b5cf6', name: 'Lavande' },
  { hex: '#ef4444', name: 'Écarlate' },
  { hex: '#14b8a6', name: 'Turquoise' },
  { hex: '#0f172a', name: 'Nuit' },
]

export const FONT_OPTIONS = [
  'Inter',
  'Playfair Display',
  'Poppins',
  'Montserrat',
  'Lora',
  'IBM Plex Sans',
  'Raleway',
]
