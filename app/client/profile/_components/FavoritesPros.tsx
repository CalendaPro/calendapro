'use client'

import Link from 'next/link'

type FavoritePro = {
  id: string
  username: string
  full_name: string
  category: string
  city: string
  avatar_url: string | null
}

export default function FavoritesPros() {
  // TODO: Fetch actual favorites from API
  const favorites: FavoritePro[] = [
    {
      id: '1',
      username: 'harri_abdel',
      full_name: 'Harri Abdel',
      category: 'barbier',
      city: 'Lyon',
      avatar_url: null,
    },
    {
      id: '2',
      username: 'coach_fitness',
      full_name: 'Coach Fitness',
      category: 'sport',
      city: 'Paris',
      avatar_url: null,
    },
    {
      id: '3',
      username: 'photographe_pro',
      full_name: 'Photographe Pro',
      category: 'photographie',
      city: 'Marseille',
      avatar_url: null,
    },
  ]

  if (favorites.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Mes professionnels favoris</h2>
        <p className="text-stone-500 text-center py-8">Aucun favori pour le moment</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Mes professionnels favoris</h2>
      <div className="space-y-3">
        {favorites.map((favorite) => (
          <Link
            key={favorite.id}
            href={`/client/${favorite.username}`}
            className="flex items-center gap-3 p-3 border border-stone-200 rounded-xl hover:border-violet-400 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-semibold">
              {favorite.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-stone-900">{favorite.full_name}</div>
              <div className="text-sm text-stone-500 capitalize">{favorite.category} · {favorite.city}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
        ))}
      </div>
      {favorites.length > 3 && (
        <button className="w-full mt-4 px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:border-violet-400 transition-colors text-sm">
          +{favorites.length - 3} autres favoris
        </button>
      )}
    </div>
  )
}
