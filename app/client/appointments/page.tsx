'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, isAfter, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CalendarDays, Clock, MapPin, Tag, CreditCard,
  CheckCircle2, AlertCircle, XCircle, UserX,
  Wallet, ArrowRight, RefreshCcw,
} from 'lucide-react'

// Types
interface Booking {
  id: string
  pro_name: string
  pro_username: string
  service_name: string
  scheduled_at: string
  duration_minutes: number | null
  price: number | null
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show'
  payment_status: 'pending' | 'paid' | 'refunded'
  deposit_amount?: number
  location?: string
}

interface CancelCheck {
  can_cancel: boolean
  reason?: string
  hours_remaining?: number
  refund_eligible?: boolean
}

// Configuration des statuts
const STATUS_CONFIG = {
  upcoming:  { label: 'Confirmé',  bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6', icon: <CheckCircle2 size={12} strokeWidth={2} /> },
  completed: { label: 'Terminé',  bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E', icon: <CheckCircle2 size={12} strokeWidth={2} /> },
  cancelled: { label: 'Annulé',   bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3', dot: '#F43F5E', icon: <XCircle     size={12} strokeWidth={2} /> },
  no_show:   { label: 'Absent',   bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', dot: '#94A3B8', icon: <UserX       size={12} strokeWidth={2} /> },
}

const PAYMENT_STATUS_CONFIG = {
  pending:   { label: 'En attente', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  paid:      { label: 'Payé',       color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  refunded:  { label: 'Remboursé',  color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
}

// Modal de confirmation d'annulation
function CancelModal({
  booking,
  cancelCheck,
  onConfirm,
  onClose,
  isLoading,
}: {
  booking: Booking
  cancelCheck: CancelCheck
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}) {
  const hasRefund = cancelCheck.refund_eligible && booking.price && booking.price > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        style={{
          background: 'var(--cl-surface)',
          border: '1.5px solid var(--cl-border)',
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: 'var(--cl-shadow-soft)',
        }}
      >
        {/* Header */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${STATUS_CONFIG[booking.status].dot}, ${STATUS_CONFIG[booking.status].border})` }} />
        <div style={{ padding: '1.1rem 1.2rem' }}>
          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>
              Annuler le rendez-vous avec {booking.pro_name}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
              {format(new Date(booking.scheduled_at), 'EEEE d MMMM yyyy', { locale: fr })} à {format(new Date(booking.scheduled_at), 'HH:mm', { locale: fr })}
            </p>
          </div>

          {/* Wallet refund info */}
          {hasRefund ? (
            <div style={{ padding: '0.85rem 1.2rem', background: PAYMENT_STATUS_CONFIG.refunded.bg, border: `1px solid ${PAYMENT_STATUS_CONFIG.refunded.border}`, borderRadius: 10, marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={16} strokeWidth={2} style={{ color: PAYMENT_STATUS_CONFIG.refunded.color }} />
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: PAYMENT_STATUS_CONFIG.refunded.color, fontFamily: "'DM Sans', sans-serif" }}>
                  Remboursement automatique
                </p>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                {booking.price}€ seront crédités sur votre porte-monnaie CalendaPro
              </p>
            </div>
          ) : (
            <div style={{ padding: '0.85rem 1.2rem', background: PAYMENT_STATUS_CONFIG.pending.bg, border: `1px solid ${PAYMENT_STATUS_CONFIG.pending.border}`, borderRadius: 10, marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} strokeWidth={2} style={{ color: PAYMENT_STATUS_CONFIG.pending.color }} />
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: PAYMENT_STATUS_CONFIG.pending.color, fontFamily: "'DM Sans', sans-serif" }}>
                  Aucun remboursement
                </p>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                Aucun paiement n'a été effectué pour ce rendez-vous
              </p>
            </div>
          )}

          {/* Warning */}
          <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', marginTop: '0.85rem' }}>
            Cette action est irréversible. Le créneau sera libéré.
          </p>
        </div>

        {/* Actions */}
        <div style={{ padding: '0.85rem 1.2rem', display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: 10,
              border: '1.5px solid var(--cl-border)',
              background: 'transparent',
              color: 'var(--cl-text-muted)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Garder le RDV
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: 10,
              border: '1.5px solid var(--cl-accent-20)',
              background: 'var(--cl-accent-soft)',
              color: 'var(--cl-accent)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {isLoading ? (
              <RefreshCcw size={16} strokeWidth={2} style={{ color: 'var(--cl-accent)' }} />
            ) : (
              <XCircle size={16} strokeWidth={2} style={{ color: 'var(--cl-accent)' }} />
            )}
            Confirmer l'annulation
          </button>
        </div>
      </div>
    </div>
  )
}

// Carte de rendez-vous premium
function AppointmentCard({
  booking,
  onCancel,
}: {
  booking: Booking
  onCancel: (booking: Booking, check: CancelCheck) => void
}) {
  const [cancelCheck, setCancelCheck] = useState<CancelCheck | null>(null)
  const [checking, setChecking] = useState(false)

  const date = new Date(booking.scheduled_at)
  const status = STATUS_CONFIG[booking.status]
  const paymentStatus = PAYMENT_STATUS_CONFIG[booking.payment_status]

  const handleCancelClick = async () => {
    if (checking) return
    setChecking(true)

    try {
      const res = await fetch(`/api/bookings/can-cancel?booking_id=${booking.id}`)
      const data = await res.json()
      setCancelCheck(data)
      onCancel(booking, data)
    } catch {
      setCancelCheck({ can_cancel: false, reason: 'Erreur de vérification' })
      onCancel(booking, { can_cancel: false, reason: 'Erreur de vérification' })
    } finally {
      setChecking(false)
    }
  }

  // Calculer le temps restant
  const hoursUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60)
  const daysUntil = Math.ceil(hoursUntil / 24)
  const timeInfo = hoursUntil > 24
    ? `Dans ${daysUntil} jours`
    : hoursUntil > 0
      ? `Dans ${Math.ceil(hoursUntil)}h`
      : 'En cours'

  return (
    <div
      style={{
        background: 'var(--cl-surface)',
        border: `1.5px solid ${status.border}`,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: 'var(--cl-shadow-soft)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--cl-shadow-xl)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--cl-shadow-soft)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${status.dot}, ${status.border})` }} />
      <div style={{ padding: '1.1rem 1.2rem' }}>
        {/* Header: Pro info + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #4F46E5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}>
              {(booking.pro_name?.[0] || booking.pro_username?.[0] || 'P').toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--cl-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {booking.pro_name || booking.pro_username || 'Professionnel'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontFamily: "'DM Sans', sans-serif" }}>
                {booking.service_name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.22rem 0.65rem', borderRadius: 100, background: status.bg, color: status.text, border: `1px solid ${status.border}`, fontSize: '0.68rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.dot }} />
              {status.label}
            </span>
            {paymentStatus && (
              <span style={{ fontSize: '0.64rem', padding: '0.13rem 0.5rem', borderRadius: 100, background: paymentStatus.bg, color: paymentStatus.color, border: `1px solid ${paymentStatus.border}`, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {paymentStatus.label}
              </span>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.65rem', borderRadius: 10, background: 'var(--cl-bg)', border: '1px solid var(--cl-border)' }}>
            <CalendarDays size={13} strokeWidth={2} style={{ color: 'var(--cl-accent)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.59rem', color: 'var(--cl-text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>Date</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{format(date, 'd MMMM yyyy', { locale: fr })}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.65rem', borderRadius: 10, background: 'var(--cl-bg)', border: '1px solid var(--cl-border)' }}>
            <Clock size={13} strokeWidth={2} style={{ color: 'var(--cl-accent)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.59rem', color: 'var(--cl-text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>Heure</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{format(date, 'HH:mm', { locale: fr })}</p>
            </div>
          </div>
          {booking.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.65rem', borderRadius: 10, background: 'var(--cl-bg)', border: '1px solid var(--cl-border)' }}>
              <MapPin size={13} strokeWidth={2} style={{ color: 'var(--cl-accent)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.59rem', color: 'var(--cl-text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>Lieu</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cl-text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{booking.location}</p>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.65rem', borderRadius: 10, background: 'var(--cl-bg)', border: '1px solid var(--cl-border)' }}>
            <Tag size={13} strokeWidth={2} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.59rem', color: 'var(--cl-text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>Prix</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D', fontFamily: "'DM Sans', sans-serif" }}>{booking.price ? `${booking.price}€` : 'Gratuit'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {booking.status === 'upcoming' && hoursUntil > 24 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCancelClick}
              disabled={checking}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: 10,
                border: '1.5px solid var(--cl-border)',
                background: 'transparent',
                color: 'var(--cl-text-muted)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {checking ? (
                <RefreshCcw size={16} strokeWidth={2} style={{ color: 'var(--cl-text-muted)' }} />
              ) : (
                <XCircle size={16} strokeWidth={2} style={{ color: 'var(--cl-text-muted)' }} />
              )}
              Annuler
            </button>
            <Link
              href={`/client/${booking.pro_username}`}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: 10,
                border: '1.5px solid var(--cl-accent-20)',
                background: 'var(--cl-accent-soft)',
                color: 'var(--cl-accent)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <CalendarDays size={16} strokeWidth={2} style={{ color: 'var(--cl-accent)' }} />
              Reprogrammer
            </Link>
          </div>
        )}

        {booking.status === 'upcoming' && hoursUntil <= 24 && hoursUntil > 0 && (
          <div style={{ padding: '0.85rem 1.2rem', background: PAYMENT_STATUS_CONFIG.pending.bg, border: `1px solid ${PAYMENT_STATUS_CONFIG.pending.border}`, borderRadius: 10, marginTop: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} strokeWidth={2} style={{ color: PAYMENT_STATUS_CONFIG.pending.color }} />
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: PAYMENT_STATUS_CONFIG.pending.color, fontFamily: "'DM Sans', sans-serif" }}>
                Annulation impossible
              </p>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--cl-text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
              Moins de 24h avant le RDV
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant principal
export default function AppointmentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [cancelModal, setCancelModal] = useState<{
    booking: Booking
    check: CancelCheck
  } | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const handleCancel = async () => {
    if (!cancelModal?.booking) return
    setCancelling(true)
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: cancelModal.booking.id,
          cancelled_by: 'client',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(err.error || 'Echec annulation')
      }
      setBookings(prev =>
        prev.map(b =>
          b.id === cancelModal.booking.id ? { ...b, status: 'cancelled' as const } : b
        )
      )
      setCancelModal(null)
      setToast({ message: 'Rendez-vous annule avec succes', type: 'success' })
      setTimeout(() => setToast(null), 3500)
    } catch (err) {
      console.error('[Appointments] Cancel error:', err)
      setToast({ message: err instanceof Error ? err.message : 'Impossible d\'annuler ce rendez-vous.', type: 'error' })
      setTimeout(() => setToast(null), 3500)
    } finally {
      setCancelling(false)
    }
  }

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.2rem',
    borderRadius: 10,
    border: active ? '1.5px solid var(--cl-accent-20)' : '1.5px solid transparent',
    background: active ? 'var(--cl-accent-soft)' : 'transparent',
    color: active ? 'var(--cl-accent)' : 'var(--cl-text-muted)',
    fontSize: '0.82rem',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  })

  // Charger les rendez-vous
  useEffect(() => {
    fetch('/api/bookings?status=all')
      .then(r => r.json())
      .then(data => {
        setBookings(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Filtrer les rendez-vous
  const filtered = bookings.filter(b => {
    const isPast = new Date(b.scheduled_at) < new Date() || b.status === 'completed' || b.status === 'cancelled'
    return activeTab === 'upcoming' ? !isPast : isPast
  })

  // Trier : à venir par date croissante, passés par date décroissante
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.scheduled_at).getTime()
    const dateB = new Date(b.scheduled_at).getTime()
    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA
  })

  const upcomingCount = bookings.filter(b => {
    const isPast = new Date(b.scheduled_at) < new Date() || b.status === 'completed' || b.status === 'cancelled'
    return !isPast
  }).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--cl-accent)', marginBottom: '0.3rem', fontFamily: "'DM Sans', sans-serif" }}>Agenda</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)', fontWeight: 700, color: 'var(--cl-text-primary)', letterSpacing: '-0.03em', fontFamily: "'Clash Display', sans-serif", lineHeight: 1.2 }}>Mes rendez-vous</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--cl-text-muted)', marginTop: '0.4rem', fontFamily: "'DM Sans', sans-serif" }}>Gérez vos réservations et suivez leur statut en temps réel.</p>
      </div>

      {/* Wallet quick link */}
      <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', boxShadow: '0 8px 32px rgba(5,150,105,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
            <Wallet size={18} strokeWidth={1.5} style={{ color: 'white' }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: 'white' }}>Votre porte-monnaie</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}>Consultez votre solde et transactions</p>
          </div>
        </div>
        <Link href="/client/wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.45rem 0.9rem', background: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}>
          Voir le wallet
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={tabStyle(activeTab === 'upcoming')}
        >
          A venir
          <span style={{ fontSize: '0.64rem', padding: '0.13rem 0.5rem', borderRadius: 100, background: 'var(--cl-accent-soft)', color: 'var(--cl-accent)', border: '1px solid var(--cl-accent-20)', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {upcomingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('past')}
          style={tabStyle(activeTab === 'past')}
        >
          Historique
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skel" style={{ height: 220, borderRadius: 20 }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        activeTab === 'upcoming' ? (
          // État vide premium - upcoming
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center',
            padding: '4rem 2rem', gap: '1.25rem',
          }}>
            {/* Illustration minimaliste */}
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, var(--cl-accent-soft), var(--cl-surface))',
              border: '1.5px solid var(--cl-accent-20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="var(--cl-accent)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
              </svg>
            </div>
            <div>
              <h3 style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '1.15rem', fontWeight: 700,
                color: 'var(--cl-text-primary)', margin: '0 0 0.4rem',
              }}>
                Votre agenda est libre
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                color: 'var(--cl-text-muted)', fontSize: '0.85rem',
                maxWidth: 340, lineHeight: 1.65, margin: 0,
              }}>
                Trouvez un professionnel qualifie pres de chez vous
                et reservez votre premier rendez-vous en 60 secondes.
              </p>
            </div>
            <Link
              href="/client/marketplace"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                background: 'linear-gradient(135deg, #4F46E5, #6366f1)',
                color: 'white', borderRadius: 14,
                fontSize: '0.85rem', fontWeight: 700,
                textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 8px 24px rgba(79,70,229,0.25)',
                transition: 'all 0.2s',
              }}
            >
              Explorer la marketplace
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        ) : (
          // État vide historique
          <div style={{ textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--cl-accent-soft)', border: '1.5px solid var(--cl-accent-20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={28} strokeWidth={1.5} style={{ color: 'var(--cl-accent)' }} />
            </div>
            <h3 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--cl-text-primary)' }}>
              Aucun historique
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--cl-text-muted)', fontSize: '0.85rem', maxWidth: 320, lineHeight: 1.65 }}>
              Vos rendez-vous passés apparaîtront ici.
            </p>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {sorted.map(booking => (
            <AppointmentCard
              key={booking.id}
              booking={booking}
              onCancel={(b, c) => setCancelModal({ booking: b, check: c })}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {cancelModal !== null && (
        <CancelModal
          booking={cancelModal.booking}
          cancelCheck={cancelModal.check}
          onConfirm={handleCancel}
          onClose={() => setCancelModal(null)}
          isLoading={cancelling}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          padding: '0.85rem 1.25rem',
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecdd3'}`,
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          fontSize: '0.82rem', fontWeight: 600,
          color: toast.type === 'success' ? '#15803d' : '#be123c',
          zIndex: 100, maxWidth: 320,
          fontFamily: "'DM Sans', sans-serif",
          animation: 'slideInRight 0.3s ease',
        }}>
          {toast.message}
        </div>
      )}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
