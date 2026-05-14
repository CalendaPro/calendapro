'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Calendar, User, CreditCard, ArrowRight, Download, CalendarPlus } from 'lucide-react'
import { logger } from '@/lib/logger'

interface BookingDetails {
  id: string
  amount: number
  receipt_url: string | null
  service_name: string
  scheduled_at: string
  professional_name: string
}

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingDetails | null>(null)

  const sessionId = searchParams.get('session_id')
  const username = searchParams.get('username')

  useEffect(() => {
    if (!sessionId || !username) {
      setStatus('error')
      setError('Paramètres manquants')
      return
    }

    // Track conversion: Booking success page viewed (checkout completed)
    if (typeof window !== 'undefined') {
      logger.info('[TRACKING] Event: booking_checkout_completed', { sessionId, username })
      if ((window as any).dataLayer) {  // reason: GTM dataLayer has no TS type declarations
        (window as any).dataLayer.push({  // reason: GTM dataLayer has no TS type declarations
          event: 'booking_checkout_completed',
          sessionId,
          username,
        })
      }
    }

    // Vérifier le paiement et créer le rendez-vous
    const verifyAndCreate = async () => {
      try {
        // Try verify-booking first (creates booking if webhook hasn't yet)
        const res = await fetch('/api/stripe/verify-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, username }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setStatus('success')
          // Track conversion: Booking confirmed successfully
          if (typeof window !== 'undefined') {
            logger.info('[TRACKING] Event: booking_confirmed', { sessionId, username, appointmentId: data.appointment?.id })
            if ((window as any).dataLayer) {  // reason: GTM dataLayer has no TS type declarations
              (window as any).dataLayer.push({  // reason: GTM dataLayer has no TS type declarations
                event: 'booking_confirmed',
                sessionId,
                username,
                appointmentId: data.appointment?.id,
                value: data.appointment?.amount_paid,
              })
            }
          }
          // Récupérer les détails du booking pour afficher le reçu
          if (data.appointment?.id) {
            fetchBookingDetails(data.appointment.id)
          }
        } else if (data.error?.includes('SLOT_CONFLICT') || data.error?.includes('déjà créé')) {
          // Booking was already created by webhook — that's fine
          setStatus('success')
          if (data.appointment?.id) {
            fetchBookingDetails(data.appointment.id)
          }
        } else {
          setStatus('error')
          setError(data.error || 'Erreur lors de la création du rendez-vous')
        }
      } catch (err) {
        setStatus('error')
        setError('Erreur de connexion')
      }
    }

    verifyAndCreate()
  }, [sessionId, username])

  // Récupérer les détails du booking (montant, reçu, etc.)
  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`)
      if (res.ok) {
        const data = await res.json()
        setBooking({
          id: data.id,
          amount: data.amount_paid || 0,
          receipt_url: data.stripe_receipt_url,
          service_name: data.service_name || 'Rendez-vous',
          scheduled_at: data.scheduled_at,
          professional_name: data.pro_name || 'Professionnel',
        })
      }
    } catch (err) {
      logger.error('Erreur récupération booking:', err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0', fontFamily: "'Satoshi', 'Cabinet Grotesk', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stone-600">Confirmation de votre réservation...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7F5F0', fontFamily: "'Satoshi', 'Cabinet Grotesk', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Erreur</h1>
          <p className="text-stone-600 mb-6">{error || 'Une erreur est survenue'}</p>
          <Link 
            href={`/${username || ''}`}
            className="inline-block px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700"
          >
            Retour à la page du professionnel
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7F5F0', fontFamily: "'Satoshi', 'Cabinet Grotesk', sans-serif" }}>
      <div className="max-w-md w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Réservation confirmée !</h1>
          <p className="text-stone-600">Votre paiement a été accepté.</p>
        </div>

        {/* Booking Summary Card */}
        <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Récapitulatif
          </h2>

          {booking ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} style={{ color: '#6B7280' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Date</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1F2937' }}>{formatDate(booking.scheduled_at)}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} style={{ color: '#6B7280' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Professionnel</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1F2937' }}>{booking.professional_name}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={16} style={{ color: '#6B7280' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Montant payé</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>{(booking.amount / 100).toFixed(2)} €</p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#E5E7EB', margin: '0.5rem 0' }} />

              {/* Receipt Button */}
              {booking.receipt_url ? (
                <a
                  href={booking.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.875rem', background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 12, color: '#059669', fontWeight: 600, textDecoration: 'none',
                    fontSize: '0.9rem', transition: 'all 0.2s'
                  }}
                >
                  <Receipt size={18} />
                  Voir le reçu Stripe
                  <ArrowRight size={16} />
                </a>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>
                  Le reçu sera disponible dans quelques minutes
                </p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Chargement des détails...</p>
            </div>
          )}
        </div>

        {/* Email Notice */}
        <p className="text-stone-500 text-sm mb-6 text-center">
          Un email de confirmation vous a été envoyé avec les détails de votre rendez-vous.
        </p>

        {/* Add to Calendar Button */}
        {booking && (
          <a
            href={`/api/calendar/ics?title=${encodeURIComponent(`RDV avec ${booking.professional_name}`)}&start=${encodeURIComponent(booking.scheduled_at)}&pro_name=${encodeURIComponent(booking.professional_name)}`}
            download={`rendez-vous-${booking.id}.ics`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '1rem', background: '#F0FDF4', border: '1.5px solid #BBF7D0',
              borderRadius: 12, color: '#059669', fontWeight: 600, textDecoration: 'none',
              fontSize: '0.95rem', marginBottom: '0.75rem'
            }}
          >
            <CalendarPlus size={18} />
            Ajouter à mon calendrier
          </a>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href={`/${username || ''}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '1rem', background: '#7C3AED', borderRadius: 12, color: 'white',
              fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)'
            }}
          >
            Retour à la page du professionnel
          </Link>

          <Link
            href="/client/appointments"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '1rem', background: 'transparent', border: '1.5px solid #E5E7EB',
              borderRadius: 12, color: '#6B7280', fontWeight: 600, textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            Voir mes rendez-vous
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0', fontFamily: "'Satoshi', 'Cabinet Grotesk', sans-serif" }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stone-600">Chargement...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
