'use client'

import Link from 'next/link'

type Booking = {
  id: string
  proName: string
  proUsername: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: number
}

export default function UpcomingBookings() {
  // TODO: Fetch actual bookings from API
  const bookings: Booking[] = [
    {
      id: '1',
      proName: 'Harri Abdel',
      proUsername: 'harri_abdel',
      serviceName: 'Coupe + Barbe',
      date: '2024-04-15',
      time: '10:00',
      duration: 45,
      price: 35,
    },
    {
      id: '2',
      proName: 'Coach Fitness',
      proUsername: 'coach_fitness',
      serviceName: 'Séance Cardio',
      date: '2024-04-20',
      time: '14:00',
      duration: 60,
      price: 50,
    },
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Mes prochains RDV</h2>
        <p className="text-stone-500 text-center py-8">Aucun rendez-vous à venir</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Mes prochains RDV</h2>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="p-4 bg-gradient-to-r from-violet-50 to-rose-50 rounded-xl border border-violet-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-stone-900">{booking.proName}</div>
                <div className="text-sm text-stone-600">{booking.serviceName} · {booking.duration} min · {booking.price}€</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-violet-600">{formatDate(booking.date)}</div>
                <div className="text-sm text-stone-600">{booking.time}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg text-sm hover:border-violet-400 transition-colors">
                + Google Calendar
              </button>
              <button className="flex-1 px-3 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg text-sm hover:border-violet-400 transition-colors">
                Rappel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
