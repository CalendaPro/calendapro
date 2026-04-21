import Link from 'next/link'

export type BrandLogoProps = {
  href?: string
  variant?: 'default' | 'dark' | 'light'
  size?: 'default' | 'compact'
}

export function BrandLogo({
  href = '/dashboard',
  variant = 'default',
  size = 'default',
}: BrandLogoProps) {
  // Light mode: texte noir (#0f0a1e), Dark mode: texte blanc (#f8fafc)
  const isDark = variant === 'dark'
  const isLight = variant === 'light'
  const compact = size === 'compact'
  const box = compact ? 30 : 34
  const svg = compact ? 15 : 16
  const fontSize = compact ? '1.08rem' : '1.2rem'
  
  // Déterminer la couleur du texte "Calenda"
  // - Light mode explicit: noir
  // - Dark mode: blanc
  // - Default (auto): noir (light mode par défaut)
  const textColor = isDark ? '#f8fafc' : '#0f0a1e'

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 7 : 8,
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {/* Icône calendrier - Toujours violette (gradient #7c3aed à #ec4899) */}
      <div
        style={{
          width: box,
          height: box,
          borderRadius: compact ? 9 : 10,
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
          flexShrink: 0,
        }}
      >
        <svg
          width={svg}
          height={svg}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      {/* Texte CalendaPro */}
      <span
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.03em',
          color: textColor,
          overflow: 'visible',
          display: 'inline-block',
          paddingRight: '2px',
          paddingBottom: '1px',
        }}
      >
        Calenda
        {/* Pro reste en gradient violet-rose */}
        <span
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            overflow: 'visible',
            display: 'inline-block',
            paddingRight: '2px',
          }}
        >
          Pro
        </span>
      </span>
    </Link>
  )
}
