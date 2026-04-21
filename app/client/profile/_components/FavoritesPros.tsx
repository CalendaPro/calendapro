'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Favorite = {
  pro_id: string
  pro_username: string
  profile: {
    full_name: string
    category: string | null
    city: string | null
  } | null
}

export default function FavoritesPros() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => { setFavorites(Array.isArray(data) ? data.slice(0, 5) : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Favoris</h2>
        <Link href="/client/favorites" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
          Voir tout
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400 mb-3">Aucun favori pour le moment</p>
          <Link href="/client/marketplace" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            Explorer la marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map(fav => (
            <Link
              key={fav.pro_id}
              href={`/client/${fav.pro_username}`}
              className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-violet-300 hover:bg-violet-50/40 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {(fav.profile?.full_name ?? fav.pro_username).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {fav.profile?.full_name ?? fav.pro_username}
                </p>
                {(fav.profile?.category || fav.profile?.city) && (
                  <p className="text-xs text-slate-400 truncate capitalize">
                    {[fav.profile.category, fav.profile.city].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
