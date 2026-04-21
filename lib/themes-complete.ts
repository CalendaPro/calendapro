// lib/themes-complete.ts
// Color utilities for accent color generation - Theme packs deprecated

export interface ColorPalette {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR MANIPULATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convertit une couleur hex en RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convertit RGB en hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Convertit RGB en HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Convertit HSL en RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Éclaircit une couleur hex par un facteur (0-1)
 */
export function lighten(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  hsl.l = Math.min(100, hsl.l + (100 - hsl.l) * factor)

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Assombrit une couleur hex par un facteur (0-1)
 */
export function darken(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  hsl.l = Math.max(0, hsl.l * (1 - factor))

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Ajuste la saturation d'une couleur
 */
export function saturate(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  hsl.s = Math.min(100, hsl.s * (1 + factor))

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Obtient la couleur complémentaire
 */
export function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  hsl.h = (hsl.h + 180) % 360

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

/**
 * Obtient les couleurs analogues
 */
export function getAnalogousColors(hex: string): [string, string] {
  const rgb = hexToRgb(hex)
  if (!rgb) return [hex, hex]

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  const hsl1 = { ...hsl, h: (hsl.h - 30 + 360) % 360 }
  const hsl2 = { ...hsl, h: (hsl.h + 30) % 360 }

  const rgb1 = hslToRgb(hsl1.h, hsl1.s, hsl1.l)
  const rgb2 = hslToRgb(hsl2.h, hsl2.s, hsl2.l)

  return [
    rgbToHex(rgb1.r, rgb1.g, rgb1.b),
    rgbToHex(rgb2.r, rgb2.g, rgb2.b),
  ]
}

/**
 * Obtient les couleurs triadiques
 */
export function getTriadicColors(hex: string): [string, string] {
  const rgb = hexToRgb(hex)
  if (!rgb) return [hex, hex]

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  const hsl1 = { ...hsl, h: (hsl.h + 120) % 360 }
  const hsl2 = { ...hsl, h: (hsl.h + 240) % 360 }

  const rgb1 = hslToRgb(hsl1.h, hsl1.s, hsl1.l)
  const rgb2 = hslToRgb(hsl2.h, hsl2.s, hsl2.l)

  return [
    rgbToHex(rgb1.r, rgb1.g, rgb1.b),
    rgbToHex(rgb2.r, rgb2.g, rgb2.b),
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// GÉNÉRATION DE PALETTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Génère une palette complète à partir d'une couleur de base
 */
export function generateColorPalette(baseColor: string): ColorPalette {
  return {
    50: lighten(baseColor, 0.95),
    100: lighten(baseColor, 0.9),
    200: lighten(baseColor, 0.75),
    300: lighten(baseColor, 0.6),
    400: lighten(baseColor, 0.4),
    500: baseColor,
    600: darken(baseColor, 0.15),
    700: darken(baseColor, 0.3),
    800: darken(baseColor, 0.45),
    900: darken(baseColor, 0.6),
  }
}

/**
 * Génère une couleur aléatoire harmonieuse
 */
export function generateRandomAccentColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 60 + Math.floor(Math.random() * 30) // 60-90%
  const lightness = 45 + Math.floor(Math.random() * 20) // 45-65%

  const rgb = hslToRgb(hue, saturation, lightness)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/**
 * Suggère une couleur d'accent basée sur le secteur d'activité
 */
export function suggestAccentForIndustry(industry: string): string {
  const suggestions: Record<string, string> = {
    beauty: '#ec4899',      // Rose
    wellness: '#10b981',    // Vert
    tech: '#0ea5e9',        // Bleu
    food: '#f97316',        // Orange
    fitness: '#ef4444',     // Rouge
    finance: '#64748b',     // Gris
    luxury: '#fbbf24',      // Or
    creative: '#8b5cf6',    // Violet
    education: '#3b82f6',   // Bleu
    health: '#14b8a6',      // Turquoise
  }

  const key = industry.toLowerCase()
  return suggestions[key] || '#7c3aed' // Default violet
}

/**
 * Alias pour generateColorPalette - genere une palette de couleurs
 */
export function generatePalette(baseColor: string): ColorPalette {
  return generateColorPalette(baseColor)
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY THEME PACKS — kept for backwards compatibility
// ═══════════════════════════════════════════════════════════════════════════════

export interface ThemePack {
  id: string
  name: string
  description: string
  idealFor: string
  accentDefault: string
  previewGradient: string
  vars: Record<string, string>
}

export const DEFAULT_THEME_ID = 'modern-premium'

export const THEME_PACKS: ThemePack[] = [
  {
    id: 'modern-premium',
    name: 'Modern Premium',
    description: 'Élégant avec dégradés et animations fluides',
    idealFor: 'Tous les secteurs',
    accentDefault: '#7c3aed',
    previewGradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    vars: {},
  },
]

export function generateThemeCssVariables(_themeId: string, _accentColor?: string): Record<string, string> {
  return {}
}

export function applyThemeToDocument(_themeId: string, _accentColor?: string): void {
  // No-op — theme is now driven by CSS variables in globals.css
}
