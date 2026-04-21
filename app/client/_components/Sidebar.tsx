'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Store, Heart, CalendarDays, User, Settings2 } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  exact?: boolean
  icon: React.ReactNode
}

const mainNav: NavItem[] = [
  { href: '/client',             label: 'Accueil',    exact: true, icon: <Home        size={18} strokeWidth={1.5} /> },
  { href: '/client/marketplace', label: 'Marketplace',             icon: <Store       size={18} strokeWidth={1.5} /> },
  { href: '/client/favorites',   label: 'Favoris',                 icon: <Heart       size={18} strokeWidth={1.5} /> },
  { href: '/client/appointments', label: 'Mes RDV',                 icon: <CalendarDays size={18} strokeWidth={1.5} /> },
  { href: '/client/profile',     label: 'Mon profil',              icon: <User        size={18} strokeWidth={1.5} /> },
]

const secondaryNav: NavItem[] = [
  { href: '/client/settings', label: 'Paramètres', icon: <Settings2 size={18} strokeWidth={1.5} /> },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 px-3 py-[0.52rem] rounded-[10px] text-[0.82rem] font-medium transition-all duration-200"
      style={isActive ? {
        background: 'var(--cl-accent-soft)',
        color: 'var(--cl-accent)',
        border: '1px solid var(--cl-accent-20)',
        fontWeight: 600,
      } : {
        color: 'var(--cl-text-muted)',
        border: '1px solid transparent',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--cl-surface)'
          e.currentTarget.style.color = 'var(--cl-text-primary)'
          e.currentTarget.style.borderColor = 'var(--cl-border)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = ''
          e.currentTarget.style.color = 'var(--cl-text-muted)'
          e.currentTarget.style.borderColor = 'transparent'
        }
      }}
    >
      <span style={{
        color: isActive ? 'var(--cl-accent)' : 'currentColor',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.2s',
        opacity: isActive ? 1 : 0.65,
      }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {isActive && (
        <span
          className="ml-auto flex-shrink-0"
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--cl-accent)',
            boxShadow: '0 0 8px var(--cl-accent-glow)',
          }}
        />
      )}
    </Link>
  )
}

export default function ClientSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-[0.65rem] py-[0.75rem] flex flex-col gap-0">
      <div className="flex flex-col gap-[3px]">
        {mainNav.map(item => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
      <div style={{ height: 1, background: 'var(--cl-border)', margin: '0.5rem 0.4rem', transition: 'background 0.3s' }} />
      <div className="flex flex-col gap-[3px]">
        {secondaryNav.map(item => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  )
}
