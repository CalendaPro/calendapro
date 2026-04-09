'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ClientMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'coiffure', label: 'Coiffure' },
    { value: 'coaching', label: 'Coaching' },
    { value: 'photographie', label: 'Photographie' },
    { value: 'beaute', label: 'Beauté' },
    { value: 'sante', label: 'Santé' },
    { value: 'sport', label: 'Sport' },
    { value: 'massage', label: 'Massage' },
  ]

  // TODO: Fetch actual profiles from Supabase
  const mockProfiles = [
    {
      id: '1',
      username: 'jdupont',
      full_name: 'Jean Dupont',
      category: 'coiffure',
      location: 'Paris',
      rating: 4.8,
      avatar: null,
    },
    {
      id: '2',
      username: 'mmartin',
      full_name: 'Marie Martin',
      category: 'coaching',
      location: 'Lyon',
      rating: 4.9,
      avatar: null,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Trouvez votre professionnel
        </h1>
        <p className="text-stone-600">
          Découvrez les meilleurs professionnels de votre région
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par catégorie, ville ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            Rechercher
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProfiles.map((profile) => (
          <Link
            key={profile.id}
            href={`/${profile.username}`}
            className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-violet-400 transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-semibold text-xl">
                {profile.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-stone-900">{profile.full_name}</h3>
                <p className="text-sm text-stone-600 capitalize">{profile.category}</p>
                <p className="text-sm text-stone-500">{profile.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-stone-900">{profile.rating}</span>
            </div>
          </Link>
        ))}
      </div>

      {mockProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-600">Aucun résultat trouvé</p>
        </div>
      )}
    </div>
  )
}
