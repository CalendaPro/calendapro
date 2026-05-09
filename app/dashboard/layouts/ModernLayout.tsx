'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { BrandLogo } from '@/components/BrandLogo'
import { NAV_SECTIONS } from '../_nav/links'
import { useTheme } from '@/lib/theme-provider'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
}

// Hook for mobile breakpoint detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export default function ModernLayout({ children, userName, userEmail }: Props) {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const { activeMode, setThemeMode } = useTheme()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (!navRef.current) return
    const links = navRef.current.querySelectorAll<HTMLElement>('.ml-link')
    links.forEach((el, i) => {
      el.style.opacity = '0'
      el.style.transform = 'translateX(-8px)'
      setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
        el.style.opacity = '1'
        el.style.transform = 'translateX(0)'
      }, 60 * i)
    })
  }, [])

  return (
    <>
      <style>{`
        .ml-root { display: flex; min-height: 100vh; background: var(--dl-bg, #ffffff); }

        /* ── Mobile Header ── */
        .ml-mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: var(--dl-sidebar-bg, #f8fafc);
          border-bottom: 1px solid var(--dl-sidebar-border, #e2e8f0);
          z-index: 50;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
        }

        .ml-hamburger {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          color: var(--dl-text-primary, #0f172a);
          touch-action: manipulation;
        }

        .ml-hamburger:hover {
          background: var(--dl-sidebar-hover-bg, #f8f7f4);
        }

        .ml-hamburger svg {
          width: 24px;
          height: 24px;
        }

        /* ── Sidebar ── */
        .ml-sidebar {
          width: 252px; min-width: 252px;
          background: var(--dl-sidebar-bg, #f8fafc);
          border-right: 1px solid var(--dl-sidebar-border, #e2e8f0);
          position: fixed; top: 0; left: 0; height: 100vh;
          display: flex; flex-direction: column;
          z-index: 40;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s, border-color 0.25s;
        }

        /* Mobile sidebar overlay */
        .ml-sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 35;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .ml-sidebar-overlay.open {
          opacity: 1;
        }

        /* ── Mobile Responsive ── */
        @media (max-width: 767px) {
          .ml-mobile-header {
            display: flex;
          }

          .ml-sidebar {
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          }

          .ml-sidebar.open {
            transform: translateX(0);
          }

          .ml-sidebar-overlay {
            display: block;
          }

          .ml-main {
            margin-left: 0 !important;
            width: 100% !important;
            padding-top: 56px;
          }

          .ml-logo-wrap {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }

          /* Larger touch targets on mobile */
          .ml-link {
            min-height: 48px;
            padding: 0.75rem 0.875rem;
          }

          .ml-user {
            padding: 0.75rem 1rem;
          }
        }

        /* ── Logo ── */
        .ml-logo-wrap {
          padding: 1.4rem 1.4rem 1.1rem;
          border-bottom: 1px solid var(--dl-logo-border, #f0ede8);
          flex-shrink: 0;
          background: linear-gradient(180deg, var(--dl-accent-light, rgba(124,58,237,0.02)) 0%, transparent 100%);
        }


        /* ── Nav ── */
        .ml-nav-scroll {
          flex: 1; min-height: 0; overflow-y: auto;
          padding: 0.6rem 0.65rem;
          display: flex; flex-direction: column; gap: 0.1rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(124,58,237,0.15) transparent;
        }

        .ml-section-label {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dl-sidebar-section-label, #c4bfb8);
          padding: 0.7rem 0.6rem 0.25rem; font-family: 'DM Sans', sans-serif;
        }

        .ml-divider { height: 1px; background: var(--dl-sidebar-border, #f0ede8); margin: 0.35rem 0.5rem; }

        .ml-link {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0.7rem; border-radius: 10px;
          font-size: 0.82rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          color: var(--dl-sidebar-text, #64748b);
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
          border: 1px solid transparent; letter-spacing: -0.01em;
          will-change: transform, box-shadow;
        }

        .ml-link:hover {
          background: var(--dl-sidebar-hover-bg, #f8f7f4);
          color: var(--dl-sidebar-text-hover, #0f172a);
          transform: translateX(2px);
          box-shadow: 0 2px 8px var(--dl-accent-glow, rgba(124,58,237,0.06));
        }

        .ml-link.active {
          background: var(--dl-sidebar-active-bg, #f5f3ff);
          color: var(--dl-accent, #7c3aed);
          border-color: var(--dl-sidebar-active-border, #ede9fe);
          font-weight: 600;
          box-shadow: 0 2px 12px rgba(124,58,237,0.12);
        }

        .ml-link-icon {
          flex-shrink: 0; display: flex; align-items: center;
          color: var(--dl-sidebar-text, #94a3b8);
          transition: color 0.15s, transform 0.2s;
        }
        .ml-link:hover .ml-link-icon {
          color: var(--dl-sidebar-text-hover, #64748b);
          transform: scale(1.1);
        }
        .ml-link.active .ml-link-icon { color: var(--dl-accent, #7c3aed); }

        .ml-link-dot {
          margin-left: auto; width: 6px; height: 6px; border-radius: 50%;
          background: var(--dl-accent, #7c3aed);
          box-shadow: 0 0 0 2px var(--dl-sidebar-active-border, #ede9fe), 0 0 6px var(--dl-accent-glow, rgba(124,58,237,0.4));
        }

        /* ── Upgrade card ── */
        .ml-upgrade {
          margin: 0.6rem 0.75rem; padding: 0.85rem; border-radius: 14px;
          background: var(--dl-infinity-bg, linear-gradient(135deg,#faf5ff 0%,#fdf2f8 100%));
          border: 1px solid var(--dl-infinity-border, #e9d5ff);
          flex-shrink: 0; position: relative; overflow: hidden;
        }
        .ml-upgrade::before {
          content: ''; position: absolute; top: -30px; right: -30px;
          width: 80px; height: 80px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%);
          pointer-events: none;
        }
        .ml-upgrade-title {
          font-family: 'Clash Display', sans-serif; font-size: 0.73rem;
          font-weight: 600;
          background: linear-gradient(135deg, var(--dl-accent, #7c3aed), #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.2rem; position: relative;
        }
        .ml-upgrade-desc { font-size: 0.67rem; color: var(--dl-text-muted, #94a3b8); line-height: 1.5; margin-bottom: 0.55rem; position: relative; }
        .ml-upgrade-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--dl-accent, #7c3aed) 0%, #ec4899 50%, var(--dl-accent, #7c3aed) 100%);
          background-size: 200% 100%;
          animation: ml-btn-shimmer 4s ease-in-out infinite;
          color: white; font-size: 0.68rem; font-weight: 600;
          padding: 0.42rem; border-radius: 8px; border: none; cursor: default;
          letter-spacing: 0.02em; position: relative;
          box-shadow: 0 4px 12px rgba(124,58,237,0.25);
        }
        @keyframes ml-btn-shimmer {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* ── User ── */
        .ml-user {
          padding: 0.85rem 1rem; flex-shrink: 0;
          border-top: 1px solid var(--dl-accent-border, rgba(124,58,237,0.15));
          background: linear-gradient(0deg, var(--dl-accent-light, rgba(124,58,237,0.03)) 0%, var(--dl-user-bg, #fafaf8) 100%);
          display: flex; align-items: center; gap: 0.65rem;
          transition: background 0.25s;
        }
        .ml-user-name {
          font-size: 0.77rem; font-weight: 600;
          background: linear-gradient(135deg, var(--dl-accent, #7c3aed), #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'Clash Display', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ml-user-email {
          font-size: 0.65rem; color: var(--dl-text-muted, #94a3b8);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── Main ── */
        .ml-main {
          margin-left: 252px; width: calc(100% - 252px);
          min-height: 100vh; background: var(--dl-main-bg, #ffffff);
          transition: background 0.25s;
          animation: ml-page-in 0.35s cubic-bezier(0.4,0,0.2,1);
        }

        @media (max-width: 767px) {
          .ml-main {
            margin-left: 0;
            width: 100%;
            padding-top: 56px;
          }
        }
        @keyframes ml-page-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

      `}</style>

      <div className="ml-root">
        {/* Mobile Header with Hamburger */}
        <header className="ml-mobile-header">
          <button
            className="ml-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <BrandLogo href="/" size="compact" />
          <div style={{ width: 44 }} /> {/* Spacer for balance */}
        </header>

        {/* Sidebar Overlay (mobile) */}
        <div
          className={`ml-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <aside ref={sidebarRef} className={`ml-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="ml-logo-wrap">
            <BrandLogo href="/" size="compact" />
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 100, padding: '3px 10px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#7c3aed', letterSpacing: '0.02em' }}>Beta</span>
            </div>
          </div>

          <nav className="ml-nav-scroll" ref={navRef}>
            {NAV_SECTIONS.map((section, si) => (
              <div key={section.label}>
                {si > 0 && <div className="ml-divider" />}
                <div className="ml-section-label">{section.label}</div>
                {section.links.map(link => {
                  const active = pathname === link.href
                  return (
                    <Link key={link.href} href={link.href} className={`ml-link${active ? ' active' : ''}`}>
                      <span className="ml-link-icon">{link.icon}</span>
                      <span>{link.label}</span>
                      {active && <span className="ml-link-dot" />}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          <div className="ml-upgrade">
 <div className="ml-upgrade-title"> CalendaPro Infinity</div>
            <p className="ml-upgrade-desc">IA conversationnelle + automatisations avancées</p>
            <button className="ml-upgrade-btn">Bientôt disponible</button>
          </div>

          <div className="ml-user">
            <UserButton appearance={{ elements: { avatarBox: 'h-10 w-10 ring-2 ring-[var(--dl-accent-light,#ede9fe)] ring-offset-2' } }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ml-user-name">{userName}</div>
              <div className="ml-user-email">{userEmail}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                const newMode = activeMode === 'dark' ? 'light' : 'dark'
                setThemeMode(newMode)
                // Force direct DOM update for debugging
                const root = document.documentElement
                if (newMode === 'dark') {
                  root.classList.add('dark')
                  root.setAttribute('data-theme', 'dark')
                } else {
                  root.classList.remove('dark')
                  root.setAttribute('data-theme', 'light')
                }
              }}
              title={activeMode === 'dark' ? 'Mode clair' : 'Mode sombre'}
              style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: activeMode === 'dark' ? 'rgba(148,163,184,0.12)' : 'rgba(124,58,237,0.08)',
                border: '1px solid ' + (activeMode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(124,58,237,0.12)'),
                cursor: 'pointer', transition: 'all 0.2s',
                color: activeMode === 'dark' ? '#f59e0b' : '#7c3aed',
              }}
            >
              {activeMode === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
          </div>
        </aside>

        <main className="ml-main">{children}</main>
      </div>
    </>
  )
}
