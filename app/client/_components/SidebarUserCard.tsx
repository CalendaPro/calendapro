'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'

export default function SidebarUserCard() {
  const { user } = useUser()
  const { signOut } = useClerk()

  const initial =
    user?.firstName?.charAt(0) ||
    user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ||
    'U'

  return (
    <div
      style={{
        padding: '0.85rem 1rem',
        borderTop: '1px solid var(--cl-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        background: 'var(--cl-surface)',
        flexShrink: 0,
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4F46E5, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '0.7rem',
          flexShrink: 0,
          boxShadow: '0 0 0 2px var(--cl-surface), 0 0 0 4px var(--cl-accent-soft)',
        }}
      >
        {initial.toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.77rem',
          fontWeight: 600,
          color: 'var(--cl-text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.3s',
        }}>
          {user?.firstName || user?.fullName || 'Utilisateur'}
        </p>
        <p style={{
          fontSize: '0.65rem',
          color: 'var(--cl-text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.3s',
        }}>
          {user?.emailAddresses?.[0]?.emailAddress}
        </p>
      </div>
      <button
        onClick={() => signOut({ redirectUrl: '/' })}
        title="Déconnexion"
        style={{
          flexShrink: 0,
          color: 'var(--cl-text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
          display: 'flex',
          transition: 'color 0.2s, background 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#ef4444'
          e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--cl-text-muted)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <LogOut size={15} strokeWidth={1.5} />
      </button>
    </div>
  )
}
