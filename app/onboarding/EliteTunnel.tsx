'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { smartTemplateFrom, type SmartTemplate, type Goal } from '@/lib/smart-template'

const PhotoDropzone = dynamic(() => import('@/components/onboarding/PhotoDropzone'), { ssr: false })

type Palette = { id: string; name: string; accent: string }
type LocalPhoto = { id: string; file: File; previewUrl: string; name: string }

const PALETTES: Palette[] = [
  { id: 'violet-royal', name: 'Violet Royal', accent: '#7c3aed' },
  { id: 'bleu-minuit', name: 'Bleu Minuit', accent: '#0f172a' },
  { id: 'vert-emerald', name: 'Vert Émeraude', accent: '#10b981' },
  { id: 'rose-calenda', name: 'Rose CalendaPro', accent: '#ec4899' },
  { id: 'noir-minimal', name: 'Noir Minimal', accent: '#111827' },
]

const GOALS: { id: Goal; label: string; desc: string }[] = [
  { id: 'clients', label: 'Attirer des clients', desc: 'Vendre davantage via la Marketplace.' },
  { id: 'time', label: 'Gagner du temps', desc: 'Réservation rapide, moins d’allers-retours.' },
  { id: 'revenue', label: 'Augmenter les revenus', desc: 'Remplir les créneaux et maximiser le CA.' },
  { id: 'noshows', label: 'Réduire les no-shows', desc: 'Rappels et paiement pour sécuriser les RDV.' },
]

const METIERS: { id: string; label: string; group: 'visual' | 'direct' | 'minimal' }[] = [
  // VISUAL
  { id: 'barbier', label: 'Barbier', group: 'visual' },
  { id: 'coiffeur', label: 'Coiffeur / Coiffeuse', group: 'visual' },
  { id: 'photographe', label: 'Photographe', group: 'visual' },
  { id: 'videaste', label: 'Vidéaste', group: 'visual' },
  { id: 'estheticienne', label: 'Esthéticienne', group: 'visual' },
  { id: 'massage', label: 'Masseur-thérapeute', group: 'visual' },
  { id: 'graphiste', label: 'Graphiste freelance', group: 'visual' },
  // DIRECT
  { id: 'coach-vie', label: 'Coach de vie', group: 'direct' },
  { id: 'coach-sport', label: 'Coach sportif', group: 'direct' },
  { id: 'consultant', label: 'Consultant', group: 'direct' },
  { id: 'psychologue', label: 'Psychologue', group: 'direct' },
  { id: 'kine', label: 'Kinésithérapeute', group: 'direct' },
  { id: 'osteopathe', label: 'Ostéopathe', group: 'direct' },
  // MINIMAL
  { id: 'developpeur', label: 'Développeur freelance', group: 'minimal' },
  { id: 'formateur', label: 'Formateur', group: 'minimal' },
  { id: 'professeur', label: 'Professeur particulier', group: 'minimal' },
  { id: 'avocat', label: 'Avocat', group: 'minimal' },
  { id: 'autre', label: 'Autre activité', group: 'minimal' },
]

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function launchConfetti() {
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
  const particles = Array.from({ length: 180 }).map(() => ({
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
    if (t < 2200) raf = window.requestAnimationFrame(tick)
    else {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.remove()
    }
  }

  raf = window.requestAnimationFrame(tick)
}

function PreviewCard({
  title,
  template,
  accentColor,
  bio,
  photos,
  serviceName,
  onPick,
  picked,
}: {
  title: string
  template: SmartTemplate
  accentColor: string
  bio: string
  photos: LocalPhoto[]
  serviceName: string
  onPick?: () => void
  picked?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="rounded-2xl border text-left overflow-hidden bg-white shadow-sm transition hover:shadow-md"
      style={{
        borderColor: picked ? accentColor : '#e7e5e4',
        boxShadow: picked ? `0 0 0 2px ${accentColor}33, 0 18px 50px rgba(124,58,237,0.12)` : undefined,
      }}
    >
      <div style={{ ['--accent' as any]: accentColor, padding: 16, background: 'linear-gradient(135deg, var(--accent), rgba(236,72,153,0.92))' }}>
        <div className="text-white font-bold">{title}</div>
        <div className="text-white/90 text-xs mt-1">{template}</div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            {title.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-stone-900 truncate">Votre nom</div>
            <div className="text-xs text-stone-500 truncate">{serviceName || 'Service'}</div>
          </div>
        </div>
        {bio ? <p className="text-xs text-stone-500 mt-3 line-clamp-2">{bio}</p> : <div className="text-xs text-stone-400 mt-3">Bio en cours…</div>}
        {photos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-1">
            {photos.slice(0, 3).map(p => (
              <div key={p.id} className="overflow-hidden rounded-lg border border-stone-100">
                <img src={p.previewUrl} alt={p.name} className="w-full h-14 object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

export default function EliteTunnel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()

  const [role, setRole] = useState<'pro' | 'client' | null>(null)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [category, setCategory] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('')
  const [goal, setGoal] = useState<Goal>('clients')

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')

  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('1h')
  const [servicePrice, setServicePrice] = useState<number>(0)

  const [accentColor, setAccentColor] = useState(PALETTES[0].accent)
  const [template, setTemplate] = useState<SmartTemplate>('minimal')
  const [templateTouched, setTemplateTouched] = useState(false)

  const [photos, setPhotos] = useState<LocalPhoto[]>([])

  const [aiLoading, setAiLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const smartSuggestion = useMemo(() => {
    if (!category) return 'minimal'
    return smartTemplateFrom(category, goal)
  }, [category, goal])

  useEffect(() => {
    const r = searchParams.get('role')
    if (r === 'pro' || r === 'client') {
      setRole(r)
      if (r === 'client') router.push('/marketplace')
      return
    }
    // Fallback: if no role is provided in the URL, start onboarding as pro
    // instead of staying on the loading screen indefinitely.
    setRole('pro')
  }, [router, searchParams])

  useEffect(() => {
    if (!isLoaded || !user) return
    if (!fullName) setFullName(user.fullName ?? user.firstName ?? '')
    if (!username) setUsername(user.username ?? slugify(user.fullName ?? user.firstName ?? 'pro'))
  }, [isLoaded, user, fullName, username])

  useEffect(() => {
    if (!templateTouched) setTemplate(smartSuggestion)
  }, [smartSuggestion])

  const onGenerateBio = async () => {
    setAiLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          goal,
          fullName,
          city,
          serviceName,
          serviceDuration,
          servicePrice,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error ?? 'Erreur AI')
      setBio(data.bio)
    } catch (e: any) {
      setError(e?.message ?? 'Erreur')
    } finally {
      setAiLoading(false)
    }
  }

  const createFirstService = useCallback(async () => {
    if (!serviceName) return
    await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: serviceName,
        duration: serviceDuration,
        price: Number(servicePrice),
      }),
    }).catch(() => {})
  }, [serviceDuration, serviceName, servicePrice])

  const publish = async () => {
    setPublishLoading(true)
    setError(null)
    try {
      // 1) Save profile identity + bio
      const r1 = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          full_name: fullName,
          bio,
        }),
      })
      const d1 = await r1.json().catch(() => ({}))
      if (!r1.ok) throw new Error(d1?.error ?? 'Profil non sauvegardé')

      // 2) Replace photos in storage (delete all current)
      const existing = await fetch('/api/profile/photos').then(r => r.json()).catch(() => ({ photos: [] }))
      const currentPaths = Array.isArray(existing?.photos) ? existing.photos.map((p: any) => p.path).filter(Boolean) : []
      if (currentPaths.length > 0) {
        await fetch('/api/profile/photos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: currentPaths }),
        })
      }

      // 3) Upload new photos (if any)
      if (photos.length > 0) {
        const fd = new FormData()
        for (const p of photos) fd.append('files', p.file, p.name)
        const up = await fetch('/api/profile/photos', { method: 'POST', body: fd })
        const d2 = await up.json().catch(() => ({}))
        if (!up.ok) throw new Error(d2?.error ?? 'Photos non uploadées')
      }

      // 4) Publish
      const r2 = await fetch('/api/profile/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, accentColor, bio }),
      })
      const d2 = await r2.json().catch(() => ({}))
      if (!r2.ok) throw new Error(d2?.error ?? 'Publication impossible')

      // 5) Confetti
      launchConfetti()
      router.push(`/${username}`)
    } catch (e: any) {
      setError(e?.message ?? 'Erreur')
    } finally {
      setPublishLoading(false)
    }
  }

  const canStep1 = !!category && fullName.trim().length > 1 && username.trim().length >= 3 && !!city.trim()
  const canStep2 = !!serviceName.trim() && Number(servicePrice) > 0

  if (!role) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm max-w-lg w-full">
          <h1 className="text-xl font-bold text-stone-900">Onboarding Elite</h1>
          <p className="text-stone-600 mt-2">Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div className="h-[3px] w-full bg-stone-200">
        <div
          className="h-full bg-[linear-gradient(135deg,#7c3aed,#ec4899)] transition-all"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm text-stone-400 font-medium mb-1">Onboarding Elite</p>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Votre page publique</h1>
            <p className="text-sm text-stone-500 mt-2">Infinity : IA bio, galerie illimitée, smart templates.</p>
          </div>
          <div className="text-sm text-stone-500 font-semibold">
            Étape {step} / 4
          </div>
        </div>

        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Étape 1 — Identité & métier</h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Métier</label>
                <select
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  value={category}
                  onChange={e => {
                    const id = e.target.value
                    setCategory(id)
                    const m = METIERS.find(x => x.id === id)
                    setCategoryLabel(m?.label ?? id)
                  }}
                >
                  <option value="">Choisir…</option>
                  {METIERS.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Objectif</label>
                <select
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  value={goal}
                  onChange={e => setGoal(e.target.value as Goal)}
                >
                  {GOALS.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Nom complet</label>
                <input
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Ville</label>
                <input
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Lyon, Paris…"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-stone-600 mb-1">URL publique (username)</label>
                <input
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  value={username}
                  onChange={e => setUsername(slugify(e.target.value))}
                  placeholder="votre-nom"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600" onClick={() => router.push('/dashboard')}>
                Annuler
              </button>
              <button type="button" className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" disabled={!canStep1} onClick={() => setStep(2)}>
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Étape 2 — Services & offre</h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-stone-600 mb-1">Nom de votre service</label>
                <input
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  placeholder="ex: Séance coaching sportif"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Durée</label>
                <select
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  value={serviceDuration}
                  onChange={e => setServiceDuration(e.target.value)}
                >
                  {['15 min', '30 min', '45 min', '1h', '1h30', '2h', '3h'].map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-600 mb-1">Prix (€)</label>
                <input
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300"
                  type="number"
                  min={1}
                  step={1}
                  value={servicePrice}
                  onChange={e => setServicePrice(Number(e.target.value))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-stone-600 mb-1">Bio</label>
                <textarea
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300 min-h-[100px]"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Une phrase percutante qui donne envie…"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={() => void onGenerateBio()}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {aiLoading ? 'Génération…' : '✨ Générer ma bio (Infinity)'}
                  </button>
                  <div className="text-xs text-stone-500">
                    Smart suggestion : <span className="font-semibold" style={{ color: accentColor }}>{smartSuggestion}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button type="button" className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600" onClick={() => setStep(1)}>
                Retour
              </button>
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                disabled={!canStep2}
                onClick={async () => {
                  await createFirstService()
                  setStep(3)
                }}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Étape 3 — Design Lab</h2>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-800">Palette</p>
                <p className="text-xs text-stone-500 mt-1">Choisissez votre accent.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {PALETTES.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setAccentColor(p.accent)}
                      className="h-12 w-12 rounded-full border border-stone-200 transition hover:scale-[1.03]"
                      style={{
                        background: p.accent,
                        boxShadow: accentColor === p.accent ? `0 0 0 4px ${p.accent}33` : undefined,
                      }}
                      aria-label={p.name}
                    />
                  ))}
                </div>

                <div className="mt-6">
                  <PhotoDropzone photos={photos as any} onChange={(next: any) => setPhotos(next)} label="Upload photos (Infinity : illimité)" />
                  <p className="text-xs text-stone-500 mt-2">
                    Les previews sont 100% locales (zéro réseau).
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-800">Previews temps réel</p>
                <p className="text-xs text-stone-500 mt-1">Minimal, Visuel, Direct.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PreviewCard
                    title="Minimal"
                    template="minimal"
                    accentColor={accentColor}
                    bio={bio}
                    photos={photos as any}
                    serviceName={serviceName}
                  />
                  <PreviewCard
                    title="Visuel"
                    template="visual"
                    accentColor={accentColor}
                    bio={bio}
                    photos={photos as any}
                    serviceName={serviceName}
                  />
                  <PreviewCard
                    title="Direct"
                    template="direct"
                    accentColor={accentColor}
                    bio={bio}
                    photos={photos as any}
                    serviceName={serviceName}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button type="button" className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600" onClick={() => setStep(2)}>
                Retour
              </button>
              <button type="button" className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white" onClick={() => setStep(4)}>
                Choisir le template
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Étape 4 — Template + Publier</h2>
            <div className="mt-2 text-xs text-stone-500">
              Smart suggestion (modifiable) : <span className="font-semibold" style={{ color: accentColor }}>{smartSuggestion}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <PreviewCard
                title="Minimal"
                template="minimal"
                accentColor={accentColor}
                bio={bio}
                photos={photos as any}
                serviceName={serviceName}
                picked={template === 'minimal'}
                onPick={() => {
                  setTemplate('minimal')
                  setTemplateTouched(true)
                }}
              />
              <PreviewCard
                title="Visuel"
                template="visual"
                accentColor={accentColor}
                bio={bio}
                photos={photos as any}
                serviceName={serviceName}
                picked={template === 'visual'}
                onPick={() => {
                  setTemplate('visual')
                  setTemplateTouched(true)
                }}
              />
              <PreviewCard
                title="Direct"
                template="direct"
                accentColor={accentColor}
                bio={bio}
                photos={photos as any}
                serviceName={serviceName}
                picked={template === 'direct'}
                onPick={() => {
                  setTemplate('direct')
                  setTemplateTouched(true)
                }}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600" onClick={() => setStep(3)}>
                Retour
              </button>
              <button
                type="button"
                disabled={publishLoading || !username.trim()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                onClick={async () => {
                  setTemplate(prev => prev || smartSuggestion)
                  await publish()
                }}
              >
                {publishLoading ? 'Publication…' : 'Publier ma page'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 text-xs text-stone-400 text-center">
          En cliquant sur publier, votre page est mise en ligne sur <span className="font-semibold text-stone-500">{username ? `/${username}` : '/...'}</span>.
        </div>
      </div>
    </div>
  )
}

