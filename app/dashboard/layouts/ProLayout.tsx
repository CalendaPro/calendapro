'use client'

import React, { useEffect, useState } from 'react'
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

export default function ProLayout({ children, userName, userEmail }: Props) {
  const pathname = usePathname()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .pro-root {
          display: flex; flex-direction: column;
          min-height: 100vh; background: #f8fafc;
          font-family: 'IBM Plex Mono', monospace;
          position: relative;
        }

        /* ── Top bar ── */
        .pro-topbar {
          position: sticky; top: 0; z-index: 50;
          background: #ffffff;
          border-bottom: 2px solid #0f172a;
          display: flex; align-items: center;
          padding: 0 1.5rem; height: 52px; gap: 1rem;
        }

        .pro-logo-area {
          display: flex; align-items: center; gap: 0.75rem;
          flex-shrink: 0; padding-right: 1.5rem;
          border-right: 1px solid #e2e8f0;
        }

        .pro-clock {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem; font-weight: 500;
          color: #0f172a; letter-spacing: 0.04em;
          padding: 2px 8px;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 3px; flex-shrink: 0;
        }

        /* ── Nav links ── */
        .pro-nav {
          display: flex; align-items: center; gap: 0;
          flex: 1; overflow-x: auto; scrollbar-width: none;
        }
        .pro-nav::-webkit-scrollbar { display: none; }

        .pro-nav-link {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0 0.9rem; height: 52px;
          font-size: 0.7rem; font-weight: 500;
          font-family: 'IBM Plex Mono', monospace;
          text-decoration: none; white-space: nowrap;
          color: #475569; letter-spacing: 0.04em;
          transition: color 0.1s, background 0.1s;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          text-transform: uppercase;
        }

        .pro-nav-link:hover { color: #0f172a; background: #f8fafc; }

        .pro-nav-link.active {
          color: #0f172a; font-weight: 600;
          border-bottom-color: #0f172a;
          background: #f8fafc;
        }

        .pro-nav-link svg { flex-shrink: 0; opacity: 0.6; }
        .pro-nav-link.active svg { opacity: 1; }

        .pro-nav-divider {
          width: 1px; height: 20px; background: #e2e8f0;
          margin: 0 0.25rem; flex-shrink: 0;
        }

        /* ── User area ── */
        .pro-user-area {
          display: flex; align-items: center; gap: 0.75rem;
          flex-shrink: 0; padding-left: 1rem;
          border-left: 1px solid #e2e8f0; margin-left: auto;
        }
        .pro-user-name {
          font-size: 0.7rem; font-weight: 600; color: #0f172a;
          font-family: 'IBM Plex Mono', monospace;
          white-space: nowrap; letter-spacing: 0.02em;
        }

        /* ── Dev badge ── */
        .pro-dev-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 3px; padding: 2px 7px;
          font-family: 'IBM Plex Mono', monospace;
        }
        .pro-dev-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #10b981;
          animation: pro-blink 1.5s steps(1) infinite;
        }
        @keyframes pro-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        .pro-dev-label { font-size: 0.6rem; font-weight: 600; color: #059669; letter-spacing: 0.04em; }

        /* ── Content ── */
        .pro-content {
          flex: 1; padding: 2rem 2.5rem;
          max-width: 1400px; width: 100%; margin: 0 auto; box-sizing: border-box;
          animation: pro-page-in 0.2s ease;
        }
        @keyframes pro-page-in { from { opacity: 0; } to { opacity: 1; } }


        @media (max-width: 900px) {
          .pro-content { padding: 1.25rem 1rem; }
          .pro-shortcuts { display: none; }
        }
      `}</style>

      <div className="pro-root">
        <header className="pro-topbar">
          <div className="pro-logo-area">
            <BrandLogo href="/" size="compact" />
          </div>

          <div className="pro-clock">{clock || '––:––:––'}</div>

          <nav className="pro-nav">
            {ALL_LINKS.map((link, i) => {
              const active = pathname === link.href
              const showDivider = i === 3 || i === 8
              return (
                <React.Fragment key={link.href}>
                  {showDivider && <div className="pro-nav-divider" />}
                  <Link href={link.href} className={`pro-nav-link${active ? ' active' : ''}`}>
                    {link.icon}
                    <span>{link.short}</span>
                  </Link>
                </React.Fragment>
              )
            })}
          </nav>

          <div className="pro-user-area">
            <div className="pro-dev-badge">
              <div className="pro-dev-dot" />
              <span className="pro-dev-label">DEV</span>
            </div>
            <div className="pro-user-name">{userName.split(' ')[0].toUpperCase()}</div>
            <UserButton appearance={{ elements: { avatarBox: 'h-7 w-7' } }} />
          </div>
        </header>

        <main className="pro-content">{children}</main>
      </div>
    </>
  )
}
