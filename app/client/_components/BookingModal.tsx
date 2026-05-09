'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { parseDurationToMinutes, formatDuration } from '@/lib/duration'
import type { BookingPaymentSettings } from '@/lib/booking-payment-settings'
import { logger } from '@/lib/logger'

type PublicBookingSettings = BookingPaymentSettings & {
  username: string
  professionalName?: string | null
}

type Service = {
  id: string
  name: string
  duration: number | string
  price: number
}

type BookingModalProps = {
  isOpen: boolean
  onClose: () => void
  proId: string
  proName: string
  proUsername: string
  services: Service[]
}

export default function BookingModal({ isOpen, onClose, proId, proName, proUsername, services }: BookingModalProps) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Champs client
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  
  // Settings paiement
  const [settings, setSettings] = useState<PublicBookingSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Choix du mode de paiement (quand les deux sont disponibles)
  const [paymentChoice, setPaymentChoice] = useState<'deposit' | 'full'>('deposit')

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30']

  // Charger les settings de paiement
  useEffect(() => {
    if (!isOpen) return
 logger.info(`[BookingModal] Chargement settings pour ${proUsername}`)
    setLoadingSettings(true)
    fetch(`/api/public/booking-settings?username=${encodeURIComponent(proUsername)}`)
      .then(r => {
 logger.info(`[BookingModal] Response status: ${r.status}`)
        return r.json()
      })
      .then(data => {
 logger.info(`[BookingModal] Data reçue:`, data)
        if (!data?.error) {
          setSettings(data as PublicBookingSettings)
 logger.info(`[BookingModal] Settings chargés:`, {
            online_payment_enabled: data.online_payment_enabled,
            deposit_required: data.deposit_required,
            paymentRequired: data.online_payment_enabled && data.deposit_required,
          })
        } else {
 logger.error(`[BookingModal] Erreur API:`, data.error)
        }
      })
      .catch(err => {
 logger.error(`[BookingModal] Erreur fetch:`, err)
      })
      .finally(() => setLoadingSettings(false))
  }, [isOpen, proUsername])

  const resetForm = () => {
    setStep(1)
    setSelectedService(null)
    setSelectedDate('')
    setSelectedTime('')
    setClientName('')
    setClientEmail('')
    setClientPhone('')
    setSuccess(false)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Détermine si le paiement en ligne est requis (obligatoire)
  const paymentRequired = !!settings?.online_payment_enabled && !!settings?.deposit_required
  // Détermine si le paiement en ligne est possible (optionnel ou requis)
  const canPayOnline = !!settings?.online_payment_enabled && (!!settings?.deposit_required || !!settings?.allow_full_online_payment)

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1)
      return
    }
    // Step 3: submit
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientEmail) return
    setSubmitting(true)
    setError(null)
    
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
      
      // Si paiement en ligne activé, rediriger vers Stripe
      if (settings?.online_payment_enabled && canPayOnline) {
        const res = await fetch('/api/stripe/booking-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: proUsername,
            clientName,
            clientEmail,
            clientPhone,
            date: scheduledAt,
            notes: `Service: ${selectedService.name}`,
            estimatedServiceTotalEur: selectedService.price,
            paymentChoice,
          }),
        })
        const data = await res.json()
        if (res.ok && data?.url) {
          window.location.href = data.url
          return
        }
        throw new Error(data.error || 'Erreur paiement')
      }
      
      // Sinon, réservation directe (uniquement si paiement non requis)
      if (paymentRequired) {
        throw new Error('Le paiement en ligne est obligatoire pour ce professionnel. Veuillez réessayer ou contacter le support.')
      }
      
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pro_id: proId,
          pro_username: proUsername,
          pro_name: proName,
          service_id: selectedService.id,
          service_name: selectedService.name,
          scheduled_at: scheduledAt,
          duration_minutes: parseDurationToMinutes(selectedService.duration),
          price: selectedService.price,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la réservation')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réservation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <AnimatePresence mode="wait">
        <motion.div
          key={success ? 'success' : step}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Success state */}
          {success && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Réservation confirmée !</h2>
              <p className="text-slate-500 text-sm mb-2">Votre RDV avec <strong>{proName}</strong> est enregistré.</p>
              <p className="text-slate-500 text-sm mb-6">
                {selectedService?.name} · {selectedDate && new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedTime}
              </p>
              <button onClick={handleClose} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl w-full">
                Fermer
              </button>
            </div>
          )}

          {/* Progress Steps */}
          {!success && <div className="flex items-center justify-center mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    step >= i
                      ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {i}
                </div>
                {i < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      step > i ? 'bg-gradient-to-r from-violet-600 to-rose-500' : 'bg-stone-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>}

          {/* Step 1: Choose Service */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Choisir un service</h2>
              <div className="space-y-3 mb-6">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedService?.id === service.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-stone-200 hover:border-violet-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService?.id === service.id}
                        onChange={() => setSelectedService(service)}
                        className="w-4 h-4 text-violet-600"
                      />
                      <div>
                        <div className="font-medium text-stone-900">{service.name}</div>
                        <div className="text-sm text-stone-500">{formatDuration(parseDurationToMinutes(service.duration) || 0)}</div>
                      </div>
                    </div>
                    <div className="font-semibold text-stone-900">{service.price}€</div>
                  </label>
                ))}
              </div>
              {selectedService && (
                <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl mb-4">
                  <span className="font-medium text-stone-900">Total:</span>
                  <span className="text-xl font-bold text-violet-600">{selectedService.price}€</span>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!selectedService}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Date/Time + Client Info */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Vos informations</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">Votre nom *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Marie Dupont"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">Votre email *</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="marie@email.com"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">Téléphone (SMS de confirmation)</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">Heure</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                        selectedTime === time
                          ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white'
                          : 'border border-stone-200 text-stone-700 hover:border-violet-400'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl mb-4">
                  <span className="font-medium text-stone-900">
                    {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="font-semibold text-violet-600">{selectedTime}</span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors"
                >
                  ← Précédent
                </button>
                <button
                  onClick={handleNext}
                  disabled={!clientName || !clientEmail || !selectedDate || !selectedTime}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment & Confirmation */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Paiement & Confirmation</h2>
              
              <div className="bg-stone-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                  Récapitulatif
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Service:</span>
                    <span className="font-medium text-stone-900">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Prix:</span>
                    <span className="font-medium text-stone-900">{selectedService?.price}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Date:</span>
                    <span className="font-medium text-stone-900">
                      {selectedDate && new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Heure:</span>
                    <span className="font-medium text-stone-900">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Durée:</span>
                    <span className="font-medium text-stone-900">{formatDuration(parseDurationToMinutes(selectedService?.duration) || 0)}</span>
                  </div>
                </div>
                <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between">
                  <span className="font-semibold text-stone-900">Total:</span>
                  <span className="text-xl font-bold text-violet-600">{selectedService?.price}€</span>
                </div>
              </div>

              {/* Info paiement selon settings du pro */}
              {loadingSettings ? (
                <div className="mb-6 p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Chargement des options de paiement...</p>
                </div>
              ) : settings?.online_payment_enabled && canPayOnline ? (
                <div className="mb-6">
                  {/* Choix du mode de paiement si les deux sont disponibles */}
                  {settings.deposit_required && settings.allow_full_online_payment && (
                    <div className="mb-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                      <p className="text-sm font-medium text-stone-900 mb-3">Choisissez votre mode de paiement :</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-200 cursor-pointer hover:border-violet-400 transition-colors">
                          <input
                            type="radio"
                            name="paymentChoice"
                            value="deposit"
                            checked={paymentChoice === 'deposit'}
                            onChange={() => setPaymentChoice('deposit')}
                            className="w-4 h-4 text-violet-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-stone-900">
                              Acompte de {settings.deposit_type === 'percent' ? `${settings.deposit_value}%` : `${settings.deposit_value}€`}
                            </p>
                            <p className="text-xs text-stone-500">
                              ({settings.deposit_type === 'percent' 
                                ? `${Math.round((selectedService?.price || 0) * settings.deposit_value / 100)}€` 
                                : `${settings.deposit_value}€`} à payer maintenant)
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-200 cursor-pointer hover:border-violet-400 transition-colors">
                          <input
                            type="radio"
                            name="paymentChoice"
                            value="full"
                            checked={paymentChoice === 'full'}
                            onChange={() => setPaymentChoice('full')}
                            className="w-4 h-4 text-violet-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-stone-900">Paiement intégral</p>
                            <p className="text-xs text-stone-500">{selectedService?.price}€ à payer maintenant</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Affichage du mode choisi ou forcé */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-emerald-800">
                        {!settings.deposit_required && settings.allow_full_online_payment
                          ? 'Paiement intégral en ligne sécurisé (Stripe)'
                          : settings.deposit_required && !settings.allow_full_online_payment
                            ? settings.deposit_type === 'percent'
                              ? `Acompte de ${settings.deposit_value}% requis (${Math.round((selectedService?.price || 0) * settings.deposit_value / 100)}€)`
                              : `Acompte de ${settings.deposit_value}€ requis`
                            : paymentChoice === 'full'
                              ? 'Paiement intégral en ligne sécurisé (Stripe)'
                              : settings.deposit_type === 'percent'
                                ? `Acompte de ${settings.deposit_value}% (${Math.round((selectedService?.price || 0) * settings.deposit_value / 100)}€)`
                                : `Acompte de ${settings.deposit_value}€`}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-600">
                      Vous serez redirigé vers Stripe pour finaliser le paiement sécurisé.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-sm text-stone-600">
                    Règlement direct avec {proName}. Aucun paiement en ligne requis.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 mb-6 p-3 bg-blue-50 rounded-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p className="text-sm text-blue-800">
                  Vous recevrez une confirmation par email et SMS (optionnel).
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
              )}

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={handleNext}
                  disabled={submitting || loadingSettings || (paymentRequired && !canPayOnline)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Patientez...' : 
                   loadingSettings ? 'Chargement...' :
                   paymentRequired ? 'Payer et réserver' :
                   canPayOnline ? 'Payer et réserver' : 
                   'Confirmer la réservation'}
                </button>
              </div>
            </div>
          )}

          {/* Close Button */}
          {!success && <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
