'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Favorite = {
  pro_id: string
  pro_username: string
  created_at: string
  profile: {
    full_name: string
    bio: string | null
    category: string | null
    city: string | null
    avatar_url: string | null
  } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  barbier: 'Barbier',
  coach: 'Coach',
  photo: 'Photographe',
  freelance: 'Freelance',
  therapeute: 'Therapeute',
  sport: 'Coach sportif',
  consultant: 'Consultant',
  creatif: 'Creatif',
}

function FavoriteCard({ fav, onRemove }: { fav: Favorite; onRemove: (proId: string, proUsername: string) => void }) {
  const [removing, setRemoving] = useState(false)
  const initial = fav.profile?.full_name?.charAt(0) ?? fav.pro_username.charAt(0)

  const handleRemove = async () => {
    setRemoving(true)
    await onRemove(fav.pro_id, fav.pro_username)
    setRemoving(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {fav.profile?.avatar_url ? (
              <img
                src={fav.profile.avatar_url}
                alt={fav.profile.full_name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-bold text-xl">
                {initial.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {fav.profile?.full_name ?? fav.pro_username}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {fav.profile?.category && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {CATEGORY_LABELS[fav.profile.category] ?? fav.profile.category}
                    </span>
                  )}
                  {fav.profile?.city && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {fav.profile.city}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                title="Retirer des favoris"
              >
                <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {fav.profile?.bio && (
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{fav.profile.bio}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <Link
            href={`/client/${fav.pro_username}`}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white text-sm font-medium rounded-lg text-center hover:opacity-90 transition-opacity"
          >
            Prendre RDV
          </Link>
          <Link
            href={`/client/${fav.pro_username}`}
            className="py-2 px-3 bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-violet-300 transition-colors"
          >
            Voir profil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => {
        setFavorites(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleRemove = async (proId: string, proUsername: string) => {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pro_id: proId, pro_username: proUsername }),
    })
    const data = await res.json()
    if (data.action === 'removed') {
      setFavorites(prev => prev.filter(f => f.pro_id !== proId))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes favoris</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? '' : `${favorites.length} professionnel${favorites.length !== 1 ? 's' : ''} sauvegarde${favorites.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-1">Aucun favori</p>
          <p className="text-slate-400 text-sm mb-4">Ajoutez des pros a vos favoris depuis la marketplace</p>
          <Link
            href="/client/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Explorer la marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map(fav => (
            <FavoriteCard key={fav.pro_id} fav={fav} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  )
}
