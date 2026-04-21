'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { BrandLogo } from '@/components/BrandLogo'
import { NAV_SECTIONS } from '../_nav/links'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export default function CompactLayout({ children, userName, userEmail }: Props) {
  const pathname = usePathname()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        .cmp-root {
          display: flex; min-height: 100vh;
          background: var(--dl-main-bg, #f1f5f9);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; padding-bottom: 22px;
        }

        /* ── Sidebar ── */
        .cmp-sidebar {
          width: 210px; min-width: 210px;
          background: var(--dl-sidebar-bg, #1e293b);
          border-right: 1px solid var(--dl-sidebar-border, #334155);
          position: fixed; top: 0; left: 0; height: 100vh;
          display: flex; flex-direction: column;
          z-index: 40;
          transition: background 0.25s;
        }

        /* ── Logo ── */
        .cmp-logo {
          padding: 0.75rem 0.9rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }

        /* ── Nav ── */
        .cmp-nav {
          flex: 1; min-height: 0; overflow-y: auto;
          padding: 0.4rem 0.5rem;
          display: flex; flex-direction: column; gap: 1px;
          scrollbar-width: none;
        }
        .cmp-nav::-webkit-scrollbar { display: none; }

        .cmp-link {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.38rem 0.6rem; border-radius: 6px;
          font-size: 0.76rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          color: rgba(148,163,184,0.85);
          transition: all 0.12s ease;
          white-space: nowrap; overflow: hidden;
          border: 1px solid transparent;
        }

        .cmp-link:hover {
          background: rgba(255,255,255,0.06);
          color: #f1f5f9;
        }

        .cmp-link.active {
          background: rgba(255,255,255,0.1);
          color: #f1f5f9;
          border-color: rgba(255,255,255,0.12);
          font-weight: 600;
        }

        .cmp-link svg { flex-shrink: 0; opacity: 0.7; }
        .cmp-link.active svg { opacity: 1; }
        .cmp-link:hover svg { opacity: 1; }

        .cmp-link-active-bar {
          margin-left: auto; width: 4px; height: 4px; border-radius: 50%;
          background: var(--dl-accent, #7c3aed);
          flex-shrink: 0;
        }

        .cmp-divider {
          height: 1px; background: rgba(255,255,255,0.06);
          margin: 0.3rem 0;
        }

        /* ── Status bar (top of sidebar) ── */
        .cmp-status {
          padding: 0.3rem 0.9rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .cmp-status-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #10b981;
          animation: blink-cmp 2s infinite;
        }
        @keyframes blink-cmp {
          0%,100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .cmp-status-text {
          font-size: 0.62rem; color: rgba(148,163,184,0.6);
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Infinity card ── */
        .cmp-infinity {
          margin: 0.4rem 0.5rem;
          padding: 0.6rem;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.06));
          border: 1px solid rgba(124,58,237,0.2);
          flex-shrink: 0;
        }
        .cmp-infinity-title {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--dl-accent, #7c3aed);
          margin-bottom: 0.1rem;
        }
        .cmp-infinity-desc {
          font-size: 0.58rem;
          color: rgba(148,163,184,0.7);
          line-height: 1.3;
          margin-bottom: 0.3rem;
        }
        .cmp-infinity-btn {
          width: 100%;
          background: rgba(124,58,237,0.25);
          color: rgba(255,255,255,0.9);
          font-size: 0.58rem;
          font-weight: 600;
          padding: 0.25rem;
          border-radius: 5px;
          border: 1px solid rgba(124,58,237,0.35);
          cursor: default;
          letter-spacing: 0.02em;
        }

        /* ── User ── */
        .cmp-user {
          padding: 0.6rem 0.75rem; flex-shrink: 0;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; gap: 0.5rem;
          overflow: hidden;
        }
        .cmp-user-name {
          font-size: 0.72rem; font-weight: 600; color: #e2e8f0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-family: 'DM Sans', sans-serif;
        }
        .cmp-user-email {
          font-size: 0.6rem; color: rgba(148,163,184,0.6);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .cmp-section-label {
          font-size: 0.55rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.4); padding: 0.6rem 0.6rem 0.2rem;
        }

        /* ── VS Code style status bar ── */
        .cmp-statusbar {
          position: fixed; bottom: 0; left: 0; right: 0; height: 22px;
          background: #7c3aed; color: rgba(255,255,255,0.9);
          display: flex; align-items: center; gap: 1rem; padding: 0 0.5rem;
          z-index: 60; font-size: 0.6rem; font-family: 'DM Sans', sans-serif;
        }
        .cmp-sb-item {
          display: flex; align-items: center; gap: 4px;
          padding: 0 6px; height: 22px; cursor: default;
          transition: background 0.1s;
        }
        .cmp-sb-item:hover { background: rgba(255,255,255,0.15); }
        .cmp-sb-sep { opacity: 0.3; margin: 0 2px; }
        .cmp-sb-right { margin-left: auto; display: flex; align-items: center; }

        /* ── Main ── */
        .cmp-main {
          margin-left: 210px; width: calc(100% - 210px);
          min-height: 100vh;
          background: var(--dl-main-bg, #f1f5f9);
          transition: background 0.25s;
          animation: cmp-page-in 0.15s ease;
        }
        @keyframes cmp-page-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className="cmp-root">
        <aside className="cmp-sidebar">
          <div className="cmp-logo">
            <BrandLogo href="/" size="compact" variant="dark" />
          </div>
          <div className="cmp-status">
            <div className="cmp-status-dot" />
            <span className="cmp-status-text">Développement</span>
          </div>

          <nav className="cmp-nav">
            {NAV_SECTIONS.map((section, si) => (
              <div key={section.label}>
                {si > 0 && <div className="cmp-divider" />}
                <div className="cmp-section-label">{section.label}</div>
                {section.links.map(link => {
                  const active = pathname === link.href
                  return (
                    <Link key={link.href} href={link.href} className={`cmp-link${active ? ' active' : ''}`}>
                      {link.icon}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{link.short}</span>
                      {active && <span className="cmp-link-active-bar" />}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Infinity card */}
          <div className="cmp-infinity">
            <div className="cmp-infinity-title">✦ Infinity</div>
            <p className="cmp-infinity-desc">IA + automatisations</p>
            <button className="cmp-infinity-btn">Bientôt</button>
          </div>

          <div className="cmp-user">
            <UserButton appearance={{ elements: { avatarBox: 'h-7 w-7' } }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cmp-user-name">{userName}</div>
              <div className="cmp-user-email">{userEmail}</div>
            </div>
          </div>
        </aside>

        <main className="cmp-main">{children}</main>

        {/* VS Code-style status bar */}
        <div className="cmp-statusbar">
          <div className="cmp-sb-item">
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
            <span>DEV</span>
          </div>
          <span className="cmp-sb-sep">|</span>
          <div className="cmp-sb-item">⌘K Commandes</div>
          <div className="cmp-sb-item">⌘N Nouveau</div>
          <div className="cmp-sb-item">⌘/ Recherche</div>
          <div className="cmp-sb-right">
            <div className="cmp-sb-item">{userName.split(' ')[0]}</div>
            <span className="cmp-sb-sep">|</span>
            <div className="cmp-sb-item">{clock}</div>
            <span className="cmp-sb-sep">|</span>
            <div className="cmp-sb-item">Compact</div>
          </div>
        </div>
      </div>
    </>
  )
}
