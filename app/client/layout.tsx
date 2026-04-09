'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ClientNavbar from './_components/Navbar'
import ClientSidebar from './_components/Sidebar'
import SidebarUserCard from './_components/SidebarUserCard'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/login')
    }
  }, [user, isLoaded, router])

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <ClientNavbar />
      <div className="flex">
        <aside className="w-64 bg-white border-r border-stone-200 min-h-[calc(100vh-4rem)] sticky top-16 flex flex-col">
          <ClientSidebar />
          <SidebarUserCard />
        </aside>
        <main className="flex-1 p-8 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </div>
  )
}
