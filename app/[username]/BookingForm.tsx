'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BookingPaymentSettings } from '@/lib/booking-payment-settings'

type PublicBookingSettings = BookingPaymentSettings & {
  username: string
  professionalName?: string | null
}

export default function BookingForm({ username }: { username: string }) {
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
    notes: '',
  })
  const [estimatedEur, setEstimatedEur] = useState('')
  const [settings, setSettings] = useState<PublicBookingSettings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [paymentChoice, setPaymentChoice] = useState<'deposit' | 'full'>('deposit')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [successKind, setSuccessKind] = useState<'direct' | 'stripe' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('booking') === 'success') {
      setStatus('success')
      setSuccessKind('stripe')
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
    return () => {
      cancelled = true
    }
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

  const primaryLabel = useMemo(() => {
    if (!settings) return 'Chargement...'
    if (!settings.online_payment_enabled) return 'Demander un rendez-vous'
    if (!canPayOnline) return 'Demander un rendez-vous'
    if (!settings.deposit_required && settings.allow_full_online_payment) {
      return 'Payer en ligne et réserver'
    }
    if (settings.deposit_required && !settings.allow_full_online_payment) {
      return "Payer l'acompte et réserver"
    }
    return paymentChoice === 'full' ? 'Payer le montant total et réserver' : "Payer l'acompte et réserver"
  }, [settings, canPayOnline, paymentChoice])

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-1">Demande enregistrée !</h3>
        <p className="text-stone-500 text-sm">
          {successKind === 'stripe'
            ? 'Paiement confirmé. Votre rendez-vous est enregistré et le SMS de confirmation part si un numéro a été indiqué.'
            : 'Le professionnel a bien reçu votre demande. Le règlement se fera directement avec lui.'}
        </p>
        <button
          onClick={() => {
            setStatus('idle')
            setSuccessKind(null)
            setForm({ clientName: '', clientEmail: '', clientPhone: '', date: '', notes: '' })
            setEstimatedEur('')
          }}
          className="mt-6 text-emerald-600 text-sm font-medium hover:underline"
        >
          Faire une autre demande
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {loadingSettings && (
        <p className="text-stone-400 text-sm">Chargement des options de réservation...</p>
      )}
      {settingsError && !loadingSettings && (
        <p className="text-amber-700 text-sm bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">{settingsError}</p>
      )}
      {settings && !settings.online_payment_enabled && (
        <p className="text-stone-600 text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
          {settings.professionalName || 'Ce professionnel'} a choisi le règlement hors ligne : vous réservez ici, le paiement se
          fait directement avec lui.
        </p>
      )}
      {settings && settings.online_payment_enabled && canPayOnline && (
        <div className="text-stone-600 text-sm bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          Paiement sécurisé sur CalendaPro (Stripe). Montant calculé selon les règles définies par le professionnel.
        </div>
      )}
      {settings && settings.online_payment_enabled && !canPayOnline && (
        <p className="text-stone-600 text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
          Aucun encaissement en ligne n&apos;est activé pour le moment : réservation simple, règlement avec le professionnel.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-stone-600 mb-1 block font-medium">Votre nom *</label>
          <input
            type="text"
            placeholder="Marie Dupont"
            value={form.clientName}
            onChange={e => setForm({ ...form, clientName: e.target.value })}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-stone-600 mb-1 block font-medium">Votre email *</label>
          <input
            type="email"
            placeholder="marie@email.com"
            value={form.clientEmail}
            onChange={e => setForm({ ...form, clientEmail: e.target.value })}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm text-stone-600 mb-1 block font-medium">
          Votre téléphone
          <span className="text-stone-400 font-normal ml-1">(SMS de confirmation si activé par le pro)</span>
        </label>
        <input
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={form.clientPhone}
          onChange={e => setForm({ ...form, clientPhone: e.target.value })}
          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-stone-600 mb-1 block font-medium">Date et heure souhaitée *</label>
        <input
          type="datetime-local"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors text-sm"
        />
      </div>

      {needsEstimated && (
        <div>
          <label className="text-sm text-stone-600 mb-1 block font-medium">Montant estimé de la prestation (€) *</label>
          <input
            type="number"
            inputMode="decimal"
            min={0.5}
            step={0.01}
            placeholder="Ex. 80"
            value={estimatedEur}
            onChange={e => setEstimatedEur(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors text-sm"
          />
          <p className="text-stone-400 text-xs mt-1">
            Sert au calcul de l&apos;acompte (%) ou du paiement intégral. Le tarif final peut être ajusté avec le professionnel.
          </p>
        </div>
      )}

      {settings?.online_payment_enabled &&
        settings.deposit_required &&
        settings.allow_full_online_payment && (
          <fieldset className="border border-stone-200 rounded-xl p-3 flex flex-col gap-2">
            <legend className="text-xs font-semibold text-stone-500 px-1">Paiement en ligne</legend>
            <label className="flex items-center gap-2 text-sm text-stone-800 cursor-pointer">
              <input
                type="radio"
                name="pay"
                checked={paymentChoice === 'deposit'}
                onChange={() => setPaymentChoice('deposit')}
              />
              Acompte seulement
              {settings.deposit_type === 'percent' ? ` (${settings.deposit_value}%)` : ` (${settings.deposit_value} €)`}
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-800 cursor-pointer">
              <input type="radio" name="pay" checked={paymentChoice === 'full'} onChange={() => setPaymentChoice('full')} />
              Paiement intégral en ligne
            </label>
          </fieldset>
        )}

      <div>
        <label className="text-sm text-stone-600 mb-1 block font-medium">Message</label>
        <textarea
          placeholder="Décrivez votre besoin en quelques mots..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors text-sm resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl border border-red-100">
          Une erreur est survenue. Vérifiez les champs ou réessayez.
        </p>
      )}

      <button
        onClick={async () => {
          if (!form.clientName || !form.date || !form.clientEmail) return
          if (needsEstimated) {
            const n = Number(estimatedEur.replace(',', '.'))
            if (!Number.isFinite(n) || n < 0.5) {
              setStatus('error')
              return
            }
          }

          if (!settings) return

          if (!settings.online_payment_enabled || !canPayOnline) {
            setStatus('loading')
            try {
              const res = await fetch('/api/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, ...form }),
              })
              if (res.ok) {
                setSuccessKind('direct')
                setStatus('success')
              } else setStatus('error')
            } catch {
              setStatus('error')
            }
            return
          }

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
              }),
            })
            const data = await res.json()
            if (res.ok && data?.url) {
              window.location.href = data.url
              return
            }
            setStatus('error')
          } catch {
            setStatus('error')
          }
        }}
        disabled={status === 'loading' || loadingSettings}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors text-sm"
      >
        {status === 'loading' ? 'Patientez...' : primaryLabel}
      </button>

      <p className="text-stone-400 text-xs text-center">* Champs obligatoires</p>
    </div>
  )
}
