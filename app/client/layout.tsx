'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLogo } from '@/components/BrandLogo'
import UserMenuButton from '@/components/UserMenuButton'

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

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  const navItems = [
    { href: '/client', label: 'Accueil' },
    { href: '/client/marketplace', label: 'Marketplace' },
    { href: '/client/profile', label: 'Mon profil' },
    { href: '/client/settings', label: 'Paramètres' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/client" className="flex items-center">
              <BrandLogo />
            </Link>
            <UserMenuButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-stone-200 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-xl transition-colors ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
