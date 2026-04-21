'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import BookingModal from '../_components/BookingModal'

type Service = { id: string; name: string; duration: number; price: number }
type Review = { id: string; client_id: string; rating: number; comment: string | null; created_at: string }

type ProProfile = {
  id: string
  username: string
  full_name: string
  bio: string | null
  category: string | null
  city: string | null
  plan: string
  avatar_url: string | null
  rating: number | null
  review_count: number
  services: Service[]
  reviews: Review[]
  has_busy_slots?: boolean
}

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={i <= Math.round(rating) ? 0 : 1.5}
          className={i <= Math.round(rating) ? 'text-amber-400' : 'text-slate-300'}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

export default function ProDetailPage() {
  const params = useParams()
  const username = params.username as string

  const [pro, setPro] = useState<ProProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch(`/api/public/${username}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (data) { setPro(data); setLoading(false) }
      })
      .catch(() => { setNotFound(true); setLoading(false) })

    // Check if already a favorite
    fetch('/api/favorites')
      .then(r => r.json())
      .then((favs: { pro_username: string }[]) => {
        if (Array.isArray(favs)) setIsFav(favs.some(f => f.pro_username === username))
      })
      .catch(() => {})
  }, [username])

  const toggleFavorite = async () => {
    if (!pro || favLoading) return
    setFavLoading(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pro_id: pro.id, pro_username: pro.username }),
      })
      const data = await res.json()
      if (data.action === 'added') setIsFav(true)
      if (data.action === 'removed') setIsFav(false)
    } finally {
      setFavLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (notFound || !pro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">Professionnel introuvable</p>
        <Link href="/client/marketplace" className="text-sm text-violet-600 hover:text-violet-700">
          Retour à la marketplace
        </Link>
      </div>
    )
  }

  const minPrice = pro.services.length > 0 ? Math.min(...pro.services.map(s => s.price)) : null

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/client/marketplace"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Retour à la marketplace
      </Link>

      {/* Hero Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Gradient top band for premium plans */}
        {pro.plan !== 'starter' && (
          <div className="h-1.5 bg-gradient-to-r from-violet-600 to-rose-500" />
        )}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {pro.avatar_url ? (
                <img src={pro.avatar_url} alt={pro.full_name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-bold text-2xl">
                  {pro.full_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{pro.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {pro.rating !== null && (
                      <div className="flex items-center gap-1.5">
                        <Stars rating={pro.rating} />
                        <span className="text-sm font-semibold text-slate-700">{pro.rating.toFixed(1)}</span>
                        <span className="text-sm text-slate-400">({pro.review_count} avis)</span>
                      </div>
                    )}
                    {pro.city && (
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {pro.city}
                      </span>
                    )}
                    {pro.has_busy_slots && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.75rem',
                        background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                        borderRadius: 100, fontSize: '0.72rem', fontWeight: 700,
                        color: '#15803d',
                      }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#22c55e',
                          animation: 'pulse 2s ease infinite',
                        }} />
                        Actif — agenda rempli
                      </div>
                    )}
                    {minPrice !== null && (
                      <span className="text-sm font-semibold text-violet-600">
                        A partir de {minPrice}€
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isFav
                        ? 'bg-rose-50 border-rose-200 text-rose-500'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-400'
                    }`}
                    title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {pro.bio && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{pro.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Services proposés</h2>
        </div>
        {pro.services.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">Aucun service renseigné</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pro.services.map(service => (
              <div key={service.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-400">{service.duration} min</p>
                </div>
                <span className="font-semibold text-slate-900">{service.price}€</span>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:opacity-95 transition-all"
          >
            Reserver un rendez-vous
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>

      {/* Reviews */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Avis clients
            {pro.review_count > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">({pro.review_count})</span>
            )}
          </h2>
          {pro.rating !== null && (
            <div className="flex items-center gap-1.5">
              <Stars rating={pro.rating} size={13} />
              <span className="text-sm font-semibold text-slate-700">{pro.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {pro.reviews.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">Aucun avis pour le moment</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pro.reviews.map(review => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Stars rating={review.rating} size={13} />
                  <span className="text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        proId={pro.id}
        proName={pro.full_name}
        proUsername={pro.username}
        services={pro.services}
      />
    </div>
  )
}
