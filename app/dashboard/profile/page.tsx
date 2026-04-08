'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useUser } from '@clerk/nextjs'
import {
  normalizeBookingPaymentSettings,
  type BookingPaymentSettings,
  type DepositType,
  DEFAULT_DEPOSIT_PERCENT,
} from '@/lib/booking-payment-settings'
import type { LocalPhoto } from '@/components/onboarding/PhotoDropzone'

type ProfileRow = {
  username?: string
  full_name?: string | null
  bio?: string | null
  template?: 'minimal' | 'visual' | 'direct'
  accent_color?: string | null
  is_published?: boolean | null
  published_at?: string | null
} & Partial<BookingPaymentSettings>

const PhotoDropzone = dynamic(() => import('@/components/onboarding/PhotoDropzone'), { ssr: false })

function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  id?: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200
        ${disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}
        ${checked ? 'bg-violet-600' : 'bg-stone-200'}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-stone-200/80" />
      <div className="h-4 w-full max-w-md rounded bg-stone-200/60" />
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-32 rounded bg-stone-200/80" />
        <div className="space-y-3">
          <div className="h-10 w-full rounded-xl bg-stone-100" />
          <div className="h-10 w-full rounded-xl bg-stone-100" />
          <div className="h-24 w-full rounded-xl bg-stone-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-56 rounded bg-stone-200/80" />
        <div className="space-y-4">
          <div className="h-12 w-full rounded-xl bg-stone-100" />
          <div className="h-12 w-full rounded-xl bg-stone-100" />
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    online_payment_enabled: false,
    deposit_required: false,
    deposit_type: 'percent' as DepositType,
    deposit_value: DEFAULT_DEPOSIT_PERCENT,
    allow_full_online_payment: false,
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [designTemplate, setDesignTemplate] = useState<'minimal' | 'visual' | 'direct'>('minimal')
  const [designAccentColor, setDesignAccentColor] = useState<string>('#7c3aed')
  const [designLoading, setDesignLoading] = useState(false)

  const [galleryPhotos, setGalleryPhotos] = useState<Array<{ path: string; url: string }>>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [localPhotos, setLocalPhotos] = useState<LocalPhoto[]>([])

  const applyProfileData = useCallback(
    (data: ProfileRow | null) => {
      setProfile(data)
      setDesignTemplate((data?.template ?? 'minimal') as 'minimal' | 'visual' | 'direct')
      setDesignAccentColor(data?.accent_color ?? '#7c3aed')
      const pay = normalizeBookingPaymentSettings(data ?? {})
      const suggestedUser =
        user?.username ||
        user?.primaryEmailAddress?.emailAddress?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
        ''
      setForm({
        username: data?.username || suggestedUser || '',
        full_name: data?.full_name || user?.fullName || '',
        bio: data?.bio || '',
        online_payment_enabled: pay.online_payment_enabled,
        deposit_required: pay.deposit_required,
        deposit_type: pay.deposit_type,
        deposit_value: pay.deposit_value,
        allow_full_online_payment: pay.allow_full_online_payment,
      })
    },
    [user]
  )

  const loadProfile = useCallback(async () => {
    setLoadError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setLoadError(typeof data?.error === 'string' ? data.error : `Erreur ${res.status}`)
        applyProfileData(null)
        return
      }
      applyProfileData(data as ProfileRow | null)
    } catch {
      setLoadError('Réseau indisponible. Réessayez.')
      applyProfileData(null)
    } finally {
      setLoading(false)
    }
  }, [applyProfileData])

  const loadGallery = useCallback(async () => {
    setGalleryError(null)
    setGalleryLoading(true)
    try {
      const res = await fetch('/api/profile/photos')
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setGalleryError(typeof data?.error === 'string' ? data.error : `Erreur ${res.status}`)
        setGalleryPhotos([])
        return
      }
      setGalleryPhotos((Array.isArray(data?.photos) ? data.photos : []) as Array<{ path: string; url: string }>)
    } catch {
      setGalleryError('Réseau indisponible. Réessayez.')
      setGalleryPhotos([])
    } finally {
      setGalleryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!clerkLoaded) return
    void loadProfile()
    void loadGallery()
  }, [clerkLoaded, loadProfile])

  const launchConfetti = () => {
    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '999999'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#0f172a']
    const particles = Array.from({ length: 170 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 10 + 7,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
    }))

    let raf = 0
    const start = Date.now()
    const tick = () => {
      const t = Date.now() - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.35
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (t < 2000) raf = window.requestAnimationFrame(tick)
      else {
        window.cancelAnimationFrame(raf)
        window.removeEventListener('resize', resize)
        canvas.remove()
      }
    }
    raf = window.requestAnimationFrame(tick)
  }

  const deleteGalleryPhoto = useCallback(
    async (path: string) => {
      setGalleryError(null)
      try {
        const res = await fetch('/api/profile/photos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: [path] }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Suppression impossible')
        await loadGallery()
      } catch (e: any) {
        setGalleryError(e?.message ?? 'Erreur')
      }
    },
    [loadGallery],
  )

  const publishDesignAndGallery = useCallback(async () => {
    setDesignLoading(true)
    setGalleryError(null)
    try {
      // Upload local photos (les previews restent 100% locales)
      if (localPhotos.length > 0) {
        const fd = new FormData()
        for (const p of localPhotos) fd.append('files', p.file, p.name)
        const up = await fetch('/api/profile/photos', { method: 'POST', body: fd })
        const d = await up.json().catch(() => ({}))
        if (!up.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Upload photos impossible')
      }

      const resp = await fetch('/api/profile/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: designTemplate,
          accentColor: designAccentColor,
        }),
      })
      const data = await resp.json().catch(() => null)
      if (!resp.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Publication impossible')
      }

      setLocalPhotos([])
      launchConfetti()
      await loadProfile()
      await loadGallery()
    } catch (e: any) {
      setGalleryError(e?.message ?? 'Erreur')
    } finally {
      setDesignLoading(false)
    }
  }, [designAccentColor, designTemplate, localPhotos, loadGallery, loadProfile])

  const save = async () => {
    if (!form.username.trim()) {
      setSaveError('Choisissez un nom d’URL (username).')
      return
    }
    setSaveError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(typeof data?.error === 'string' ? data.error : 'Sauvegarde impossible.')
        return
      }
      setProfile(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2800)
    } catch {
      setSaveError('Réseau indisponible.')
    }
  }

  const payLocked = !form.online_payment_enabled
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f7f4] to-[#f0efe9] pb-24">
      <div className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-col gap-1 px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-100">
              Profil public
            </span>
            {profile?.username && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Page en ligne
              </span>
            )}
          </div>
          <h1 className="font-['Clash_Display',sans-serif] text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Votre vitrine &amp; paiements
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-500">
            Même endroit pour votre identité publique (nom, URL, bio) et pour les règles de réservation : acompte en
            % ou en euros, paiement total en ligne, ou simple demande de RDV sans encaissement sur CalendaPro.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 pt-8 sm:px-8">
        {!clerkLoaded || loading ? (
          <SkeletonBlock />
        ) : (
          <>
            {loadError && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-800 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong className="font-semibold">Impossible de charger le profil.</strong> {loadError} — souvent lié à
                  Supabase (migration SQL ou clés .env). Vérifiez la console serveur.
                </span>
                <button
                  type="button"
                  onClick={() => void loadProfile()}
                  className="shrink-0 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-900 transition hover:bg-red-200"
                >
                  Réessayer
                </button>
              </div>
            )}

            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-8">
              <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-[0_2px_24px_rgba(15,23,42,0.04)] sm:p-8">
                  <h2 className="mb-1 font-['Clash_Display',sans-serif] text-lg font-semibold text-stone-900">
                    Identité
                  </h2>
                  <p className="mb-6 text-sm text-stone-500">Ce que voient vos clients sur votre page publique.</p>
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        placeholder="Marie Dupont"
                        value={form.full_name}
                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 outline-none ring-violet-500/20 transition placeholder:text-stone-400 focus:border-violet-300 focus:bg-white focus:ring-4"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                        URL publique
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <span className="flex shrink-0 items-center rounded-xl border border-stone-200 bg-stone-100 px-3 text-xs text-stone-500">
                          {appOrigin || '…'}/
                        </span>
                        <input
                          type="text"
                          placeholder="marie-dupont"
                          value={form.username}
                          onChange={e =>
                            setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '-') })
                          }
                          className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 outline-none ring-violet-500/20 transition focus:border-violet-300 focus:bg-white focus:ring-4"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Bio
                      </label>
                      <textarea
                        placeholder="Une phrase qui donne envie de réserver…"
                        value={form.bio}
                        onChange={e => setForm({ ...form, bio: e.target.value })}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 outline-none ring-violet-500/20 transition placeholder:text-stone-400 focus:border-violet-300 focus:bg-white focus:ring-4"
                      />
                    </div>
                  </div>
                </section>

                <section
                  id="design-publication"
                  className="scroll-mt-8 rounded-2xl border border-violet-100/80 bg-gradient-to-br from-white to-violet-50/30 p-6 shadow-[0_2px_24px_rgba(124,58,237,0.06)] sm:p-8"
                >
                  <h2 className="mb-1 font-['Clash_Display',sans-serif] text-lg font-semibold text-stone-900">
                    Design &amp; Publication
                  </h2>
                  <p className="mb-6 text-sm leading-relaxed text-stone-600">
                    Choisissez votre template, palette et galerie. La publication met votre page en ligne.
                  </p>

                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Template</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {([
                          ['minimal', 'Minimal'],
                          ['visual', 'Visuel'],
                          ['direct', 'Direct'],
                        ] as Array<[ProfileRow['template'], string]>).map(([t, label]) => (
                          <button
                            key={t ?? label}
                            type="button"
                            onClick={() => setDesignTemplate((t as any) ?? 'minimal')}
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:shadow-md"
                            style={{
                              borderColor: designTemplate === t ? `${designAccentColor}66` : '#e7e5e4',
                              boxShadow:
                                designTemplate === t ? `0 0 0 2px ${designAccentColor}22, 0 18px 50px rgba(124,58,237,0.10)` : undefined,
                            }}
                          >
                            <div className="font-semibold text-stone-900">{label}</div>
                            <div className="mt-1 text-xs text-stone-500">
                              {t === 'minimal' ? 'Épuré & conversion' : t === 'visual' ? 'Ambiance & photos' : 'Widget visible direct'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Palette</p>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { id: 'violet', accent: '#7c3aed' },
                          { id: 'bleu', accent: '#0f172a' },
                          { id: 'vert', accent: '#10b981' },
                          { id: 'rose', accent: '#ec4899' },
                          { id: 'noir', accent: '#111827' },
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setDesignAccentColor(p.accent)}
                            className="h-12 w-12 rounded-full border border-stone-200 transition hover:scale-[1.03]"
                            style={{
                              background: p.accent,
                              boxShadow: designAccentColor === p.accent ? `0 0 0 4px ${p.accent}33` : undefined,
                            }}
                            aria-label={`Palette ${p.accent}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Galerie</p>
                          <p className="mt-1 text-xs text-stone-500">
                            {galleryLoading ? 'Chargement…' : `${galleryPhotos.length} photo(s) en ligne`}
                          </p>
                        </div>
                      </div>

                      {galleryError && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          {galleryError}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {galleryPhotos.slice(0, 12).map(p => (
                          <div key={p.path} className="relative overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
                            <img src={p.url} alt="Photo galerie" className="w-full h-20 object-cover" />
                            <button
                              type="button"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/70"
                              onClick={() => void deleteGalleryPhoto(p.path)}
                              aria-label="Supprimer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <PhotoDropzone photos={localPhotos} onChange={setLocalPhotos} label="Ajouter des photos" disabled={designLoading} />
                        <p className="text-xs text-stone-500 mt-2">La publication uploadera les photos sélectionnées.</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-4">
                      <div className="text-xs text-stone-500">
                        Accent : <span className="font-semibold" style={{ color: designAccentColor }}>{designAccentColor}</span>
                      </div>
                      <button
                        type="button"
                        disabled={designLoading}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                        onClick={() => void publishDesignAndGallery()}
                      >
                        {designLoading ? 'Publication…' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </section>

                <section
                  id="paiements-reservations"
                  className="scroll-mt-8 rounded-2xl border border-violet-100/80 bg-gradient-to-br from-white to-violet-50/30 p-6 shadow-[0_2px_24px_rgba(124,58,237,0.06)] sm:p-8"
                >
                  <h2 className="mb-1 font-['Clash_Display',sans-serif] text-lg font-semibold text-stone-900">
                    Paiements &amp; réservations
                  </h2>
                  <p className="mb-6 text-sm leading-relaxed text-stone-600">
                    Contrôlez Stripe côté client : acompte typique <strong>20–30&nbsp;%</strong> (nous préremplissons{' '}
                    {DEFAULT_DEPOSIT_PERCENT}&nbsp;%), ou montant fixe. Combinez avec le paiement intégral si vous voulez.
                  </p>

                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-stone-100 bg-white/80 p-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Paiement en ligne sur CalendaPro</p>
                        <p className="mt-1 text-xs leading-relaxed text-stone-500">
                          Désactivé : le client envoie une demande et règle avec vous hors plateforme.
                        </p>
                      </div>
                      <Toggle
                        checked={form.online_payment_enabled}
                        onChange={v =>
                          setForm(f => ({
                            ...f,
                            online_payment_enabled: v,
                            ...(v ? {} : { deposit_required: false, allow_full_online_payment: false }),
                          }))
                        }
                      />
                    </div>

                    <div
                      className={`space-y-5 rounded-xl border border-stone-100 bg-white/60 p-4 ${payLocked ? 'pointer-events-none opacity-45' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">Acompte obligatoire</p>
                          <p className="mt-1 text-xs text-stone-500">Carte requise pour confirmer le créneau.</p>
                        </div>
                        <Toggle
                          checked={form.deposit_required}
                          disabled={payLocked}
                          onChange={v => setForm({ ...form, deposit_required: v })}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-stone-500">Type d&apos;acompte</label>
                          <select
                            value={form.deposit_type}
                            disabled={payLocked || !form.deposit_required}
                            onChange={e => setForm({ ...form, deposit_type: e.target.value as DepositType })}
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-violet-300 disabled:opacity-50"
                          >
                            <option value="percent">Pourcentage du montant estimé</option>
                            <option value="fixed">Montant fixe (€)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-stone-500">
                            Valeur {form.deposit_type === 'percent' ? '(%)' : '(€)'}
                          </label>
                          <input
                            type="number"
                            min={form.deposit_type === 'percent' ? 1 : 0.5}
                            max={form.deposit_type === 'percent' ? 100 : 10000}
                            step={form.deposit_type === 'percent' ? 1 : 0.5}
                            disabled={payLocked || !form.deposit_required}
                            value={form.deposit_value}
                            onChange={e => setForm({ ...form, deposit_value: Number(e.target.value) })}
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-violet-300 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-t border-stone-100 pt-4">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">Paiement total en ligne</p>
                          <p className="mt-1 text-xs text-stone-500">
                            Le client peut tout régler d&apos;un coup (montant estimé). Compatible avec le choix
                            acompte / total.
                          </p>
                        </div>
                        <Toggle
                          checked={form.allow_full_online_payment}
                          disabled={payLocked}
                          onChange={v => setForm({ ...form, allow_full_online_payment: v })}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="sticky top-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Aperçu</p>
                  <p className="mt-2 font-['Clash_Display',sans-serif] text-base font-semibold text-stone-900">
                    {form.full_name || 'Votre nom'}
                  </p>
                  <p className="mt-1 break-all text-xs text-violet-600">
                    {appOrigin}
                    {form.username ? `/${form.username}` : '/…'}
                  </p>
                  {form.username && (
                    <Link
                      href={`/${form.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95"
                    >
                      Ouvrir la page publique
                    </Link>
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-4 text-xs leading-relaxed text-stone-500">
                  Les encaissements passent par <strong className="text-stone-700">Stripe</strong>. Exécutez la migration
                  SQL sur Supabase si les options ne se sauvent pas (colonnes{' '}
                  <code className="rounded bg-stone-200/80 px-1">profiles.*payment*</code>).
                </div>
              </aside>
            </div>

            {saveError && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {saveError}
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200/90 bg-white/95 px-4 py-3 backdrop-blur-md sm:pl-[252px]">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 sm:px-8">
                <p className="hidden text-xs text-stone-500 sm:block">
                  {saved ? 'Modifications enregistrées.' : 'N’oubliez pas d’enregistrer vos changements.'}
                </p>
                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => void loadProfile()}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
                  >
                    Actualiser
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-95"
                  >
                    {saved ? '✓ Enregistré' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
