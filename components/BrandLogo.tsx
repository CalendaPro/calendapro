import Link from 'next/link'

export type BrandLogoProps = {
  href?: string
  variant?: 'default' | 'dark'
  size?: 'default' | 'compact'
}

export function BrandLogo({
  href = '/',
  variant = 'default',
  size = 'default',
}: BrandLogoProps) {
  const dark = variant === 'dark'
  const compact = size === 'compact'
  const box = compact ? 30 : 34
  const svg = compact ? 15 : 16
  const fontSize = compact ? '1.08rem' : '1.2rem'

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 7 : 8,
      }}
    >
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
      <span
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.03em',
          color: dark ? '#f8fafc' : '#0f0a1e',
        }}
      >
        Calenda
        <span
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Pro
        </span>
      </span>
    </Link>
  )
}
