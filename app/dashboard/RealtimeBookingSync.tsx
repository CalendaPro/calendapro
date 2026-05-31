'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

/**
 * Composant invisible qui écoute les nouveaux bookings via Supabase Realtime
 * et déclenche un router.refresh() pour rafraîchir les données du dashboard.
 * Rendu côté serveur : ajouter ce composant dans app/dashboard/page.tsx
 */
export function RealtimeBookingSync() {
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`dashboard-sync-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `pro_id=eq.${user.id}`,
      }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, router])

  return null
}
