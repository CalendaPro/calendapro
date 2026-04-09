'use client'

import Link from 'next/link'

type PastBooking = {
  id: string
  proName: string
  proUsername: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: number
  status: 'completed' | 'cancelled'
}

export default function BookingHistory() {
  // TODO: Fetch actual booking history from API
  const pastBookings: PastBooking[] = [
    {
      id: '1',
      proName: 'Harri Abdel',
      proUsername: 'harri_abdel',
      serviceName: 'Coupe',
      date: '2024-04-10',
      time: '14:00',
      duration: 30,
      price: 25,
      status: 'completed',
    },
    {
      id: '2',
      proName: 'Coach Fitness',
      proUsername: 'coach_fitness',
      serviceName: 'Séance',
      date: '2024-04-05',
      time: '10:00',
      duration: 60,
      price: 50,
      status: 'completed',
    },
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (pastBookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Historique des réservations</h2>
        <p className="text-stone-500 text-center py-8">Aucune réservation passée</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Historique des réservations</h2>
      <div className="space-y-3">
        {pastBookings.map((booking) => (
          <div
            key={booking.id}
            className="flex items-center justify-between p-4 border border-stone-200 rounded-xl hover:border-violet-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div>
                <div className="font-medium text-stone-900">{booking.proName}</div>
                <div className="text-sm text-stone-500">{booking.serviceName} · {booking.duration} min</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-stone-600">{formatDate(booking.date)}</div>
              <div className="font-semibold text-stone-900">{booking.price}€</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-stone-100">
        <Link
          href="/client/marketplace"
          className="text-violet-600 hover:text-violet-700 text-sm font-medium"
        >
          Voir plus de pros →
        </Link>
      </div>
    </div>
  )
}
