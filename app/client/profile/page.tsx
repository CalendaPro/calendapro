'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import UpcomingBookings from './_components/UpcomingBookings'
import FavoritesPros from './_components/FavoritesPros'
import BookingHistory from './_components/BookingHistory'

export default function ClientProfilePage() {
  const { user } = useUser()

  // TODO: Fetch profile data from Supabase
  const mockProfile = {
    full_name: user?.fullName || 'Leila Roura',
    email: user?.emailAddresses?.[0]?.emailAddress || 'leila@example.com',
    location: 'Toulon, France',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          💼 Mon Profil Client
        </h1>
        <p className="text-stone-600">
          Gérez vos réservations et vos favoris
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-semibold text-3xl">
            {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'L'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-stone-900 mb-1">
              {mockProfile.full_name}
            </h2>
            <p className="text-stone-600 mb-2">{mockProfile.email}</p>
            <p className="text-stone-500 text-sm mb-4">📍 {mockProfile.location}</p>
            <div className="flex gap-3">
              <Link
                href="/client/settings"
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:border-violet-400 transition-colors text-sm"
              >
                Éditer le profil
              </Link>
              <Link
                href="/client/settings"
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:border-violet-400 transition-colors text-sm"
              >
                Paramètres
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-violet-600">3</div>
          <div className="text-sm text-stone-600">RDV</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-rose-600">2</div>
          <div className="text-sm text-stone-600">Favoris</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-stone-900">5</div>
          <div className="text-sm text-stone-600">Évaluations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <UpcomingBookings />

        {/* Favorites Pros */}
        <FavoritesPros />
      </div>

      {/* Booking History */}
      <div className="mt-6">
        <BookingHistory />
      </div>
    </div>
  )
}
