'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Client {
  name?: string
  phone?: string
  email?: string
}

interface Appointment {
  id: string
  title: string
  client_name: string
  client_id?: string
  date: string
  duration: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show'
  notes?: string
  price?: number
  deposit_amount?: number
  source_channel?: string
  is_new_client?: boolean
  client?: Client | null
  cancellation_reason?: string
  requires_validation?: boolean // RDV passé non encore validé par le pro
}

interface AppointmentDetailsProps {
  appointment: Appointment
  onClose: () => void
  onEdit: () => void
  onCancel: (reason: string) => void
  onDelete: () => void
  onComplete?: (status: 'completed' | 'no_show') => void // Validation post-RDV
  isCancelling?: boolean
  isDeleting?: boolean
  isCompleting?: boolean
}

const cancellationReasons = [
  { value: 'unforeseen', label: 'Imprévu' },
  { value: 'client_no_show', label: 'Client absent' },
  { value: 'mistake', label: 'Erreur de saisie' },
  { value: 'other', label: 'Autre' },
]

export default function AppointmentDetails({
  appointment,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onComplete,
  isCancelling = false,
  isDeleting = false,
  isCompleting = false,
}: AppointmentDetailsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showValidationConfirm, setShowValidationConfirm] = useState(false)
  const [validationType, setValidationType] = useState<'completed' | 'no_show' | null>(null)
  const isOtherReason = cancelReason === 'other'

  const now = new Date()
  const appointmentDate = new Date(appointment.date)
  const appointmentEnd = new Date(appointmentDate.getTime() + (appointment.duration || 60) * 60000)
  const isPast = appointmentEnd < now
  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'
  const isNoShow = appointment.status === 'no_show'
  const requiresValidation = isPast && !isCancelled && !isCompleted && !isNoShow

  const handleCancelSubmit = () => {
    if (!cancelReason) return
    // If 'other' selected, use custom reason text
    const finalReason = isOtherReason && customReason.trim() 
      ? `Autre: ${customReason.trim()}` 
      : cancellationReasons.find(r => r.value === cancelReason)?.label || cancelReason
    onCancel(finalReason)
    setShowCancelModal(false)
    setCancelReason('')
    setCustomReason('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const time = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    // Ajouter le fuseau pour la transparence
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const offset = -date.getTimezoneOffset()
    const sign = offset >= 0 ? '+' : '-'
    const h = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0')
    const m = (Math.abs(offset) % 60).toString().padStart(2, '0')
    return `${time} (UTC${sign}${h}:${m})`
  }

  return (
    <>
      {/* Slide-over Panel */}
      <div className="fixed inset-0 z-[80] overflow-hidden">
        {/* Backdrop with glassmorphism */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Slide-over */}
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div className="w-screen max-w-md transform transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col bg-white/95 backdrop-blur-xl shadow-2xl">
              {/* Header */}
              <div className="px-6 py-5 border-b border-stone-200/60">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                      Détail du rendez-vous
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-stone-900">
                      {appointment.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                      isCancelled
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isNoShow
                        ? 'bg-slate-50 text-slate-700 border-slate-200'
                        : appointment.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isCancelled ? 'Annulé' : isCompleted ? 'Terminé' : isNoShow ? 'Absent' : appointment.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                  </span>
                  <span className="text-xs text-stone-500">{appointment.duration} min</span>
                  {appointment.is_new_client && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Nouveau client
                    </span>
                  )}
                  {requiresValidation && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      À traiter
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Bannière de validation post-RDV */}
                {requiresValidation && (
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">Rendez-vous terminé</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Ce rendez-vous est terminé. Le client s&apos;est-il présenté ?
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setValidationType('completed')
                              setShowValidationConfirm(true)
                            }}
                            disabled={isCompleting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Présent
                          </button>
                          <button
                            onClick={() => {
                              setValidationType('no_show')
                              setShowValidationConfirm(true)
                            }}
                            disabled={isCompleting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-500 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Absent
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100/50 p-5 border border-stone-200/60">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-violet-200">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-lg">{formatDate(appointment.date)}</p>
                      <p className="text-stone-600 font-medium">{formatTime(appointment.date)}</p>
                      {Intl.DateTimeFormat().resolvedOptions().timeZone !== 'Europe/Paris' && (
                        <span style={{ fontSize: '0.65rem', color: '#f59e0b', display: 'block', marginTop: 2 }}>
                          Heure locale de votre navigateur
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Client Card */}
                <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-stone-400 mb-3 tracking-wider">Client</p>
                  {appointment.client ? (
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center text-lg font-semibold text-violet-700">
                        {(appointment.client.name?.[0] || appointment.client_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 text-lg truncate">
                          {appointment.client.name || appointment.client_name}
                        </p>
                        {appointment.client.phone && (
                          <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {appointment.client.phone}
                          </p>
                        )}
                        {appointment.client_id && (
                          <Link
                            href={`/dashboard/clients/${appointment.client_id}`}
                            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
                          >
                            Voir la fiche client
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-stone-500">
                      <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="font-medium">{appointment.client_name || 'Client sans compte'}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {(appointment.notes || appointment.cancellation_reason) && (
                  <div className="rounded-2xl bg-stone-50/80 p-5 border border-stone-200/60">
                    <p className="text-xs font-semibold uppercase text-stone-400 mb-3 tracking-wider">
                      {appointment.cancellation_reason ? 'Motif d\'annulation' : 'Notes'}
                    </p>
                    <p className="text-stone-700 text-sm leading-relaxed">
                      {appointment.cancellation_reason || appointment.notes}
                    </p>
                  </div>
                )}

                {/* Price - Enhanced with deposit/total distinction */}
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: appointment.deposit_amount ? '1fr 1fr' : '1fr',
                    gap: '0.5rem',
                  }}>
                    <div style={{
                      padding: '0.75rem', borderRadius: 12,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                    }}>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Prix total
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Clash Display', sans-serif" }}>
                        {appointment.price && appointment.price > 0
                          ? appointment.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                          : 'Non renseigne'}
                      </div>
                    </div>
                    {appointment.deposit_amount && appointment.deposit_amount > 0 && (
                      <div style={{
                        padding: '0.75rem', borderRadius: 12,
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                      }}>
                        <div style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Acompte verse
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', fontFamily: "'Clash Display', sans-serif" }}>
                          {appointment.deposit_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source */}
                {appointment.source_channel && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 0', borderTop: '1px solid #f1f5f9',
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Source</span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 600,
                      padding: '0.2rem 0.6rem', borderRadius: 100,
                      background: appointment.source_channel === 'marketplace' ? '#eff6ff' : '#f5f3ff',
                      color: appointment.source_channel === 'marketplace' ? '#1d4ed8' : '#7c3aed',
                      border: `1px solid ${appointment.source_channel === 'marketplace' ? '#bfdbfe' : '#ddd6fe'}`,
                    }}>
                      {appointment.source_channel === 'pro_dashboard' ? 'Cree manuellement'
                        : appointment.source_channel === 'marketplace' ? 'Marketplace'
                        : appointment.source_channel === 'widget' ? 'Widget site web'
                        : appointment.source_channel}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-stone-200/60 px-6 py-5 space-y-3 bg-white/50 backdrop-blur-sm">
                {!isCancelled && !isPast && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Modifier le rendez-vous
                  </button>
                )}
                
                {!isCancelled && !isPast && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    disabled={isCancelling}
                    className="w-full rounded-xl border border-red-200 bg-red-50/80 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {isCancelling ? 'Annulation en cours…' : 'Annuler le rendez-vous'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="w-full rounded-xl py-3 text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50/50 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-stone-900">Annuler le rendez-vous ?</h3>
              <p className="text-sm text-stone-500 mt-1">
                Le client sera notifié du motif d'annulation.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Motif d'annulation <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">-- Sélectionner un motif --</option>
                  {cancellationReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason text field for "Other" */}
              {isOtherReason && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Précisez le motif <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm min-h-[80px] resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Décrivez la raison de l'annulation..."
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancelReason('')
                    setCustomReason('')
                  }}
                >
                  Retour
                </button>
                <button
                  type="button"
                  disabled={!cancelReason || (isOtherReason && !customReason.trim())}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  onClick={handleCancelSubmit}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-stone-900">Supprimer définitivement ?</h3>
              <p className="text-sm text-stone-500 mt-1">
                Cette action est irréversible. Le rendez-vous sera complètement effacé.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                onClick={() => {
                  onDelete()
                  setShowDeleteConfirm(false)
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Confirm Modal */}
      {showValidationConfirm && validationType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                validationType === 'completed' ? 'bg-emerald-100' : 'bg-slate-100'
              }`}>
                <svg className={`h-6 w-6 ${validationType === 'completed' ? 'text-emerald-600' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {validationType === 'completed' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                {validationType === 'completed' ? 'Confirmer la présence ?' : 'Confirmer l\'absence ?'}
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                {validationType === 'completed' 
                  ? 'Le rendez-vous sera marqué comme terminé et le CA sera comptabilisé.' 
                  : 'Le rendez-vous sera marqué comme "no-show". Le client en sera notifié.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                onClick={() => {
                  setShowValidationConfirm(false)
                  setValidationType(null)
                }}
              >
                Retour
              </button>
              <button
                type="button"
                disabled={isCompleting}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  validationType === 'completed' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-slate-600 hover:bg-slate-700'
                }`}
                onClick={() => {
                  onComplete?.(validationType)
                  setShowValidationConfirm(false)
                  setValidationType(null)
                }}
              >
                {isCompleting ? 'Validation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
