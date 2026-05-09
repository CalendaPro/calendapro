'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import UpcomingBookings from './_components/UpcomingBookings'
import FavoritesPros from './_components/FavoritesPros'
import BookingHistory from './_components/BookingHistory'

export default function ClientProfilePage() {
  const { user } = useUser()
  const [stats, setStats] = useState({ upcoming: 0, favorites: 0, completed: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/bookings?status=upcoming').then(r => r.json()).catch(() => []),
      fetch('/api/bookings?status=completed').then(r => r.json()).catch(() => []),
      fetch('/api/favorites').then(r => r.json()).catch(() => []),
    ]).then(([upcoming, completed, favs]) => {
      setStats({
        upcoming: Array.isArray(upcoming) ? upcoming.length : 0,
        favorites: Array.isArray(favs) ? favs.length : 0,
        completed: Array.isArray(completed) ? completed.length : 0,
      })
      setStatsLoading(false)
    })
  }, [])

  const fullName = user?.fullName || user?.firstName || ''
  const email = user?.emailAddresses?.[0]?.emailAddress || ''
  const initial = user?.firstName?.charAt(0) || email?.charAt(0) || '?'

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
            {initial.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {fullName || 'Mon compte'}
            </h2>
            <p className="text-slate-500 text-sm">{email}</p>
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
          <div className="text-2xl font-bold text-violet-600">
            {statsLoading ? '-' : stats.upcoming}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">RDV a venir</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-rose-500">
            {statsLoading ? '-' : stats.favorites}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Favoris</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {statsLoading ? '-' : stats.completed}
          </div>
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
