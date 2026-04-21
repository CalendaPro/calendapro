'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { NAV_SECTIONS } from '../_nav/links'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export default function MinimalistLayout({ children, userName, userEmail }: Props) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [zen, setZen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setZen(v => !v) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sidebarW = zen ? 0 : expanded ? 220 : 64

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .min-root {
          display: flex; min-height: 100vh;
          background: #ffffff;
          font-family: 'DM Sans', sans-serif;
          scroll-behavior: smooth;
        }

        /* ── Sidebar ── */
        .min-sidebar {
          position: fixed; top: 0; left: 0; height: 100vh;
          display: flex; flex-direction: column;
          background: #fdfdfd;
          border-right: 1px solid #f0f0f0;
          z-index: 40; overflow: hidden;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
        }

        /* ── Toggle ── */
        .min-toggle {
          display: flex; align-items: center; justify-content: center;
          height: 60px; flex-shrink: 0;
          cursor: pointer; background: transparent;
          border: none; border-bottom: 1px solid #f5f5f5;
          width: 100%; transition: background 0.2s;
        }
        .min-toggle:hover { background: #fafafa; }
        .min-toggle svg { color: #c4c4c4; transition: color 0.2s, transform 0.3s; }
        .min-toggle:hover svg { color: #000; transform: rotate(90deg); }

        /* ── Nav ── */
        .min-nav {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 1rem 0;
          display: flex; flex-direction: column; gap: 0;
          scrollbar-width: none;
        }
        .min-nav::-webkit-scrollbar { display: none; }

        .min-link {
          display: flex; align-items: center;
          height: 48px; padding: 0;
          text-decoration: none; color: #c0c0c0;
          transition: color 0.25s ease, background 0.25s ease;
          position: relative; white-space: nowrap; overflow: hidden;
          flex-shrink: 0;
        }
        .min-link:hover { color: #000000; background: #f8f8f8; }
        .min-link.active { color: #000000; background: transparent; }
        .min-link.active::after {
          content: '';
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 1px; height: 20px; background: #000000;
        }

        .min-link-icon {
          width: 64px; min-width: 64px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .min-link-label {
          font-size: 0.78rem; font-weight: 300; letter-spacing: 0.06em;
          text-transform: uppercase; flex: 1; padding-right: 16px;
          overflow: hidden; text-overflow: ellipsis;
          font-family: 'DM Sans', sans-serif;
        }

        .min-link-tooltip {
          position: absolute; left: 72px; top: 50%; transform: translateY(-50%);
          background: #000; color: #fff;
          font-size: 0.65rem; font-weight: 400; letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 12px; border-radius: 2px;
          pointer-events: none; z-index: 100; white-space: nowrap;
          opacity: 0; transition: opacity 0.15s ease;
        }
        .min-link:hover .min-link-tooltip { opacity: 1; }

        /* ── User ── */
        .min-user {
          flex-shrink: 0; padding: 1rem;
          border-top: 1px solid #f0f0f0;
          display: flex; align-items: center; gap: 0.75rem; overflow: hidden;
        }
        .min-user-name {
          font-size: 0.75rem; font-weight: 400; color: #333;
          font-family: 'Playfair Display', serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .min-user-email {
          font-size: 0.6rem; color: #bbb; font-weight: 300;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── Zen hint ── */
        .min-zen-hint {
          flex-shrink: 0; padding: 0.5rem;
          text-align: center;
          font-size: 0.55rem; color: #d0d0d0; letter-spacing: 0.1em; text-transform: uppercase;
          border-top: 1px solid #f5f5f5;
          cursor: pointer; transition: color 0.2s;
        }
        .min-zen-hint:hover { color: #666; }

        /* ── Zen mode bar ── */
        .min-zen-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 60;
          height: 36px; background: rgba(255,255,255,0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #f0f0f0;
          display: flex; align-items: center; justify-content: center; gap: 2rem;
          padding: 0 2rem;
        }
        .min-zen-bar-link {
          font-size: 0.65rem; font-weight: 300; letter-spacing: 0.1em;
          text-transform: uppercase; color: #bbb;
          text-decoration: none; transition: color 0.2s;
        }
        .min-zen-bar-link:hover, .min-zen-bar-link.active { color: #000; }
        .min-zen-close {
          position: absolute; right: 1rem; background: none; border: none;
          font-size: 0.6rem; color: #bbb; cursor: pointer; letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Main ── */
        .min-main {
          min-height: 100vh; background: #ffffff;
          transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1);
          animation: min-page-in 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes min-page-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .min-inner {
          max-width: 900px; margin: 0 auto;
          padding: 5rem 3rem;
        }

        /* ── Typography overrides for minimalist ── */
        .min-main h1 {
          font-family: 'Playfair Display', serif !important;
          font-weight: 400 !important; letter-spacing: -0.02em !important;
        }
        .min-main h2, .min-main h3 {
          font-family: 'DM Sans', sans-serif !important; font-weight: 300 !important;
          letter-spacing: 0.04em !important; text-transform: uppercase !important;
        }

        @media (max-width: 768px) {
          .min-inner { padding: 2rem 1.5rem; }
        }
      `}</style>

      <div className="min-root">
        {/* Zen mode top nav bar */}
        {zen && (
          <div className="min-zen-bar">
            {NAV_SECTIONS.flatMap(s => s.links).map(link => (
              <Link key={link.href} href={link.href} className={`min-zen-bar-link${pathname === link.href ? ' active' : ''}`}>
                {link.short}
              </Link>
            ))}
            <button className="min-zen-close" onClick={() => setZen(false)}>⌘Z exit</button>
          </div>
        )}

        {/* Sidebar (hidden in zen mode) */}
        <aside className="min-sidebar" style={{ width: sidebarW, opacity: zen ? 0 : 1, pointerEvents: zen ? 'none' : 'auto' }}>
          <button type="button" className="min-toggle" onClick={() => setExpanded(e => !e)} title={expanded ? 'Réduire' : 'Développer'}>
            {expanded ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>

          <nav className="min-nav">
            {NAV_SECTIONS.flatMap(s => s.links).map(link => {
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href} className={`min-link${active ? ' active' : ''}`}>
                  <span className="min-link-icon">{link.icon}</span>
                  {expanded && <span className="min-link-label">{link.label}</span>}
                  {!expanded && <span className="min-link-tooltip">{link.label}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="min-user">
            <UserButton appearance={{ elements: { avatarBox: 'h-7 w-7' } }} />
            {expanded && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="min-user-name">{userName}</div>
                <div className="min-user-email">{userEmail}</div>
              </div>
            )}
          </div>

          <div className="min-zen-hint" onClick={() => setZen(true)} title="⌘Z">
            {expanded ? 'Mode zen · ⌘Z' : '⌘Z'}
          </div>
        </aside>

        <main className="min-main" style={{ marginLeft: zen ? 0 : sidebarW, paddingTop: zen ? '36px' : 0 }}>
          <div className="min-inner">{children}</div>
        </main>
      </div>
    </>
  )
}
