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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-slate-500 text-sm mt-1">Gerez vos informations et vos reservations</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'L'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {mockProfile.full_name}
            </h2>
            <p className="text-slate-500 text-sm">{mockProfile.email}</p>
            <p className="text-slate-400 text-sm mt-0.5">{mockProfile.location}</p>
            <div className="flex gap-2 mt-4">
              <Link
                href="/client/settings"
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:border-violet-400 transition-colors text-sm font-medium"
              >
                Modifier le profil
              </Link>
              <Link
                href="/client/settings"
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:border-violet-400 transition-colors text-sm font-medium"
              >
                Parametres
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-violet-600">-</div>
          <div className="text-xs text-slate-500 mt-0.5">RDV a venir</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-rose-500">-</div>
          <div className="text-xs text-slate-500 mt-0.5">Favoris</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">-</div>
          <div className="text-xs text-slate-500 mt-0.5">RDV termines</div>
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
