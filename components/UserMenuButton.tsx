'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useState } from 'react'

export default function UserMenuButton() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 hover:border-violet-400 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-medium">
          {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
        </div>
        <span className="text-sm font-medium text-stone-700 hidden sm:block">
          {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-20">
            <div className="px-4 py-2 border-b border-stone-100">
              <p className="text-sm font-medium text-stone-900">
                {user?.fullName || 'Utilisateur'}
              </p>
              <p className="text-xs text-stone-500 truncate">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </>
      )}
    </div>
  )
}
