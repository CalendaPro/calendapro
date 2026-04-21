'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ClientNavbar from './_components/Navbar'
import ClientSidebar from './_components/Sidebar'
import SidebarUserCard from './_components/SidebarUserCard'
import { ClientErrorBoundary } from './_components/ErrorBoundary'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/login')
    }
  }, [user, isLoaded, router])

  if (pathname === '/client/onboarding') {
    return <>{children}</>
  }

  if (!isLoaded) {
    return (
      <div className="cl-root min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '2.5px solid var(--cl-accent-soft)', borderTopColor: 'var(--cl-accent)' }}
          />
          <p className="text-sm" style={{ color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .cl-root { font-family: 'DM Sans', system-ui, sans-serif; }

        /* ── Sidebar & Navbar ── */
        .glass-sidebar {
          background: var(--cl-glass-sidebar);
          border-right: 1px solid var(--cl-border);
          transition: background 0.3s, border-color 0.3s;
        }
        .glass-navbar {
          background: var(--cl-glass-navbar);
          backdrop-filter: blur(16px) saturate(1.8);
          -webkit-backdrop-filter: blur(16px) saturate(1.8);
          border-bottom: 1px solid var(--cl-border);
          transition: background 0.3s, border-color 0.3s;
        }

        /* ── White Glass Card (Glassmorphism Blanc) ── */
        .glass-card-white {
          background: var(--cl-surface);
          border: 1px solid var(--cl-border);
          border-radius: 20px;
          box-shadow: var(--cl-shadow-soft);
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .glass-card-white:hover {
          box-shadow: var(--cl-shadow-xl);
          border-color: var(--cl-accent-20);
          transform: translateY(-3px);
        }

        /* ── Glow CTA button ── */
        .btn-glow {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .btn-glow:hover {
          box-shadow: 0 0 28px rgba(79,70,229,0.45), 0 8px 32px rgba(79,70,229,0.2) !important;
          transform: translateY(-2px) !important;
        }

        /* ── Skeleton shimmer ── */
        @keyframes skel-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .skel {
          background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
          background-size: 1200px 100%;
          animation: skel-shimmer 1.8s infinite linear;
          border-radius: 6px;
        }
      `}</style>

      <div className="cl-root min-h-screen">
        {/* ── Navbar ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
          <ClientNavbar />
        </div>

        {/* ── Body ── */}
        <div className="flex">
          <aside
            className="hidden md:flex flex-col flex-shrink-0 glass-sidebar"
            style={{
              width: 252,
              minWidth: 252,
              position: 'sticky',
              top: 64,
              height: 'calc(100vh - 64px)',
              overflowY: 'auto',
            }}
          >
            <ClientSidebar />
            <SidebarUserCard />
          </aside>

          <AnimatePresence mode="wait" initial={false}>
            <ClientErrorBoundary>
              <motion.main
                key={pathname}
                initial={{ opacity: 0, scale: 0.985, y: 10 }}
                animate={{ opacity: 1, scale: 1,     y: 0  }}
                exit={{    opacity: 0, scale: 0.985, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 min-w-0 p-6 md:p-8"
              >
                {children}
              </motion.main>
            </ClientErrorBoundary>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
