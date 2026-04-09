'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import BookingModal from '../_components/BookingModal'

type ProProfile = {
  id: string
  username: string
  full_name: string
  bio: string | null
  category: string | null
  city: string | null
  plan: 'starter' | 'premium' | 'infinity'
  avatar_url: string | null
  rating: number
  review_count: number
  response_time: string
  is_available: boolean
  services: Service[]
  reviews: Review[]
}

type Service = {
  id: string
  name: string
  duration: number
  price: number
}

type Review = {
  id: string
  author_name: string
  rating: number
  text: string
  date: string
}

export default function ProDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [pro, setPro] = useState<ProProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    // TODO: Fetch pro profile from API
    // For now, mock data
    setTimeout(() => {
      setPro({
        id: '1',
        username: params.username as string,
        full_name: 'Harri Abdel',
        bio: 'Coiffeur avec 15 ans d\'expérience spécialisé dans les coupes modernes et l\'entretien de la barbe.',
        category: 'barbier',
        city: 'Lyon',
        plan: 'premium',
        avatar_url: null,
        rating: 4.9,
        review_count: 124,
        response_time: '< 2h',
        is_available: true,
        services: [
          { id: '1', name: 'Coupe classique', duration: 30, price: 25 },
          { id: '2', name: 'Coupe + Barbe', duration: 45, price: 35 },
          { id: '3', name: 'Coupe beard design', duration: 45, price: 40 },
          { id: '4', name: 'Coloration', duration: 60, price: 50 },
        ],
        reviews: [
          {
            id: '1',
            author_name: 'Alice M.',
            rating: 5,
            text: 'Excellent ! Hyper pro et très bon résultat.',
            date: 'il y a 2j',
          },
          {
            id: '2',
            author_name: 'Marc L.',
            rating: 4,
            text: 'Très bien, rapide et propre.',
            date: 'il y a 1 sem',
          },
        ],
      })
      setLoading(false)
    }, 500)
  }, [params.username])

  const handleBooking = () => {
    setShowBookingModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-stone-500">Chargement...</div>
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-stone-500">Profil non trouvé</div>
      </div>
    )
  }

  return (
    <div>
      {/* Back button */}
      <Link
        href="/client/marketplace"
        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Retour à la marketplace
      </Link>

      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-bold text-3xl">
                {pro.full_name.charAt(0)}
              </div>
              {pro.is_available && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Disponible
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-stone-900 mb-2">{pro.full_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold">{pro.rating}</span>
                  <span className="text-stone-500">({pro.review_count} avis)</span>
                </div>
                <div className="flex items-center gap-1 text-stone-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {pro.city}
                </div>
                <div className="flex items-center gap-1 text-stone-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  Réponse: {pro.response_time}
                </div>
              </div>
              <p className="text-stone-600 mb-4">{pro.bio}</p>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-violet-600">
                  À partir de {Math.min(...pro.services.map(s => s.price))}€
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                💬 Contacter
              </button>
              <button className="px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors">
                ❤️ Favoris
              </button>
              <button className="px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors">
                📤 Partager
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Services proposés</h2>
        <div className="space-y-3">
          {pro.services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 border border-stone-200 rounded-xl"
            >
              <div>
                <div className="font-medium text-stone-900">{service.name}</div>
                <div className="text-sm text-stone-500">{service.duration} min</div>
              </div>
              <div className="font-semibold text-stone-900">{service.price}€</div>
            </div>
          ))}
        </div>
        <button
          onClick={handleBooking}
          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          Réserver un RDV
        </button>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Avis clients</h2>
        <div className="space-y-4">
          {pro.reviews.map((review) => (
            <div key={review.id} className="border-b border-stone-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-medium text-stone-900">{review.author_name}</span>
                <span className="text-stone-500 text-sm">{review.date}</span>
              </div>
              <p className="text-stone-600">{review.text}</p>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors">
          Voir tous les avis →
        </button>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        proName={pro.full_name}
        services={pro.services}
      />
    </div>
  )
}
