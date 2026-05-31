'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Check, ChevronLeft, ChevronRight, Lock, Shield, CreditCard, Calendar, Clock, User, AlertCircle, RotateCcw } from 'lucide-react'
import type { BookingPaymentSettings } from '@/lib/booking-payment-settings'
import { logger } from '@/lib/logger'

type PublicBookingSettings = BookingPaymentSettings & {
  username: string
  professionalName?: string | null
}

type TimeSlot = {
  time: string
  label: string
  available: boolean
}

// Generate a human-readable label from a "HH:MM" time string
function timeToLabel(time: string): string {
  const [h, m] = time.split(':')
  return m === '00' ? `${parseInt(h)}h` : `${parseInt(h)}h${m}`
}

// Get days of week starting from today
const getWeekDays = (weekOffset: number = 0) => {
  const days = []
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + (weekOffset * 7))
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    days.push({
      date,
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      dayNum: date.getDate(),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      fullDate: date.toISOString().split('T')[0],
      isToday: date.toDateString() === today.toDateString(),
    })
  }
  return days
}

export default function BookingForm({ username, trackingSource, professionalName }: { 
  username: string
  trackingSource?: string
  professionalName?: string | null
}) {
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
    notes: '',
  })
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [estimatedEur, setEstimatedEur] = useState('')
  const [settings, setSettings] = useState<PublicBookingSettings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [paymentChoice, setPaymentChoice] = useState<'deposit' | 'full'>('deposit')
  const [payOnSite, setPayOnSite] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successKind, setSuccessKind] = useState<'direct' | 'stripe' | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  // #31 - SessionStorage recovery key
  const STORAGE_KEY = `booking_form_${username}`

  // #31 - Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.form) setForm(parsed.form)
        if (parsed.selectedDate) setSelectedDate(parsed.selectedDate)
        if (parsed.selectedTime) setSelectedTime(parsed.selectedTime)
        if (parsed.paymentChoice) setPaymentChoice(parsed.paymentChoice)
        if (parsed.payOnSite !== undefined) setPayOnSite(parsed.payOnSite)
      }
    } catch {
      // Ignore errors
    }
  }, [STORAGE_KEY])

  // #31 - Save to sessionStorage when form changes
  useEffect(() => {
    try {
      const data = {
        form,
        selectedDate,
        selectedTime,
        paymentChoice,
        payOnSite,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Ignore errors
    }
  }, [form, selectedDate, selectedTime, paymentChoice, payOnSite, STORAGE_KEY])

  // #31 - Clear sessionStorage on successful booking
  const clearStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore errors
    }
  }, [STORAGE_KEY])

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])

  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([])
      return
    }
    let cancelled = false
    setLoadingSlots(true)
    setTimeSlots([])
    fetch(`/api/public/${encodeURIComponent(username)}/availability?date=${selectedDate}&duration=60`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data?.slots) {
          setTimeSlots(
            (data.slots as Array<{ time: string; available: boolean }>).map(s => ({
              time: s.time,
              label: timeToLabel(s.time),
              available: s.available,
            }))
          )
        }
        setLoadingSlots(false)
      })
      .catch(() => {
        if (!cancelled) setLoadingSlots(false)
      })
    return () => { cancelled = true }
  }, [selectedDate, username])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('booking') === 'success') {
      setStatus('success')
      setSuccessKind('stripe')
      clearStorage() // #31 - Nettoyer le sessionStorage
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingSettings(true)
    fetch(`/api/public/booking-settings?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data?.error) {
          setSettingsError(data.error)
          setSettings(null)
        } else {
          setSettingsError(null)
          setSettings(data as PublicBookingSettings)
        }
        setLoadingSettings(false)
      })
      .catch(() => {
        if (!cancelled) {
          setSettingsError('Impossible de charger les options de paiement.')
          setLoadingSettings(false)
        }
      })
    return () => { cancelled = true }
  }, [username])

  useEffect(() => {
    if (!settings) return
    if (!settings.deposit_required && settings.allow_full_online_payment) {
      setPaymentChoice('full')
    } else {
      setPaymentChoice('deposit')
    }
  }, [settings])

  const needsEstimated = useMemo(() => {
    if (!settings?.online_payment_enabled) return false
    const s = settings
    if (s.deposit_required && s.deposit_type === 'percent') {
      if (!s.allow_full_online_payment) return true
      return paymentChoice === 'deposit'
    }
    if (s.allow_full_online_payment && (!s.deposit_required || paymentChoice === 'full')) return true
    return false
  }, [settings, paymentChoice])

  const canPayOnline = !!settings?.online_payment_enabled && (!!settings?.deposit_required || !!settings?.allow_full_online_payment)
  const paymentRequired = !!settings?.online_payment_enabled && !!settings?.deposit_required

  const computedAmount = useMemo(() => {
    if (!settings?.online_payment_enabled || payOnSite) return 0
    if (!needsEstimated) {
      if (settings?.deposit_type === 'fixed') return settings.deposit_value
      return 0
    }
    const total = Number(estimatedEur.replace(',', '.'))
    if (!Number.isFinite(total) || total < 0.5) return 0
    if (paymentChoice === 'full') return total
    if (settings?.deposit_type === 'percent') return Math.round(total * (settings.deposit_value / 100) * 100) / 100
    return settings?.deposit_value || 0
  }, [settings, estimatedEur, paymentChoice, needsEstimated, payOnSite])

  const primaryLabel = useMemo(() => {
    if (!settings) return 'Chargement...'
    if (payOnSite) return 'Confirmer ma réservation'
    if (!settings.online_payment_enabled) return 'Demander un rendez-vous'
    if (!canPayOnline) return 'Demander un rendez-vous'
    if (!settings.deposit_required && settings.allow_full_online_payment) {
      return 'Payer en ligne et réserver'
    }
    if (settings.deposit_required && !settings.allow_full_online_payment) {
      return "Payer l'acompte et réserver"
    }
    return paymentChoice === 'full' ? 'Payer le montant total et réserver' : "Payer l'acompte et réserver"
  }, [settings, canPayOnline, paymentChoice, payOnSite])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    setForm(prev => ({ ...prev, date: '' }))
  }, [])

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time)
    const fullDateTime = `${selectedDate}T${time}`
    setForm(prev => ({ ...prev, date: fullDateTime }))
    setShowSummary(true)
  }, [selectedDate])

  const handleRetry = useCallback(() => {
    setStatus('idle')
    setErrorMessage('')
  }, [])

  const handleBooking = useCallback(async () => {
    if (!form.clientName || !form.date || !form.clientEmail) return
    if (needsEstimated && !payOnSite) {
      const n = Number(estimatedEur.replace(',', '.'))
      if (!Number.isFinite(n) || n < 0.5) {
        setStatus('error')
        setErrorMessage('Le montant estimé doit être d\'au moins 0,50 €')
        return
      }
    }

    // Track conversion: Booking initiated
    if (typeof window !== 'undefined') {
      logger.info('[TRACKING] Event: booking_initiated', { username, hasPayment: settings?.online_payment_enabled })
      if ((window as any).dataLayer) {  // reason: GTM dataLayer has no TS type declarations
        (window as any).dataLayer.push({  // reason: GTM dataLayer has no TS type declarations
          event: 'booking_initiated',
          username,
          hasPayment: settings?.online_payment_enabled,
          paymentChoice: settings?.online_payment_enabled ? paymentChoice : null,
          payOnSite,
        })
      }
    }

    if (!settings) return

    // Pay on site - direct booking
    if (payOnSite || !settings.online_payment_enabled || !canPayOnline) {
      if (paymentRequired && !canPayOnline) {
        setStatus('error')
        setErrorMessage('Ce professionnel exige un paiement en ligne qui n\'est pas disponible. Veuillez réessayer plus tard ou contacter le support.')
        return
      }

      setStatus('loading')
      try {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, ...form, source_channel: trackingSource }),
        })
        if (res.ok) {
          setSuccessKind('direct')
          setStatus('success')
          clearStorage() // #31 - Nettoyer le sessionStorage
        } else {
          const data = await res.json().catch(() => ({}))
          if (data.error?.includes('créneau') || data.error?.includes('SLOT_CONFLICT')) {
            setErrorMessage('Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Veuillez choisir un autre horaire.')
          } else if (data.error?.includes('Paiement requis')) {
            setErrorMessage('Ce professionnel exige un paiement en ligne. Veuillez sélectionner l\'option de paiement en ligne.')
          } else {
            setErrorMessage(data.error || 'Une erreur est survenue lors de la réservation. Veuillez réessayer.')
          }
          setStatus('error')
        }
      } catch {
        setStatus('error')
        setErrorMessage('Erreur de connexion. Vérifiez votre connexion internet et réessayez.')
      }
      return
    }

    // Online payment - Stripe checkout
    setStatus('loading')
    try {
      const res = await fetch('/api/stripe/booking-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          ...form,
          estimatedServiceTotalEur: needsEstimated
            ? Number(String(estimatedEur).replace(',', '.'))
            : undefined,
          paymentChoice,
          source_channel: trackingSource,
        }),
      })
      const data = await res.json()
      if (res.ok && data?.url) {
        window.location.href = data.url
        return
      }
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Le paiement a échoué. Veuillez vérifier vos informations et réessayer.')
        // Track conversion: Booking error
        if (typeof window !== 'undefined') {
          logger.info('[TRACKING] Event: booking_error', { username, stage: 'stripe_checkout' })
          if ((window as any).dataLayer) {  // reason: GTM dataLayer has no TS type declarations
            (window as any).dataLayer.push({  // reason: GTM dataLayer has no TS type declarations
              event: 'booking_error',
              username,
              stage: 'stripe_checkout',
              error: data.error,
            })
          }
        }
      }
    } catch {
      setStatus('error')
      setErrorMessage('Erreur de connexion au service de paiement. Veuillez réessayer.')
      if (typeof window !== 'undefined') {
        logger.info('[TRACKING] Event: booking_error', { username, stage: 'stripe_checkout_exception' })
        if ((window as any).dataLayer) {  // reason: GTM dataLayer has no TS type declarations
          (window as any).dataLayer.push({  // reason: GTM dataLayer has no TS type declarations
            event: 'booking_error',
            username,
            stage: 'stripe_checkout_exception',
          })
        }
      }
    }
  }, [form, needsEstimated, payOnSite, settings, paymentRequired, canPayOnline, username, trackingSource, paymentChoice, estimatedEur])

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-100)] flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-[var(--accent-600)]" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-1">
          {successKind === 'stripe' ? 'Paiement confirmé !' : 'Réservation confirmée !'}
        </h3>
        <p className="text-stone-500 text-sm">
          {successKind === 'stripe'
            ? 'Votre paiement a été accepté et votre rendez-vous est enregistré. Un email de confirmation vous a été envoyé.'
            : `Votre rendez-vous avec ${professionalName || 'le professionnel'} est confirmé. Le règlement se fera sur place.`}
        </p>
        <button
          onClick={() => {
            setStatus('idle')
            setSuccessKind(null)
            setForm({ clientName: '', clientEmail: '', clientPhone: '', date: '', notes: '' })
            setSelectedDate('')
            setSelectedTime('')
            setEstimatedEur('')
            setShowSummary(false)
          }}
          className="mt-6 text-[var(--accent-600)] text-sm font-medium hover:underline"
        >
          Faire une autre réservation
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {loadingSettings && (
        <p className="text-[var(--cl-text-muted)] text-sm">Chargement des options de réservation...</p>
      )}

      {settingsError && !loadingSettings && (
        <div className="flex items-start gap-2 text-amber-700 text-sm bg-amber-50/80 px-4 py-3 rounded-xl border border-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{settingsError}</span>
        </div>
      )}

      {/* Client Info */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--cl-text-primary)] mb-1.5 block">Votre nom *</label>
          <input
            type="text"
            inputMode="text"
            placeholder="Marie Dupont"
            value={form.clientName}
            onChange={e => setForm({ ...form, clientName: e.target.value })}
            className="w-full bg-[var(--cl-glass-sidebar)] border border-[var(--accent-20)] rounded-xl px-4 py-3 text-[var(--cl-text-primary)] placeholder-[var(--cl-text-muted)] focus:outline-none focus:border-[var(--accent-400)] focus:bg-[var(--cl-bg)] transition-colors text-base"
            style={{ fontSize: '16px', minHeight: 48 }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--cl-text-primary)] mb-1.5 block">Votre email *</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="marie@email.com"
            value={form.clientEmail}
            onChange={e => setForm({ ...form, clientEmail: e.target.value })}
            className="w-full bg-[var(--cl-glass-sidebar)] border border-[var(--accent-20)] rounded-xl px-4 py-3 text-[var(--cl-text-primary)] placeholder-[var(--cl-text-muted)] focus:outline-none focus:border-[var(--accent-400)] focus:bg-[var(--cl-bg)] transition-colors text-base"
            style={{ fontSize: '16px', minHeight: 48 }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--cl-text-primary)] mb-1.5 block">
            Votre téléphone <span className="text-[var(--cl-text-muted)] font-normal">(optionnel)</span>
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+33 6 12 34 56 78"
            value={form.clientPhone}
            onChange={e => setForm({ ...form, clientPhone: e.target.value })}
            className="w-full bg-[var(--cl-glass-sidebar)] border border-[var(--accent-20)] rounded-xl px-4 py-3 text-[var(--cl-text-primary)] placeholder-[var(--cl-text-muted)] focus:outline-none focus:border-[var(--accent-400)] focus:bg-[var(--cl-bg)] transition-colors text-base"
            style={{ fontSize: '16px', minHeight: 48 }}
          />
          <p className="text-[var(--cl-text-muted)] text-xs mt-1">Pour recevoir un SMS de rappel si activé par le professionnel</p>
        </div>
      </div>

      {/* Calendar Section */}
      <div>
        <label className="text-sm font-medium text-[var(--cl-text-primary)] mb-2 block">Choisissez une date *</label>
        
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
            className="p-2 rounded-lg hover:bg-[var(--accent-50)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--accent-600)]" />
          </button>
          <span className="text-sm font-medium text-[var(--cl-text-primary)]">
            {weekDays[0]?.month} {weekDays[0]?.date.getFullYear()}
          </span>
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-2 rounded-lg hover:bg-[var(--accent-50)] transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[var(--accent-600)]" />
          </button>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day) => (
            <button
              key={day.fullDate}
              onClick={() => handleDateSelect(day.fullDate)}
              className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                selectedDate === day.fullDate
                  ? 'bg-[var(--accent-500)] text-white border-[var(--accent-500)]'
                  : 'bg-[var(--cl-glass-sidebar)] border-[var(--accent-20)] hover:border-[var(--accent-300)]'
              }`}
            >
              <span className={`text-xs uppercase ${selectedDate === day.fullDate ? 'text-white/80' : 'text-[var(--cl-text-muted)]'}`}>
                {day.dayName}
              </span>
              <span className="text-lg font-bold">{day.dayNum}</span>
              {day.isToday && (
                <span className={`text-[10px] ${selectedDate === day.fullDate ? 'text-white/80' : 'text-[var(--accent-600)]'}`}>
                  Auj.
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="text-sm font-medium text-[var(--cl-text-primary)] mb-2 block">Choisissez un horaire *</label>
            {loadingSlots ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="py-2 px-1 rounded-lg bg-stone-100 animate-pulse h-9" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {timeSlots.length === 0 ? (
                  <p className="col-span-5 text-sm text-[var(--cl-text-muted)] py-2">Aucun créneau disponible pour ce jour.</p>
                ) : (
                  timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                        selectedTime === slot.time
                          ? 'bg-[var(--accent-500)] text-white'
                          : slot.available
                            ? 'bg-[var(--cl-glass-sidebar)] border border-[var(--accent-20)] hover:border-[var(--accent-400)] text-[var(--cl-text-primary)]'
                            : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))
                )}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--cl-text-muted)]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-[var(--cl-glass-sidebar)] border border-[var(--accent-20)]"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-stone-100 border border-stone-200"></div>
                <span>Indisponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-[var(--accent-500)]"></div>
                <span>Sélectionné</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Selection */}
      <div>
        <label className="text-sm font-medium text-[var(--cl-text-primary)] mb-2 block">Service souhaité</label>
        <textarea
          placeholder="Décrivez le service dont vous avez besoin..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full bg-[var(--cl-glass-sidebar)] border border-[var(--accent-20)] rounded-xl px-4 py-3 text-[var(--cl-text-primary)] placeholder-[var(--cl-text-muted)] focus:outline-none focus:border-[var(--accent-400)] focus:bg-[var(--cl-bg)] transition-colors text-base resize-none"
          style={{ fontSize: '16px', minHeight: 72 }}
        />
      </div>

      {/* Estimated Amount */}
      {needsEstimated && (
        <div>
          <label className="text-sm font-medium text-[var(--cl-text-primary)] mb-1.5 block">
            Montant estimé (€) * {settings?.deposit_type === 'percent' && <span className="text-[var(--accent-600)]">({settings.deposit_value}% d&apos;acompte)</span>}
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0.5}
            step={0.01}
            placeholder="Ex. 80"
            value={estimatedEur}
            onChange={e => setEstimatedEur(e.target.value)}
            className="w-full bg-[var(--cl-glass-sidebar)] border border-[var(--accent-20)] rounded-xl px-4 py-3 text-[var(--cl-text-primary)] placeholder-[var(--cl-text-muted)] focus:outline-none focus:border-[var(--accent-400)] focus:bg-[var(--cl-bg)] transition-colors text-base"
            style={{ fontSize: '16px', minHeight: 48 }}
          />
          <p className="text-[var(--cl-text-muted)] text-xs mt-1">
            Cette estimation sert au calcul de l&apos;acompte. Le tarif final sera confirmé avec le professionnel.
          </p>
        </div>
      )}

      {/* Payment Options */}
      {settings?.online_payment_enabled && canPayOnline && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--cl-text-primary)] block">Mode de paiement</label>
          
          {/* Pay Online Option */}
          <button
            onClick={() => setPayOnSite(false)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              !payOnSite 
                ? 'border-[var(--accent-500)] bg-[var(--accent-50)]' 
                : 'border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] hover:border-[var(--accent-300)]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
              !payOnSite ? 'border-[var(--accent-500)]' : 'border-[var(--accent-20)]'
            }`}>
              {!payOnSite && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-500)]" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--accent-600)]" />
                <span className="font-medium text-[var(--cl-text-primary)]">Payer en ligne maintenant</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Sécurisé</span>
              </div>
              <p className="text-xs text-[var(--cl-text-muted)] mt-1">
                Paiement sécurisé par Stripe. Votre rendez-vous est garanti.
              </p>
              {settings.deposit_required && settings.allow_full_online_payment && !payOnSite && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPaymentChoice('deposit') }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      paymentChoice === 'deposit'
                        ? 'bg-[var(--accent-500)] text-white border-[var(--accent-500)]'
                        : 'bg-white border-[var(--accent-20)] text-[var(--cl-text-muted)]'
                    }`}
                  >
                    Acompte {settings.deposit_type === 'percent' ? `${settings.deposit_value}%` : `${settings.deposit_value}€`}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPaymentChoice('full') }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      paymentChoice === 'full'
                        ? 'bg-[var(--accent-500)] text-white border-[var(--accent-500)]'
                        : 'bg-white border-[var(--accent-20)] text-[var(--cl-text-muted)]'
                    }`}
                  >
                    Paiement intégral
                  </button>
                </div>
              )}
            </div>
          </button>

          {/* Pay On Site Option — masqué si paiement obligatoire */}
          {!paymentRequired ? (
          <button
            onClick={() => setPayOnSite(true)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              payOnSite 
                ? 'border-[var(--accent-500)] bg-[var(--accent-50)]' 
                : 'border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] hover:border-[var(--accent-300)]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
              payOnSite ? 'border-[var(--accent-500)]' : 'border-[var(--accent-20)]'
            }`}>
              {payOnSite && <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-500)]" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--accent-600)]" />
                <span className="font-medium text-[var(--cl-text-primary)]">Payer sur place</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Sans acompte</span>
              </div>
              <p className="text-xs text-[var(--cl-text-muted)] mt-1">
                Réservez maintenant, réglez directement avec {professionalName || 'le professionnel'} lors de votre rendez-vous.
              </p>
            </div>
          </button>
          ) : (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200/70 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Ce professionnel exige un paiement en ligne pour confirmer votre réservation. Le paiement sur place n'est pas disponible.
            </p>
          </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--cl-text-muted)]">
              <Lock className="w-3.5 h-3.5" />
              <span>Paiement sécurisé SSL</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--cl-text-muted)]">
              <Shield className="w-3.5 h-3.5" />
              <span>Données protégées</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message with Retry */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">Une erreur est survenue</p>
              <p className="text-red-600 text-sm mt-1">{errorMessage || 'Veuillez vérifier vos informations et réessayer.'}</p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 rounded-lg text-red-700 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      )}

      {/* Sticky Summary & CTA */}
      {(showSummary || selectedDate) && (
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[var(--accent-20)] p-4 -mx-6 sm:mx-0 sm:rounded-xl sm:border sm:mt-4 sm:static sm:bg-[var(--cl-glass-sidebar)]">
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--cl-text-muted)] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Date
              </span>
              <span className="font-medium text-[var(--cl-text-primary)]">
                {selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}
                {selectedTime && ` à ${selectedTime}`}
              </span>
            </div>
            {computedAmount > 0 && !payOnSite && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--cl-text-muted)] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  À payer maintenant
                </span>
                <span className="font-bold text-[var(--accent-600)]">{computedAmount.toFixed(2)} €</span>
              </div>
            )}
            {payOnSite && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--cl-text-muted)] flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Paiement
                </span>
                <span className="font-medium text-blue-600">Sur place</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleBooking}
            disabled={status === 'loading' || loadingSettings || !form.clientName || !form.clientEmail || !form.date || (paymentRequired && !canPayOnline && !payOnSite)}
            className="w-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors text-base touch-target flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Patientez...
              </>
            ) : (
              <>
                {!payOnSite && computedAmount > 0 && <Lock className="w-4 h-4" />}
                {primaryLabel}
              </>
            )}
          </button>
          
          {!payOnSite && computedAmount > 0 && (
            <p className="text-center text-xs text-[var(--cl-text-muted)] mt-2 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Paiement sécurisé via Stripe
            </p>
          )}
        </div>
      )}

      <p className="text-[var(--cl-text-muted)] text-xs text-center">* Champs obligatoires</p>
    </div>
  )
}
