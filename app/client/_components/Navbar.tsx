'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLogo } from '@/components/BrandLogo'
import { Search, Bell, Plus } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/client': 'Tableau de bord',
  '/client/marketplace': 'Marketplace',
  '/client/favorites': 'Mes favoris',
  '/client/bookings': 'Mes rendez-vous',
  '/client/profile': 'Mon profil',
  '/client/settings': 'Paramètres',
}

export default function ClientNavbar() {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const title = pageTitles[pathname] ?? 'CalendaPro'

  return (
    <header className="glass-navbar">
      <div style={{ padding: '0 1.5rem' }}>
        <div className="flex items-center gap-4" style={{ height: 64 }}>
          {/* Brand */}
          <div className="flex-shrink-0 hidden md:block">
            <BrandLogo href="/client" />
          </div>

          {/* Page title — mobile */}
          <h1
            className="md:hidden flex-shrink-0 font-heading"
            style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--cl-text-primary)' }}
          >
            {title}
          </h1>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-auto">
            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.8}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                style={{ color: focused ? 'var(--cl-accent)' : 'var(--cl-text-muted)' }}
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Rechercher un professionnel..."
                style={{
                  width: '100%',
                  paddingLeft: '2.2rem',
                  paddingRight: '1rem',
                  paddingTop: '0.45rem',
                  paddingBottom: '0.45rem',
                  background: 'var(--cl-bg)',
                  border: `1.5px solid ${focused ? 'var(--cl-accent)' : 'var(--cl-border)'}`,
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  color: 'var(--cl-text-primary)',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: focused ? '0 0 0 3px var(--cl-accent-soft)' : 'none',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              style={{
                padding: '0.45rem',
                borderRadius: 8,
                border: '1.5px solid var(--cl-border)',
                background: 'var(--cl-surface)',
                position: 'relative',
                color: 'var(--cl-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--cl-accent)'
                e.currentTarget.style.color = 'var(--cl-accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--cl-border)'
                e.currentTarget.style.color = 'var(--cl-text-muted)'
              }}
            >
              <Bell size={16} strokeWidth={1.5} />
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 5, height: 5, borderRadius: '50%',
                background: '#f43f5e',
                border: '1.5px solid var(--cl-glass-navbar)',
              }} />
            </button>

            <Link
              href="/client/marketplace"
              className="hidden sm:inline-flex items-center gap-1.5 btn-glow"
              style={{
                padding: '0.42rem 0.9rem',
                background: 'linear-gradient(135deg, #4F46E5, #6366f1)',
                color: 'white',
                borderRadius: 10,
                fontSize: '0.78rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(79,70,229,0.25)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Nouveau RDV
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
