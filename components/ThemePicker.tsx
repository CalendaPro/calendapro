// components/ThemePicker.tsx
// Sélecteur de thème prédéfini avec prévisualisation

'use client'

import { useThemePack } from '@/lib/theme-pack-provider'
import { useAccentColor } from '@/lib/accent-color-provider'
import { THEME_PACKS, type ThemePack } from '@/lib/themes-complete'

interface ThemePickerProps {
  variant?: 'pro' | 'client'
}

export default function ThemePicker({ variant = 'pro' }: ThemePickerProps) {
  const { themeId, setTheme, allThemes } = useThemePack()
  const { setAccentColor } = useAccentColor()

  const isDark = variant === 'client'

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'var(--dl-card-bg)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'var(--dl-card-border)'
  const textColor = isDark ? '#f1f5f9' : 'var(--dl-text-primary)'
  const mutedColor = isDark ? 'rgba(255,255,255,0.4)' : 'var(--dl-text-muted)'

  const handleThemeSelect = (selectedTheme: ThemePack) => {
    // Change le theme pack
    setTheme(selectedTheme.id)
    // Réinitialise l'accent color à la valeur par défaut du thème
    setAccentColor(selectedTheme.accentDefault)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {allThemes.map((theme) => {
          const isSelected = themeId === theme.id

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleThemeSelect(theme)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '14px 12px',
                borderRadius: 12,
                border: `2px solid ${isSelected ? 'var(--accent-500)' : cardBorder}`,
                background: isSelected
                  ? isDark
                    ? 'rgba(124,58,237,0.15)'
                    : 'var(--accent-50)'
                  : cardBg,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                gap: 10,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = isDark
                    ? 'rgba(255,255,255,0.2)'
                    : 'var(--accent-300)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = cardBorder
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {/* Preview gradient */}
              <div
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 8,
                  background: theme.previewGradient,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--accent-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Theme info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: isSelected ? 'var(--accent-600)' : textColor,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {theme.name}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: mutedColor,
                    lineHeight: 1.4,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {theme.description}
                </div>
                <div
                  style={{
                    fontSize: '0.6rem',
                    color: isSelected ? 'var(--accent-400)' : mutedColor,
                    fontStyle: 'italic',
                    marginTop: 2,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Idéal pour: {theme.idealFor}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
