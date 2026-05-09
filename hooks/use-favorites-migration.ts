// ═══════════════════════════════════════════════════════════════════════════════
// #32 - Migration des favoris localStorage → Supabase
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface LocalFavorite {
  pro_id: string
  pro_username: string
  added_at: string
}

/**
 * Hook pour migrer les favoris du localStorage vers Supabase
 * À utiliser dans le layout client ou la page d'accueil
 */
export function useFavoritesMigration() {
  const { isSignedIn, userId } = useAuth()
  const [migrated, setMigrated] = useState(false)
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    // Attendre que l'utilisateur soit connecté
    if (!isSignedIn || !userId || migrated) return

    const migrateFavorites = async () => {
      try {
        // Vérifier si on a déjà migré
        const migrationKey = `favorites_migrated_${userId}`
        if (localStorage.getItem(migrationKey)) return

        // Récupérer les favoris du localStorage
        const localFavs: LocalFavorite[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('favorite_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}')
              if (item.pro_id && item.pro_username) {
                localFavs.push(item)
              }
            } catch {
              // Ignore invalid items
            }
          }
        }

        if (localFavs.length === 0) {
          localStorage.setItem(migrationKey, 'true')
          return
        }

        setMigrating(true)
        console.log(`[Favorites Migration] Found ${localFavs.length} local favorites to migrate`)

        // Migrer chaque favori vers Supabase
        let successCount = 0
        for (const fav of localFavs) {
          try {
            const res = await fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pro_id: fav.pro_id,
                pro_username: fav.pro_username,
              }),
            })
            if (res.ok) successCount++
          } catch {
            // Continue on error
          }
        }

        // Marquer comme migré
        localStorage.setItem(migrationKey, 'true')
        setMigrated(true)
        setMigrating(false)

        console.log(`[Favorites Migration] Migrated ${successCount}/${localFavs.length} favorites`)

        // Nettoyer le localStorage des anciennes clés
        localFavs.forEach(fav => {
          localStorage.removeItem(`favorite_${fav.pro_id}`)
        })
      } catch (err) {
        console.error('[Favorites Migration] Error:', err)
        setMigrating(false)
      }
    }

    migrateFavorites()
  }, [isSignedIn, userId, migrated])

  return { migrated, migrating }
}
