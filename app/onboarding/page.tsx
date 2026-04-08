'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { BrandLogo } from '@/components/BrandLogo'
import { smartTemplateFrom, type Goal, type SmartTemplate } from '@/lib/smart-template'

const PhotoDropzone = dynamic(() => import('@/components/onboarding/PhotoDropzone'), { ssr: false })

type Plan = 'free' | 'premium' | 'infinity'
type Step = 1 | 2 | 3 | 4

type Metier = { id: string; label: string; icon: React.ReactNode }
type Palette = { id: string; name: string; accent: string }
type LocalPhoto = { id: string; file: File; previewUrl: string; name: string }
type Service = { id: string; name: string; duration: string; price: string }

const COLORS = {
  violet: '#7c3aed',
  rose: '#ec4899',
  bg: '#fafaf8',
  dark: '#0f172a',
}

const transition: Transition = { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }

const STEPS: Array<{ id: Step; title: string; desc: string }> = [
  { id: 1, title: 'Identité', desc: 'Métier, objectif, et votre URL publique.' },
  { id: 2, title: 'Mon offre', desc: 'Un service principal clair et irrésistible.' },
  { id: 3, title: 'Votre identité visuelle', desc: 'Palette + photo de profil + preview live.' },
  { id: 4, title: 'Choisissez votre style', desc: 'Template + publication en un clic.' },
]

const CHECKLIST = [
  { label: 'Identité validée', minStep: 2 },
  { label: 'Offre prête', minStep: 3 },
  { label: 'Design configuré', minStep: 4 },
  { label: 'Page prête à publier', minStep: 4 },
]

const METIERS: Metier[] = [
  // Beauté & Bien-être
  { id: 'barbier', label: 'Barbier', icon: <ScissorsIcon /> },
  { id: 'coiffeur', label: 'Coiffeur·se', icon: <ScissorsIcon /> },
  { id: 'estheticienne', label: 'Esthéticienne', icon: <ScissorsIcon /> },
  { id: 'onglerie', label: 'Prothésiste ongulaire', icon: <ScissorsIcon /> },
  { id: 'maquillage', label: 'Maquilleuse', icon: <ScissorsIcon /> },
  { id: 'tatoueur', label: 'Tatoueur·se', icon: <ScissorsIcon /> },
  { id: 'piercing', label: 'Perceur·se', icon: <ScissorsIcon /> },
  { id: 'massage', label: 'Masseur·se', icon: <HeartIcon /> },
  { id: 'sophrologue', label: 'Sophrologue', icon: <HeartIcon /> },
  // Sport & Fitness
  { id: 'coach-sport', label: 'Coach sportif', icon: <BoltIcon /> },
  { id: 'coach-crossfit', label: 'Coach CrossFit', icon: <BoltIcon /> },
  { id: 'coach-yoga', label: 'Professeur de yoga', icon: <BoltIcon /> },
  { id: 'coach-pilates', label: 'Professeur Pilates', icon: <BoltIcon /> },
  { id: 'coach-natation', label: 'Coach natation', icon: <BoltIcon /> },
  { id: 'coach-boxe', label: 'Coach boxe / MMA', icon: <BoltIcon /> },
  { id: 'coach-course', label: 'Coach running', icon: <BoltIcon /> },
  // Santé
  { id: 'psychologue', label: 'Psychologue', icon: <HeartIcon /> },
  { id: 'psychotherapeute', label: 'Psychothérapeute', icon: <HeartIcon /> },
  { id: 'osteopathe', label: 'Ostéopathe', icon: <HeartIcon /> },
  { id: 'kine', label: 'Kinésithérapeute', icon: <HeartIcon /> },
  { id: 'nutritionniste', label: 'Nutritionniste', icon: <HeartIcon /> },
  { id: 'dieteticien', label: 'Diététicien·ne', icon: <HeartIcon /> },
  { id: 'acupuncteur', label: 'Acupuncteur·trice', icon: <HeartIcon /> },
  { id: 'naturopathe', label: 'Naturopathe', icon: <HeartIcon /> },
  { id: 'hypnotherapeute', label: 'Hypnothérapeute', icon: <HeartIcon /> },
  // Coaching & Conseil
  { id: 'coach-vie', label: 'Coach de vie', icon: <BoltIcon /> },
  { id: 'coach-business', label: 'Coach business', icon: <BriefcaseIcon /> },
  { id: 'coach-carriere', label: 'Coach carrière', icon: <BriefcaseIcon /> },
  { id: 'consultant', label: 'Consultant·e', icon: <BriefcaseIcon /> },
  { id: 'mentor', label: 'Mentor / Advisor', icon: <BriefcaseIcon /> },
  // Créatif
  { id: 'photographe', label: 'Photographe', icon: <CameraIcon /> },
  { id: 'videaste', label: 'Vidéaste', icon: <CameraIcon /> },
  { id: 'graphiste', label: 'Graphiste', icon: <CodeIcon /> },
  { id: 'illustrateur', label: 'Illustrateur·trice', icon: <CodeIcon /> },
  // Tech & Digital
  { id: 'developpeur', label: 'Développeur·se', icon: <CodeIcon /> },
  { id: 'designer-ux', label: 'Designer UX/UI', icon: <CodeIcon /> },
  { id: 'community-manager', label: 'Community Manager', icon: <UsersIcon /> },
  // Formation
  { id: 'formateur', label: 'Formateur·trice', icon: <BoltIcon /> },
  { id: 'professeur', label: 'Professeur particulier', icon: <BoltIcon /> },
  { id: 'tuteur', label: 'Tuteur·trice scolaire', icon: <BoltIcon /> },
  // Juridique & Finance
  { id: 'avocat', label: 'Avocat·e', icon: <BriefcaseIcon /> },
  { id: 'expert-comptable', label: 'Expert-comptable', icon: <BriefcaseIcon /> },
  { id: 'conseiller-financier', label: 'Conseiller financier', icon: <BriefcaseIcon /> },
  // Autre
  { id: 'autre', label: 'Autre activité', icon: <BoltIcon /> },
]

const GOALS: Array<{ id: Goal; label: string; desc: string; icon: React.ReactNode }> = [
  { id: 'noshows', label: 'Réduire no-shows', desc: 'Rappels & acomptes', icon: <BellIcon /> },
  { id: 'clients', label: 'Nouveaux clients', desc: 'Marketplace & SEO', icon: <UsersIcon /> },
  { id: 'time', label: 'Gagner du temps', desc: 'Automatiser', icon: <ClockIcon /> },
  { id: 'revenue', label: 'Plus de revenus', desc: 'Remplir les créneaux', icon: <EuroIcon /> },
]

const DURATIONS = [
  { id: '30min', label: '30min' },
  { id: '45min', label: '45min' },
  { id: '1h', label: '1h' },
  { id: '1h30', label: '1h30' },
  { id: '2h', label: '2h' },
] as const

const PALETTES: Palette[] = [
  { id: 'violet-royal', name: 'Violet Royal', accent: COLORS.violet },
  { id: 'rose-electrique', name: 'Rose Électrique', accent: COLORS.rose },
  { id: 'bleu-nuit', name: 'Bleu Nuit', accent: '#1e40af' },
  { id: 'vert-emeraude', name: 'Vert Émeraude', accent: '#059669' },
  { id: 'noir-minimal', name: 'Noir Minimal', accent: COLORS.dark },
]

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function launchConfetti(durationMs = 2000) {
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

  const colors = [COLORS.violet, COLORS.rose, '#059669', '#1e40af', COLORS.dark]
  const parts = Array.from({ length: 180 }).map(() => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * -window.innerHeight,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 10 + 7,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.2,
  }))

  const start = Date.now()
  let raf = 0
  const tick = () => {
    const t = Date.now() - start
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of parts) {
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
    if (t < durationMs) raf = window.requestAnimationFrame(tick)
    else {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.remove()
    }
  }
  raf = window.requestAnimationFrame(tick)
}

function gradientTextStyle(): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }
}

function SkeletonScreen({ label }: { label: string }) {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'grid', placeItems: 'center' }}>
      <div style={{ borderRadius: 18, background: 'white', border: '1px solid rgba(0,0,0,0.08)', padding: '1.6rem 1.8rem', width: 'min(520px, 92vw)' }}>
        <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: COLORS.dark }}>Onboarding Elite</div>
        <div style={{ marginTop: '0.55rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
      </div>
    </div>
  )
}

function EliteOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()

  const [step, setStep] = useState<Step>(1)
  const [plan, setPlan] = useState<Plan>('free')
  const [loadingPlan, setLoadingPlan] = useState(true)

  const [category, setCategory] = useState('')
  const [goal, setGoal] = useState<Goal>('clients')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [username, setUsername] = useState('')

  const [metierSearch, setMetierSearch] = useState('')
  const [showAllMetiers, setShowAllMetiers] = useState(false)

  const [services, setServices] = useState<Service[]>([{ id: '1', name: '', duration: '1h', price: '' }])
  const [bio, setBio] = useState('')

  const [accentColor, setAccentColor] = useState(COLORS.violet)
  const [profilePhoto, setProfilePhoto] = useState<LocalPhoto | null>(null)
  const [photos, setPhotos] = useState<LocalPhoto[]>([])

  const [aiLoading, setAiLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [template, setTemplate] = useState<SmartTemplate>('minimal')
  const recommendedTemplate = useMemo(() => smartTemplateFrom(category, goal), [category, goal])

  const categoryLabel = useMemo(() => METIERS.find(m => m.id === category)?.label ?? category, [category])
  const primaryService = useMemo(() => services.find(s => s.name.trim()) ?? services[0], [services])

  const filteredMetiers = useMemo(() => {
    if (metierSearch.length === 0) return METIERS
    const q = metierSearch.toLowerCase()
    return METIERS.filter(m => m.label.toLowerCase().includes(q))
  }, [metierSearch])

  const displayedMetiers = useMemo(() => {
    if (metierSearch.length > 0) return filteredMetiers
    if (showAllMetiers) return filteredMetiers
    return filteredMetiers.slice(0, 10)
  }, [filteredMetiers, metierSearch.length, showAllMetiers])

  const previewPhotoUrl = profilePhoto?.previewUrl ?? null

  const addService = () => setServices(prev => [...prev, { id: Date.now().toString(), name: '', duration: '1h', price: '' }])
  const removeService = (id: string) => setServices(prev => (prev.length <= 1 ? prev : prev.filter(s => s.id !== id)))
  const updateService = (id: string, field: keyof Service, value: string) =>
    setServices(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)))

  const fetchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([])
      return
    }
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,codesPostaux&boost=population&limit=8`,
      )
      const data = (await res.json()) as Array<{ nom: string; codesPostaux?: string[] }>
      setCitySuggestions(data.map(c => `${c.nom} (${c.codesPostaux?.[0] ?? ''})`))
    } catch {
      setCitySuggestions([])
    }
  }, [])

  const currentStepCopy = STEPS.find(s => s.id === step) ?? STEPS[0]

  useEffect(() => {
    const role = searchParams.get('role')
    if (role === 'client') router.replace('/marketplace')
  }, [router, searchParams])

  useEffect(() => {
    if (!isLoaded) return
    if (user) {
      setFullName(prev => prev || user.fullName || user.firstName || '')
      setUsername(prev => prev || user.username || slugify(user.fullName || user.firstName || 'pro'))
    }
  }, [isLoaded, user])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoadingPlan(true)
      try {
        const resp = await fetch('/api/profile')
        const data = await resp.json().catch(() => null)
        if (!mounted) return
        const p = data?.plan
        if (p === 'free' || p === 'premium' || p === 'infinity') setPlan(p)
      } finally {
        if (mounted) setLoadingPlan(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (plan === 'free') {
      setAccentColor(COLORS.violet)
      setTemplate('minimal')
    }
    if (plan === 'premium') {
      setTemplate('minimal')
    }
  }, [plan])

  const canUsePalette = (accent: string) => (plan !== 'free' ? true : accent === COLORS.violet)
  const canUseTemplate = (tpl: SmartTemplate) => (plan === 'infinity' ? true : tpl === 'minimal')

  const canStep1 = category && fullName.trim().length >= 2 && city.trim().length >= 2 && username.trim().length >= 3 && !!goal
  const canStep2 = services.some(s => s.name.trim().length >= 2 && Number(s.price) > 0) && bio.trim().length >= 10
  const canStep3 = true

  const checklistState = {
    identity: canStep1,
    offer: step >= 3 && canStep2,
    design: step >= 4,
    publish: step === 4,
  }

  const uploadProfilePhoto = useCallback(async (file: File) => {
    setPhotoUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('files', file, file.name)
      const up = await fetch('/api/profile/photos', { method: 'POST', body: fd })
      const data = await up.json().catch(() => ({}))
      if (!up.ok) throw new Error(data?.error ?? 'Upload impossible')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload impossible')
    } finally {
      setPhotoUploading(false)
    }
  }, [])

  const pickProfilePhoto = useCallback(async (file: File) => {
    const local: LocalPhoto = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    }
    setProfilePhoto(local)
    await uploadProfilePhoto(file)
  }, [uploadProfilePhoto])

  const onGenerateBio = async () => {
    if (plan !== 'infinity') return
    const svc = primaryService
    if (!svc?.name.trim()) return
    setAiLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          categoryLabel,
          goal,
          fullName,
          city,
          serviceName: svc.name,
          serviceDuration: svc.duration,
          servicePrice: Number(svc.price),
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.error ?? 'Erreur IA')
      setBio(String(data.bio ?? '').slice(0, 150))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur IA')
    } finally {
      setAiLoading(false)
    }
  }

  const publish = async () => {
    setPublishLoading(true)
    setError(null)
    try {
      const rPub = await fetch('/api/profile/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, accentColor, bio }),
      })
      const dPub = await rPub.json().catch(() => ({}))
      if (!rPub.ok) throw new Error(dPub?.error ?? 'Publication impossible')

      const rProfile = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          full_name: fullName,
          bio,
          city,
        }),
      })
      const dProfile = await rProfile.json().catch(() => ({}))
      if (!rProfile.ok) throw new Error(dProfile?.error ?? 'Sauvegarde profil impossible')

      for (const svc of services.filter(s => s.name.trim())) {
        await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: svc.name,
            duration: svc.duration,
            price: Number(svc.price),
          }),
        }).catch(() => {})
      }

      launchConfetti(2000)
      setTimeout(() => router.push(`/${username}`), 450)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Publication impossible')
    } finally {
      setPublishLoading(false)
    }
  }

  const stepIsValid = (s: Step) => {
    if (s === 1) return canStep1
    if (s === 2) return canStep2
    if (s === 3) return canStep3
    return true
  }

  const next = () => {
    if (step === 1 && !canStep1) return
    if (step === 2 && !canStep2) return
    if (step < 4) setStep((step + 1) as Step)
  }

  const back = () => { if (step > 1) setStep((step - 1) as Step) }

  if (!isLoaded) return <SkeletonScreen label="Chargement..." />
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ width: 'min(520px, 92vw)', background: 'white', borderRadius: 20, border: '1px solid rgba(0,0,0,0.08)', padding: '1.8rem', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <BrandLogo />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>Elite</span>
          </div>
          <h1 style={{ marginTop: '1.4rem', fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.8rem', color: COLORS.dark, letterSpacing: '-0.03em' }}>
            Créez votre page publique en 2 minutes.
          </h1>
          <p style={{ marginTop: '0.7rem', color: '#64748b', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif' }}>
            Connectez-vous pour accéder à l’onboarding.
          </p>
          <a
            href={`/sign-up?redirect_url=${encodeURIComponent('/onboarding')}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: '1.2rem',
              height: 56,
              padding: '0 1.8rem',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: 999,
              background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`,
              boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
              transition: 'all 0.25s ease',
            }}
          >
            Commencer gratuitement <ArrowRight />
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        button, input, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }

        .elite-input {
          border-radius: 12px;
          border: 2px solid rgba(0,0,0,0.08);
          background: white;
          outline: none;
          transition: all 0.25s ease;
          color: ${COLORS.dark};
          font-size: 0.9rem;
          padding: 0.85rem 1rem;
          width: 100%;
        }
        .elite-input:focus {
          border-color: ${COLORS.violet};
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }

        .elite-btn {
          border-radius: 100px;
          background: linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose});
          box-shadow: 0 8px 32px rgba(124,58,237,0.35);
          transition: all 0.25s ease;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 980px) {
          .elite-layout { padding-left: 0 !important; }
          .elite-sidebar { display: none !important; }
          .elite-main { padding: 2rem 1.25rem !important; }
          .elite-goals { grid-template-columns: 1fr 1fr !important; }
          .elite-templates { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: COLORS.bg }}>
        {/* Progress bar segments */}
        <div style={{ padding: '10px 18px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  height: 4,
                  borderRadius: 999,
                  background: i <= step ? `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})` : 'rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="elite-layout"
          style={{
            position: 'relative',
            minHeight: 'calc(100vh - 14px)',
            paddingLeft: 'calc(100% / 2.45)',
          }}
        >
          {/* Sidebar */}
          <aside
            className="elite-sidebar"
            style={{
              background: COLORS.dark,
              padding: '3.4rem 2.8rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'fixed',
              left: 0,
              top: 0,
              height: '100vh',
              width: 'calc(100% / 2.45)',
              zIndex: 20,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.4rem' }}>
              <BrandLogo variant="dark" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={transition}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa', fontFamily: 'DM Sans, sans-serif', marginBottom: '0.9rem' }}>
                    Onboarding Elite
                  </div>
                  <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.85rem', fontWeight: 700, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
                    {currentStepCopy.title}
                  </h2>
                  <p style={{ color: '#475569', fontSize: '0.92rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 300, lineHeight: 1.75 }}>
                    {currentStepCopy.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {CHECKLIST.map(item => {
                  const checked = step >= item.minStep && (item.label === 'Identité validée' ? checklistState.identity : item.label === 'Offre prête' ? checklistState.offer : true)
                  return (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: checked ? `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})` : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s ease' }}>
                        {checked && <CheckTiny />}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: checked ? '#e2e8f0' : '#334155', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.25s ease' }}>
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ padding: '1.3rem', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa', fontFamily: 'DM Sans, sans-serif', marginBottom: '0.8rem' }}>
                Ce que CalendaPro vous garantit
              </div>
              {[
                { stat: '−70%', label: 'de no-shows en moyenne' },
                { stat: '3×', label: 'plus de réservations en ligne' },
                { stat: '0€', label: "pour commencer aujourd'hui" },
              ].map(item => (
                <div
                  key={item.stat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: '#475569', fontFamily: 'DM Sans, sans-serif' }}>{item.label}</span>
                  <span
                    style={{
                      fontFamily: "'Clash Display', 'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {item.stat}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          {/* Main */}
          <main className="elite-main" style={{ padding: '4rem 3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: '1.2rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>
                    Étape {step} / 4
                  </div>
                  <div style={{ marginTop: 8, fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '2.1rem', fontWeight: 700, letterSpacing: '-0.03em', color: COLORS.dark, lineHeight: 1.05 }}>
                    Onboarding <span style={gradientTextStyle()}>Elite</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                    Plan : <span style={{ color: COLORS.dark }}>{plan === 'free' ? 'Starter' : plan === 'premium' ? 'Premium' : 'Infinity'}</span>
                  </div>
                  {loadingPlan && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.78rem' }}>
                      <Spinner /> Sync…
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#991b1b', borderRadius: 14, padding: '0.85rem 1rem', marginBottom: '1.1rem', transition: 'all 0.25s ease' }}>
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div key="step-1" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={transition}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.15rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.dark }}>
                          Étape 1 — Identité
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>Zéro <span style={{ fontWeight: 700 }}>select</span> · Cards only</div>
                      </div>

                      <div style={{ background: 'white', borderRadius: 22, border: '1px solid rgba(0,0,0,0.08)', padding: '1.4rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.25s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>Métier</div>
                            <div style={{ marginTop: 8, color: '#64748b', fontSize: '0.92rem', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65 }}>Sélectionnez votre activité — on adapte le rendu automatiquement.</div>
                          </div>
                        </div>

                        <input
                          className="elite-input"
                          placeholder="Rechercher votre métier..."
                          value={metierSearch}
                          onChange={e => setMetierSearch(e.target.value)}
                          style={{ marginBottom: 12 }}
                        />

                        <div style={{ marginTop: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                          {displayedMetiers.map(m => {
                            const active = m.id === category
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setCategory(m.id)}
                                style={{
                                  borderRadius: 18,
                                  border: `2px solid ${active ? COLORS.violet : 'rgba(0,0,0,0.08)'}`,
                                  background: active ? COLORS.dark : 'white',
                                  padding: '1rem 1rem',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.25s ease',
                                  boxShadow: active ? '0 12px 40px rgba(124,58,237,0.18)' : 'none',
                                }}
                              >
                                <div style={{ width: 42, height: 42, borderRadius: 14, background: active ? 'rgba(124,58,237,0.18)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? COLORS.violet : '#64748b', transition: 'all 0.25s ease' }}>
                                  {m.icon}
                                </div>
                                <div style={{ marginTop: 10, fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 700, letterSpacing: '-0.01em', color: active ? 'white' : COLORS.dark, fontSize: '0.92rem', transition: 'all 0.25s ease' }}>
                                  {m.label}
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        {metierSearch.length === 0 && !showAllMetiers && METIERS.length > 10 && (
                          <button
                            type="button"
                            onClick={() => setShowAllMetiers(true)}
                            style={{
                              marginTop: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              padding: '0.65rem 1rem',
                              borderRadius: 14,
                              border: '2px dashed rgba(124,58,237,0.25)',
                              background: 'transparent',
                              color: COLORS.violet,
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Voir tous
                          </button>
                        )}

                        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={labelStyle()}>Nom complet</label>
                            <input className="elite-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ex: Karim D." />
                          </div>
                          <div>
                            <label style={labelStyle()}>Ville</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                className="elite-input"
                                value={citySearch}
                                onChange={e => {
                                  setCitySearch(e.target.value)
                                  setCity(e.target.value)
                                  void fetchCities(e.target.value)
                                  setShowCitySuggestions(true)
                                }}
                                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                                placeholder="Ex: Lyon"
                              />
                              {showCitySuggestions && citySuggestions.length > 0 && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    left: 0,
                                    right: 0,
                                    background: 'white',
                                    border: '1.5px solid rgba(124,58,237,0.18)',
                                    borderRadius: 12,
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                                    zIndex: 200,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {citySuggestions.map(c => (
                                    <button
                                      key={c}
                                      type="button"
                                      onMouseDown={() => {
                                        const name = c.split(' (')[0]
                                        setCity(name)
                                        setCitySearch(name)
                                        setShowCitySuggestions(false)
                                      }}
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '0.65rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontFamily: 'DM Sans, sans-serif',
                                        color: '#0f172a',
                                        transition: 'background 0.15s',
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.background = '#f5f3ff'
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent'
                                      }}
                                    >
                                      {c}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 12 }}>
                          <label style={labelStyle()}>Username</label>
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif', pointerEvents: 'none' }}>
                              calendapro.fr/
                            </div>
                            <input
                              className="elite-input"
                              style={{ paddingLeft: 140 }}
                              value={username}
                              onChange={e => setUsername(slugify(e.target.value))}
                              placeholder="votre-nom"
                            />
                          </div>
                          <div style={{ marginTop: 8, fontSize: '0.82rem', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                            Preview : <span style={{ fontWeight: 800 }}>calendapro.fr/{username || 'votre-nom'}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>Objectif</div>
                              <div style={{ marginTop: 8, color: '#64748b', fontSize: '0.92rem', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65 }}>Choisissez ce qui compte le plus : on ajuste la page et la recommandation.</div>
                            </div>
                          </div>

                          <div className="elite-goals" style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {GOALS.map(g => {
                              const active = g.id === goal
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => setGoal(g.id)}
                                  style={{
                                    borderRadius: 18,
                                    border: `2px solid ${active ? COLORS.violet : 'rgba(0,0,0,0.08)'}`,
                                    background: active ? COLORS.dark : 'white',
                                    padding: '1rem 1.05rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    boxShadow: active ? '0 12px 40px rgba(124,58,237,0.18)' : 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 14, background: active ? 'rgba(124,58,237,0.18)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? COLORS.violet : '#64748b', transition: 'all 0.25s ease' }}>
                                      {g.icon}
                                    </div>
                                    <div>
                                      <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 700, color: active ? 'white' : COLORS.dark, fontSize: '0.92rem', letterSpacing: '-0.01em', transition: 'all 0.25s ease' }}>{g.label}</div>
                                      <div style={{ marginTop: 4, color: active ? '#64748b' : '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4, transition: 'all 0.25s ease' }}>{g.desc}</div>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div key="step-2" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={transition}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.15rem' }}>
                      <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.dark }}>
                        Étape 2 — Mon offre
                      </h2>

                      <div style={{ background: 'white', borderRadius: 22, border: '1px solid rgba(0,0,0,0.08)', padding: '1.4rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.25s ease' }}>
                        <div style={{ display: 'grid', gap: 12 }}>
                          {services.map((svc, idx) => (
                            <div
                              key={svc.id}
                              style={{
                                background: 'white',
                                borderRadius: 18,
                                border: '1px solid rgba(0,0,0,0.08)',
                                padding: '1.2rem',
                                display: 'grid',
                                gap: 10,
                                position: 'relative',
                              }}
                            >
                              {services.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeService(svc.id)}
                                  style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: 'rgba(239,68,68,0.08)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                  }}
                                >
                                  ×
                                </button>
                              )}
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
                                Service {idx + 1}
                              </div>
                              <input
                                className="elite-input"
                                placeholder='Ex: "Coupe homme"'
                                value={svc.name}
                                onChange={e => updateService(svc.id, 'name', e.target.value)}
                              />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}>
                                <div>
                                  <div style={labelStyle()}>Durée</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {DURATIONS.map(d => {
                                      const active = svc.duration === d.id
                                      return (
                                        <button
                                          key={d.id}
                                          type="button"
                                          onClick={() => updateService(svc.id, 'duration', d.id)}
                                          style={{
                                            padding: '0.5rem 0.85rem',
                                            borderRadius: 999,
                                            border: `2px solid ${active ? '#7c3aed' : 'rgba(0,0,0,0.08)'}`,
                                            background: active ? '#0f172a' : 'white',
                                            color: active ? 'white' : '#0f172a',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.82rem',
                                            transition: 'all 0.2s',
                                          }}
                                        >
                                          {d.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <div style={labelStyle()}>Prix</div>
                                  <div style={{ position: 'relative' }}>
                                    <input
                                      className="elite-input"
                                      value={svc.price}
                                      onChange={e => updateService(svc.id, 'price', e.target.value.replace(/[^0-9]/g, ''))}
                                      placeholder="45"
                                      inputMode="numeric"
                                    />
                                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 800 }}>€</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addService}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.75rem 1.2rem',
                              background: 'transparent',
                              border: '2px dashed rgba(124,58,237,0.25)',
                              borderRadius: 16,
                              cursor: 'pointer',
                              color: '#7c3aed',
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              transition: 'all 0.2s',
                              width: '100%',
                              justifyContent: 'center',
                            }}
                          >
                            + Ajouter un service
                          </button>

                          <div>
                            <label style={labelStyle()}>Bio (150 max)</label>
                            <textarea
                              className="elite-input"
                              value={bio}
                              onChange={e => setBio(e.target.value.slice(0, 150))}
                              placeholder="Une phrase premium, simple, orientée résultats..."
                              style={{ minHeight: 120, resize: 'vertical' }}
                            />
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}>
                                {bio.length}/150
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {aiLoading && (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.violet, fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
                                    <Spinner /> L’IA écrit votre bio...
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void onGenerateBio()}
                                  disabled={plan !== 'infinity' || aiLoading}
                                  title={plan !== 'infinity' ? 'Plan Infinity' : ''}
                                  style={{
                                    height: 44,
                                    padding: '0 1rem',
                                    border: 'none',
                                    borderRadius: 999,
                                    background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`,
                                    boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
                                    color: 'white',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    cursor: plan !== 'infinity' ? 'not-allowed' : 'pointer',
                                    opacity: plan !== 'infinity' ? 0.55 : 1,
                                    transition: 'all 0.25s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                  }}
                                >
                                  ✨ Générer ma bio
                                </button>
                              </div>
                            </div>
                            {plan !== 'infinity' && (
                              <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                Disponible avec <strong>Infinity</strong>.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <motion.div key="step-3" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={transition}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.15rem' }}>
                      <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.dark }}>
                        Étape 3 — <span style={{ color: COLORS.violet }}>Votre identité visuelle</span>
                      </h2>

                      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16 }}>
                        <div style={{ background: 'white', borderRadius: 22, border: '1px solid rgba(0,0,0,0.08)', padding: '1.4rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.25s ease' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>Palette</div>
                            {plan === 'free' && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Starter: Violet only</div>}
                          </div>

                          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, textAlign: 'center' }}>
                            {PALETTES.map(p => {
                              const locked = !canUsePalette(p.accent)
                              const active = accentColor === p.accent
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => { if (!locked) setAccentColor(p.accent) }}
                                  disabled={locked}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: locked ? 'not-allowed' : 'pointer',
                                    opacity: locked ? 0.35 : 1,
                                    transition: 'all 0.25s ease',
                                  }}
                                >
                                  <div style={{ position: 'relative', width: 40, height: 40, margin: '0 auto' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.accent, border: active ? '3px solid rgba(15,23,42,0.9)' : '3px solid transparent', transition: 'all 0.25s ease' }} />
                                    {locked && (
                                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                                        <LockIcon />
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>{p.name}</div>
                                </button>
                              )
                            })}
                          </div>

                          <div style={{ marginTop: 18 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>
                              Photo de profil
                            </div>

                            <label
                              htmlFor="profile-photo"
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => {
                                e.preventDefault()
                                const f = e.dataTransfer.files?.[0]
                                if (f) void pickProfilePhoto(f)
                              }}
                              style={{
                                marginTop: 12,
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                border: `2px dashed rgba(124,58,237,0.35)`,
                                background: 'white',
                                display: 'grid',
                                placeItems: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                transition: 'all 0.25s ease',
                              }}
                              title="Glissez-déposez ou cliquez"
                            >
                              {previewPhotoUrl ? (
                                <img src={previewPhotoUrl} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'grid', placeItems: 'center', color: COLORS.violet }}>
                                  <UploadIcon />
                                </div>
                              )}
                            </label>
                            <input
                              id="profile-photo"
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) void pickProfilePhoto(f)
                              }}
                            />

                            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                {photoUploading ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.violet, fontWeight: 700 }}>
                                    <Spinner /> Upload…
                                  </span>
                                ) : (
                                  <span>Drag & drop · POST `/api/profile/photos`</span>
                                )}
                              </div>
                            </div>

                            <div style={{ marginTop: 16 }}>
                              <PhotoDropzone photos={photos} onChange={setPhotos} label="Photos (optionnel)" />
                            </div>
                          </div>
                        </div>

                        {/* Live preview */}
                        <div style={{ background: 'white', borderRadius: 22, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.25s ease' }}>
                          <div style={{ height: 6, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})` }} />
                          <div style={{ padding: '1.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', overflow: 'hidden', border: `2px solid ${accentColor}22`, transition: 'all 0.25s ease' }}>
                                  {previewPhotoUrl ? <img src={previewPhotoUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.dark }}>
                                    {fullName || 'Votre nom'}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: accentColor, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
                                    calendapro.fr/{username || 'votre-nom'}
                                  </div>
                                </div>
                              </div>

                              <div style={{ padding: '0.35rem 0.7rem', borderRadius: 999, border: `1px solid ${accentColor}33`, background: `${accentColor}14`, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: accentColor }}>
                                Live
                              </div>
                            </div>

                            <div style={{ marginTop: 14, color: '#64748b', lineHeight: 1.7, fontSize: '0.92rem', fontFamily: 'DM Sans, sans-serif' }}>
                              {bio ? bio : <span style={{ color: '#94a3b8' }}>Bio en cours…</span>}
                            </div>

                            <div style={{ marginTop: 16, borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 700, letterSpacing: '-0.01em', color: COLORS.dark }}>
                                  {primaryService?.name?.trim() || 'Votre service'}
                                </div>
                                <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#94a3b8' }}>
                                  {primaryService?.duration ?? '1h'} · Réservation instantanée
                                </div>
                              </div>
                              <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 700, fontSize: '1.45rem', letterSpacing: '-0.03em', ...gradientTextStyle() }}>
                                {Number(primaryService?.price) > 0 ? `${Number(primaryService?.price)}€` : '—'}
                              </div>
                            </div>

                            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div style={{ borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: '0.95rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>Palette</div>
                                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: accentColor }} />
                                  <div style={{ fontWeight: 700, color: COLORS.dark }}>{PALETTES.find(p => p.accent === accentColor)?.name ?? 'Custom'}</div>
                                </div>
                              </div>
                              <div style={{ borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: '0.95rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>Smart</div>
                                <div style={{ marginTop: 10, fontWeight: 700, color: COLORS.dark }}>
                                  Reco: <span style={{ color: COLORS.violet }}>{recommendedTemplate}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <motion.div key="step-4" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={transition}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.15rem' }}>
                      <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.dark }}>
                        Étape 4 — Template + publication
                      </h2>

                      <div className="elite-templates" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {(['minimal', 'visual', 'direct'] as SmartTemplate[]).map(tpl => {
                          const locked = !canUseTemplate(tpl)
                          const selected = template === tpl
                          const smart = plan === 'infinity' && recommendedTemplate === tpl
                          return (
                            <button
                              key={tpl}
                              type="button"
                              onClick={() => { if (!locked) setTemplate(tpl) }}
                              disabled={locked}
                              style={{
                                height: 350,
                                borderRadius: 22,
                                border: `2px solid ${selected ? COLORS.violet : 'rgba(0,0,0,0.08)'}`,
                                background: tpl === 'visual' ? COLORS.dark : 'white',
                                color: tpl === 'visual' ? 'white' : COLORS.dark,
                                padding: 16,
                                textAlign: 'left',
                                cursor: locked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.25s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: selected ? '0 18px 56px rgba(124,58,237,0.14)' : 'none',
                                opacity: locked ? 0.55 : 1,
                              }}
                            >
                              {smart && (
                                <div style={{ position: 'absolute', top: 14, right: 14, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`, color: 'white', borderRadius: 999, padding: '0.32rem 0.7rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  ✦ Smart
                                </div>
                              )}
                              {locked && (
                                <div style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'grid', placeItems: 'center' }}>
                                  <LockIcon dark />
                                </div>
                              )}

                              <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                {tpl === 'minimal' ? 'Minimal' : tpl === 'visual' ? 'Visuel' : 'Direct'}
                              </div>

                              <div style={{ marginTop: 10, color: tpl === 'visual' ? 'rgba(255,255,255,0.65)' : '#64748b', fontSize: '0.86rem', lineHeight: 1.55 }}>
                                {tpl === 'minimal' ? 'Fond blanc, typo épurée, prix visible.' : tpl === 'visual' ? 'Fond sombre, hero photo, ambiance premium.' : 'Widget réservation visible tout en haut.'}
                              </div>

                              <div style={{ marginTop: 14 }}>
                                {tpl === 'minimal' && (
                                  <div style={{ borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: 14, background: 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 700, color: COLORS.dark }}>{primaryService?.name?.trim() || 'Coupe homme'}</div>
                                        <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#94a3b8' }}>{primaryService?.duration ?? '1h'} · Réservation en ligne</div>
                                      </div>
                                      <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 700, fontSize: '1.6rem', letterSpacing: '-0.03em', ...gradientTextStyle() }}>
                                        {Number(primaryService?.price) > 0 ? `${Number(primaryService?.price)}€` : '—'}
                                      </div>
                                    </div>
                                    <div style={{ marginTop: 10, height: 42, borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`, boxShadow: '0 8px 32px rgba(124,58,237,0.35)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800 }}>
                                      Réserver
                                    </div>
                                  </div>
                                )}

                                {tpl === 'visual' && (
                                  <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <div style={{ height: 150, background: previewPhotoUrl ? `url(${previewPhotoUrl}) center/cover` : `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})` }} />
                                    <div style={{ padding: 14 }}>
                                      <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontWeight: 700, color: 'white' }}>{fullName || 'Votre nom'}</div>
                                      <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>{primaryService?.name?.trim() || 'Votre service'} · {Number(primaryService?.price) > 0 ? `${Number(primaryService?.price)}€` : '—'}</div>
                                    </div>
                                  </div>
                                )}

                                {tpl === 'direct' && (
                                  <div style={{ borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: 14, background: 'white' }}>
                                    <div style={{ borderRadius: 14, background: COLORS.dark, padding: 12, color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>Réserver</span>
                                      <span style={{ color: '#a78bfa' }}>Instant</span>
                                    </div>
                                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                                      {['Aujourd’hui 14:00', 'Demain 10:30', 'Jeudi 16:15'].map(s => (
                                        <div key={s} style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: '0.55rem 0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <span style={{ color: COLORS.dark, fontWeight: 700 }}>{s}</span>
                                          <span style={{ color: COLORS.violet, fontWeight: 800 }}>Choisir</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {smart && (
                                <div style={{ marginTop: 12, fontSize: '0.78rem', color: tpl === 'visual' ? '#a78bfa' : COLORS.violet, fontWeight: 800 }}>
                                  Recommandé pour votre activité
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.6 }}>
                          En publiant, votre page sera disponible sur <strong style={{ color: COLORS.dark }}>/{username || '...'}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => void publish()}
                          disabled={publishLoading || !username.trim()}
                          style={{
                            height: 56,
                            padding: '0 1.8rem',
                            border: 'none',
                            borderRadius: 999,
                            background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`,
                            boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: publishLoading ? 'not-allowed' : 'pointer',
                            opacity: publishLoading ? 0.65 : 1,
                            transition: 'all 0.25s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          {publishLoading ? (<><Spinner /> Publication…</>) : '🚀 Publier ma page'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav */}
              <div style={{ marginTop: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 1}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0.75rem 1.2rem',
                    borderRadius: 999,
                    border: '1.5px solid rgba(0,0,0,0.12)',
                    background: 'transparent',
                    cursor: step === 1 ? 'not-allowed' : 'pointer',
                    color: '#64748b',
                    fontWeight: 700,
                    transition: 'all 0.25s ease',
                    opacity: step === 1 ? 0.5 : 1,
                  }}
                >
                  <ArrowLeft /> Retour
                </button>

                {step < 4 && (
                  <button
                    type="button"
                    onClick={next}
                    disabled={!stepIsValid(step)}
                    className="elite-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      height: 56,
                      padding: '0 1.9rem',
                      border: 'none',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '1rem',
                      cursor: stepIsValid(step) ? 'pointer' : 'not-allowed',
                      opacity: stepIsValid(step) ? 1 : 0.55,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    Continuer <ArrowRight />
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<SkeletonScreen label="Chargement..." />}>
      <EliteOnboardingContent />
    </Suspense>
  )
}

function labelStyle(): React.CSSProperties {
  return {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontFamily: 'DM Sans, sans-serif',
    marginBottom: '0.45rem',
  }
}

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid rgba(124,58,237,0.18)',
        borderTopColor: COLORS.violet,
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

function CheckTiny() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function LockIcon({ dark }: { dark?: boolean }) {
  const stroke = dark ? '#64748b' : 'white'
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.violet} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function ScissorsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function EuroIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
