'use client'

import { useUser } from '@clerk/nextjs'
import { useClerk } from '@clerk/nextjs'

export default function SidebarUserCard() {
  const { user } = useUser()
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <div className="p-4 border-t border-stone-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-medium flex-shrink-0">
          {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 truncate">
            {user?.firstName || user?.fullName || 'Utilisateur'}
          </p>
          <p className="text-xs text-stone-500 truncate">
            {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors text-left flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Déconnexion
      </button>
    </div>
  )
}
