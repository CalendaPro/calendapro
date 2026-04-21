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
}

export default function UpcomingBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings?status=upcoming')
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data.slice(0, 3) : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const calUrl = (b: Booking) => {
    const start = new Date(b.scheduled_at)
    const end = new Date(start.getTime() + (b.duration_minutes || 60) * 60000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const title = encodeURIComponent(`RDV ${b.pro_name} — ${b.service_name}`)
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}`
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Prochains RDV</h2>
        <Link href="/client/bookings" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
          Voir tout
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400 mb-3">Aucun rendez-vous a venir</p>
          <Link href="/client/marketplace" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            Prendre un RDV
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{b.pro_name}</p>
                  <p className="text-xs text-slate-500">
                    {b.service_name}
                    {b.duration_minutes ? ` · ${b.duration_minutes} min` : ''}
                    {b.price !== null ? ` · ${b.price}€` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-violet-600">{formatDate(b.scheduled_at)}</p>
                  <p className="text-xs text-slate-400">{formatTime(b.scheduled_at)}</p>
                </div>
              </div>
              <a
                href={calUrl(b)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Ajouter au calendrier
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
