'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { BrandLogo } from '@/components/BrandLogo'
import { ALL_LINKS } from '../_nav/links'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export default function DarkProLayout({ children, userName, userEmail }: Props) {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&display=swap');

        .dp-root {
          display: flex; flex-direction: column;
          min-height: 100vh; background: #0f172a;
          font-family: 'DM Sans', sans-serif;
          position: relative;
        }

        /* ── Topbar ── */
        .dp-topbar {
          position: sticky; top: 0; z-index: 50;
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
          display: flex; align-items: center;
          padding: 0 1.5rem; height: 56px; gap: 1.5rem;
        }

        .dp-logo-area {
          display: flex; align-items: center; gap: 0.75rem;
          flex-shrink: 0; padding-right: 1.5rem;
          border-right: 1px solid rgba(124,58,237,0.2);
        }

        /* ── Nav links ── */
        .dp-nav {
          display: flex; align-items: center; gap: 2px;
          flex: 1; overflow-x: auto; scrollbar-width: none;
        }
        .dp-nav::-webkit-scrollbar { display: none; }

        .dp-nav-link {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.65rem; border-radius: 6px;
          font-size: 0.78rem; font-weight: 500;
          font-family: 'Space Grotesk', sans-serif;
          text-decoration: none; white-space: nowrap;
          color: rgba(148,163,184,0.7);
          transition: all 0.15s ease;
          border: 1px solid transparent;
          position: relative; letter-spacing: 0.01em;
        }

        .dp-nav-link:hover {
          color: #a78bfa;
          background: rgba(124,58,237,0.08);
          border-color: rgba(124,58,237,0.15);
        }

        .dp-nav-link.active {
          color: #a78bfa; font-weight: 600;
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.25);
        }

        .dp-nav-link svg { flex-shrink: 0; opacity: 0.6; }
        .dp-nav-link.active svg { opacity: 1; }

        .dp-nav-divider {
          width: 1px; height: 18px;
          background: rgba(124,58,237,0.2);
          margin: 0 0.35rem; flex-shrink: 0;
        }

        /* ── User area ── */
        .dp-user-area {
          display: flex; align-items: center; gap: 0.75rem;
          flex-shrink: 0; padding-left: 1rem;
          border-left: 1px solid rgba(124,58,237,0.2);
          margin-left: auto;
        }
        .dp-user-name {
          font-size: 0.75rem; font-weight: 600; color: #a78bfa;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .dp-dev-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
          border-radius: 100px; padding: 2px 8px;
        }
        .dp-dev-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #10b981;
        }
        .dp-dev-label { font-size: 0.6rem; font-weight: 600; color: #34d399; letter-spacing: 0.04em; }

        /* ── Content ── */
        .dp-content {
          flex: 1; padding: 2rem 2.5rem;
          max-width: 1400px; width: 100%; margin: 0 auto; box-sizing: border-box;
          position: relative; z-index: 2;
          animation: dp-page-in 0.3s ease;
        }
        @keyframes dp-page-in { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }

        @media (max-width: 900px) { .dp-content { padding: 1.25rem 1rem; } }

      `}</style>

      <div className="dp-root">
        <header className="dp-topbar">
          <div className="dp-logo-area">
            <BrandLogo href="/" size="compact" variant="dark" />
          </div>

          <nav className="dp-nav">
            {ALL_LINKS.map((link, i) => {
              const active = pathname === link.href
              const showDivider = i === 3 || i === 8
              return (
                <React.Fragment key={link.href}>
                  {showDivider && <div className="dp-nav-divider" />}
                  <Link href={link.href} className={`dp-nav-link${active ? ' active' : ''}`}>
                    {link.icon}
                    <span>{link.short}</span>
                  </Link>
                </React.Fragment>
              )
            })}
          </nav>

          <div className="dp-user-area">
            <div className="dp-dev-badge">
              <div className="dp-dev-dot" />
              <span className="dp-dev-label">DEV</span>
            </div>
            <div className="dp-user-name">{userName.split(' ')[0]}</div>
            <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
          </div>
        </header>

        <main className="dp-content">{children}</main>
      </div>
    </>
  )
}
