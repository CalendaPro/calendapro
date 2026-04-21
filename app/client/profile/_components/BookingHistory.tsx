'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Booking = {
  id: string
  pro_name: string
  pro_username: string
  service_name: string
  scheduled_at: string
  duration_minutes: number | null
  price: number | null
  status: string
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings?status=completed')
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data.slice(0, 5) : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Historique des reservations</h2>
        <Link href="/client/bookings" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
          Voir tout
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400 mb-3">Aucune reservation passee</p>
          <Link href="/client/marketplace" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            Prendre un RDV
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-3 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{b.pro_name}</p>
                    <p className="text-xs text-slate-400">
                      {b.service_name}
                      {b.duration_minutes ? ` · ${b.duration_minutes} min` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{formatDate(b.scheduled_at)}</p>
                    {b.price !== null && (
                      <p className="text-sm font-semibold text-slate-800">{b.price}€</p>
                    )}
                  </div>
                  <Link
                    href={`/client/${b.pro_username}`}
                    className="opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-100 transition-all"
                  >
                    Reprendre
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
