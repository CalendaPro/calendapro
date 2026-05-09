'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Appointment = {
  id: string
  title: string
  client_name?: string
  client_id?: string
  date: string
  duration: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'upcoming' | 'no_show'
  notes?: string
  price?: number
  deposit_amount?: number
  payment_status?: 'pending' | 'paid' | 'refunded'
  payment_method?: 'stripe' | 'wallet'
  source?: string
  created_at?: string
  requires_validation?: boolean // RDV passé non validé
}

const STATUS_CONFIG = {
  confirmed: { 
    label: 'Confirmé', 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-600', 
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500'
  },
  pending: { 
    label: 'À confirmer', 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-600', 
    border: 'border-amber-500/20',
    dot: 'bg-amber-500'
  },
  upcoming: { 
    label: 'Confirmé', 
    bg: 'bg-violet-500/10', 
    text: 'text-violet-600', 
    border: 'border-violet-500/20',
    dot: 'bg-violet-500'
  },
  cancelled: { 
    label: 'Annulé', 
    bg: 'bg-red-500/10', 
    text: 'text-red-600', 
    border: 'border-red-500/20',
    dot: 'bg-red-500'
  },
  completed: { 
    label: 'Terminé', 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-600', 
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500'
  },
  no_show: { 
    label: 'Absent', 
    bg: 'bg-slate-500/10', 
    text: 'text-slate-600', 
    border: 'border-slate-500/20',
    dot: 'bg-slate-500'
  },
}

// Icons as components for consistency
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const WalletIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const SortAscIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
)

const SortDescIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
  </svg>
)

// Modal d'annulation avec design glassmorphism moderne
function CancelRefundModal({
  appointment,
  onConfirm,
  onClose,
  isLoading,
}: {
  appointment: Appointment
  onConfirm: () => void
  onClose: () => void
  isLoading: boolean
}) {
  const hasPayment = appointment.payment_status === 'paid' && (appointment.deposit_amount || appointment.price)
  const refundAmount = appointment.deposit_amount || appointment.price || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl shadow-slate-950/20 overflow-hidden border border-slate-100 animate-modal-in">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 p-8 text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner shadow-white/10">
              <XIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-xl tracking-tight">Annuler le rendez-vous</h3>
              <p className="text-white/80 text-sm mt-0.5">{appointment.client_name || appointment.title}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Appointment details card */}
          <div className="flex items-start gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <CalendarIcon className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                {new Date(appointment.date).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' · '}{appointment.duration} min
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">
                {(appointment.deposit_amount || appointment.price || 0).toFixed(2)} €
              </p>
              <p className="text-xs text-slate-400">{appointment.payment_status === 'paid' ? 'Payé' : 'En attente'}</p>
            </div>
          </div>

          {/* Payment status */}
          {hasPayment ? (
            <div className="relative p-5 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/60 rounded-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <WalletIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-800 text-sm">Remboursement automatique</h4>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {refundAmount.toFixed(2)} €
                  </p>
                  <p className="text-sm text-emerald-600/80 mt-2">
                    seront crédités sur le porte-monnaie du client
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/70 rounded-lg text-xs font-medium text-emerald-700 border border-emerald-200/50">
                      {appointment.payment_method === 'stripe' ? (
                        <><CreditCardIcon className="w-3 h-3" /> Stripe</>
                      ) : (
                        <><WalletIcon className="w-3 h-3" /> Wallet</>
                      )}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-emerald-400" />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/50 rounded-lg text-xs font-medium text-emerald-700">
                      <WalletIcon className="w-3 h-3" /> Porte-monnaie
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200/50 flex items-center justify-center flex-shrink-0">
                  <AlertIcon className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 text-sm">Aucun paiement à rembourser</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Aucun acompte ou paiement n'a été effectué pour ce rendez-vous.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-200/50 rounded-xl">
            <AlertIcon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700/80 leading-relaxed">
              Cette action est irréversible. Le créneau sera libéré et le statut passera en <strong>"Annulé"</strong>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-5 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Retour
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-5 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-medium hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Traitement...</span>
              </>
            ) : (
              <>
                <XIcon className="w-5 h-5" />
                <span>Confirmer l'annulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Carte de rendez-vous moderne SaaS
function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment
  onCancel: (apt: Appointment) => void
}) {
  const status = STATUS_CONFIG[appointment.status]
  const hasPayment = appointment.payment_status === 'paid' || appointment.deposit_amount || appointment.price

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'C'
  }

  const getPaymentBadge = () => {
    if (appointment.payment_status === 'paid') {
      if (appointment.payment_method === 'stripe') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-medium border border-blue-200/50">
            <CreditCardIcon className="w-3.5 h-3.5" />
            Stripe
          </span>
        )
      }
      if (appointment.payment_method === 'wallet') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-200/50">
            <WalletIcon className="w-3.5 h-3.5" />
            Wallet
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-medium border border-emerald-200/50">
          <CheckIcon className="w-3.5 h-3.5" />
          Payé
        </span>
      )
    }
    if (appointment.payment_status === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
          <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
          Remboursé
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-xs font-medium border border-amber-200/50">
        <ClockIcon className="w-3.5 h-3.5" />
        En attente
      </span>
    )
  }

  return (
    <div className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 animate-fade-in">
      {/* Header with accent */}
      <div className="relative h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

      <div className="p-6">
        {/* Client info row */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-200">
              {getInitials(appointment.client_name || appointment.title || 'Client')}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm leading-tight">{appointment.client_name || appointment.title}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text} border ${status.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                {appointment.requires_validation && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    À traiter
                  </span>
                )}
                {appointment.source && (
                  <span className="text-xs text-slate-400">
                    via {appointment.source}
                  </span>
                )}
              </div>
            </div>
          </div>
          {((appointment.price || 0) + (appointment.deposit_amount || 0)) > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">
                {(appointment.deposit_amount || appointment.price || 0).toFixed(2)} €
              </p>
              <p className="text-xs text-slate-400">{appointment.duration} min</p>
            </div>
          )}
        </div>

        {/* Date & time row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Date</p>
              <p className="text-sm font-semibold text-slate-700">
                {new Date(appointment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <ClockIcon className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Heure</p>
              <p className="text-sm font-semibold text-slate-700">
                {new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Payment status */}
        <div className="flex items-center justify-between py-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {getPaymentBadge()}
          </div>
          {appointment.notes && (
            <p className="text-xs text-slate-500 truncate max-w-[150px]">
              {appointment.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'no_show' && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onCancel(appointment)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-[0.98]"
            >
              <XIcon className="w-4 h-4" />
              Annuler
            </button>
            <Link
              href={`/dashboard/appointments/${appointment.id}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              <UserIcon className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)
  
  // Filtres et tri
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'upcoming' | 'completed' | 'cancelled' | 'no_show' | 'requires_validation'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    const res = await fetch('/api/calendar')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json().catch(() => [])
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const handleCancel = async () => {
    if (!cancelModal) return
    setCancelling(true)

    try {
      // Utiliser la nouvelle API cancel-with-refund qui gère automatiquement le remboursement Stripe
      const res = await fetch('/api/bookings/cancel-with-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: cancelModal.id,
          cancelled_by: 'pro',
          reason: 'Annulation par le professionnel',
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setAppointments(prev => prev.map(apt =>
          apt.id === cancelModal.id
            ? {
                ...apt,
                status: 'cancelled',
                payment_status: result.stripe_refund || result.wallet_credited ? 'refunded' : apt.payment_status
              }
            : apt
        ))
        setCancelModal(null)
        
        // Afficher un message de confirmation avec le type de remboursement
        if (result.stripe_refund) {
          alert(`Remboursement Stripe de ${(result.refund_amount / 100).toFixed(2)}€ initié avec succès`)
        } else if (result.wallet_credited) {
          alert('Rendez-vous annulé et crédit porte-monnaie effectué')
        }
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de l\'annulation')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setCancelling(false)
    }
  }

  // Validation post-RDV (completed / no_show)
  const handleComplete = async (appointmentId: string, status: 'completed' | 'no_show') => {
    setCompleting(appointmentId)
    
    try {
      const res = await fetch(`/api/calendar/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        setAppointments(prev => prev.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status }
            : apt
        ))
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de la validation')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setCompleting(null)
    }
  }

  // Filtrage et tri des rendez-vous
  const now = new Date()
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'requires_validation') {
      const aptDate = new Date(a.date)
      const aptEnd = new Date(aptDate.getTime() + (a.duration || 60) * 60000)
      return aptEnd < now && !['cancelled', 'completed', 'no_show'].includes(a.status)
    }
    // 'pending' filter includes both legacy 'pending' and 'confirmed' (mapped from 'upcoming' bookings)
    if (statusFilter === 'pending') {
      return a.status === 'pending' || a.status === 'confirmed'
    }
    return a.status === statusFilter
  })
  
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })
  
  // Détection des RDV à traiter (passés mais non validés)
  const appointmentsWithValidation = sortedAppointments.map(a => {
    const aptDate = new Date(a.date)
    const aptEnd = new Date(aptDate.getTime() + (a.duration || 60) * 60000)
    return {
      ...a,
      requires_validation: aptEnd < now && !['cancelled', 'completed', 'no_show'].includes(a.status)
    }
  })

  const activeAppointments = appointmentsWithValidation.filter(a => !['cancelled', 'completed', 'no_show'].includes(a.status))
  const pastAppointments = appointmentsWithValidation.filter(a => ['cancelled', 'completed', 'no_show'].includes(a.status))
  const pendingValidationAppointments = appointmentsWithValidation.filter(a => a.requires_validation)

  // Calculs financiers synchronisés - UNIQUEMENT les RDV complétés comptent dans le CA
  const financialStats = {
    totalDeposits: appointments
      .filter(a => a.payment_status === 'paid' && a.status === 'completed')
      .reduce((sum, a) => sum + (a.deposit_amount || 0), 0),
    stripePayments: appointments.filter(a => a.payment_method === 'stripe' && a.payment_status === 'paid' && a.status === 'completed').length,
    walletPayments: appointments.filter(a => a.payment_method === 'wallet' && a.payment_status === 'paid' && a.status === 'completed').length,
    refunds: appointments.filter(a => a.payment_status === 'refunded').length,
    // CA uniquement sur les RDV completed
    totalRevenue: appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.price || 0) + (a.deposit_amount || 0), 0),
    pendingPayments: appointments.filter(a => a.payment_status === 'pending' && !['cancelled', 'no_show'].includes(a.status)).length,
    pendingValidation: pendingValidationAppointments.length,
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header moderne SaaS avec typo Clash Display */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Rendez-vous
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {filteredAppointments.length} au total · {activeAppointments.length} actifs
            </p>
          </div>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 active:scale-[0.98] touch-target"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau RDV
          </Link>
        </div>

        {/* Contrôles de filtre et tri */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Filtres par statut */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filtrer:</span>
            {[
              { key: 'all', label: 'Tous', count: appointments.length },
              { key: 'pending', label: 'À confirmer', count: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length },
              { key: 'upcoming', label: 'Confirmés', count: appointments.filter(a => a.status === 'upcoming' || a.status === 'confirmed').length },
              { key: 'requires_validation', label: 'À traiter', count: financialStats.pendingValidation, badge: 'amber' },
              { key: 'completed', label: 'Terminés', count: appointments.filter(a => a.status === 'completed').length },
              { key: 'no_show', label: 'Absents', count: appointments.filter(a => a.status === 'no_show').length },
              { key: 'cancelled', label: 'Annulés', count: appointments.filter(a => a.status === 'cancelled').length },
            ].map(({ key, label, count, badge }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as any)}  // reason: Object.keys() returns string[], not the union literal
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === key
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  statusFilter === key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-medium text-slate-500">Trier:</span>
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              {sortOrder === 'newest' ? (
                <><SortDescIcon className="w-3.5 h-3.5" /> Plus récent</>
              ) : (
                <><SortAscIcon className="w-3.5 h-3.5" /> Plus ancien</>
              )}
            </button>
          </div>
        </div>

        {/* Statistiques financières modernes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Acomptes reçus */}
          <div className="relative p-5 bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <WalletIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-slate-500">Acomptes</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {financialStats.totalDeposits.toFixed(2)} €
              </p>
              <p className="text-xs text-slate-400 mt-1">{financialStats.stripePayments + financialStats.walletPayments} paiements</p>
            </div>
          </div>

          {/* Paiements Stripe */}
          <div className="relative p-5 bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCardIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-slate-500">Stripe</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {financialStats.stripePayments}
              </p>
              <p className="text-xs text-slate-400 mt-1">paiements cartes</p>
            </div>
          </div>

          {/* Paiements Wallet */}
          <div className="relative p-5 bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-violet-50 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <WalletIcon className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-slate-500">Wallet</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {financialStats.walletPayments}
              </p>
              <p className="text-xs text-slate-400 mt-1">portemonnaie</p>
            </div>
          </div>

          {/* À traiter */}
          <div className={`relative p-5 border rounded-2xl overflow-hidden hover:shadow-md transition-shadow ${
            financialStats.pendingValidation > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
          }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 ${
              financialStats.pendingValidation > 0 ? 'bg-amber-100' : 'bg-amber-50'
            }`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  financialStats.pendingValidation > 0 ? 'bg-amber-500' : 'bg-amber-100'
                }`}>
                  <AlertIcon className={`w-4 h-4 ${financialStats.pendingValidation > 0 ? 'text-white' : 'text-amber-600'}`} />
                </div>
                <span className={`text-xs font-medium ${financialStats.pendingValidation > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                  À traiter
                </span>
              </div>
              <p className={`text-2xl font-bold ${financialStats.pendingValidation > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {financialStats.pendingValidation}
              </p>
              <p className={`text-xs mt-1 ${financialStats.pendingValidation > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {financialStats.pendingValidation > 0 ? 'Validation requise' : 'Tous traités'}
              </p>
            </div>
          </div>
        </div>

      {/* Active appointments */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Rendez-vous actifs
        </h2>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">Aucun rendez-vous actif</p>
            <p className="text-slate-400 text-sm mt-1">
              {statusFilter !== 'all' ? 'Essayez un autre filtre pour voir plus de résultats' : 'Vos prochains rendez-vous apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {activeAppointments.map(apt => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onCancel={setCancelModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Historique
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {pastAppointments.map(apt => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onCancel={() => {}}
              />
            ))}
          </div>
        </div>
      )}

        {/* Cancel Modal */}
        {cancelModal && (
          <CancelRefundModal
            appointment={cancelModal}
            onConfirm={handleCancel}
            onClose={() => setCancelModal(null)}
            isLoading={cancelling}
          />
        )}
      </div>
    </div>
  )
}
