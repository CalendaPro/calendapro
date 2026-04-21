'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Scissors, Crown, Sparkles, Hand, Brush, PenTool, CircleDot, HandHeart, Brain,
  Dumbbell, Flame, Flower2, Activity, Waves, Swords, Footprints,
  HeartHandshake, Apple, Carrot, Pin, Leaf, Moon,
  Compass, TrendingUp, Target, MessageSquare, Award,
  Camera, Video, Palette, Code2, Layout, Users,
  GraduationCap, BookOpen, Lightbulb, FileText,
  Scale, Calculator, BadgeDollarSign,
  ArrowRight, ArrowLeft, Bell, Clock, Euro, Lock, Upload,
  Check, ShieldCheck, Zap, Gift
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { smartTemplateFrom, type Goal, type SmartTemplate } from '@/lib/smart-template'
import { PRO_THEMES, DEFAULT_SECTIONS, ACCENT_COLORS, type Sections } from '@/lib/themes'
import { PRO_LAYOUTS, PRO_LAYOUT_IDS, type ProLayoutId } from '@/lib/layouts'
import type { WeekSchedule, ScheduleException } from '@/app/onboarding/_components/ScheduleEditor'
import type { LocationData } from '@/app/onboarding/_components/LocationEditor'
import type { CtaConfig } from '@/app/onboarding/_components/CtaEditor'
import { DEFAULT_SCHEDULE } from '@/app/onboarding/_components/ScheduleEditor'
import { DEFAULT_LOCATION } from '@/app/onboarding/_components/LocationEditor'
import { DEFAULT_CTA } from '@/app/onboarding/_components/CtaEditor'

const PhotoDropzone   = dynamic(() => import('@/components/onboarding/PhotoDropzone'),                            { ssr: false })
const ScheduleEditor  = dynamic(() => import('@/app/onboarding/_components/ScheduleEditor'),  { ssr: false })
const LocationEditor  = dynamic(() => import('@/app/onboarding/_components/LocationEditor'),  { ssr: false })
const CtaEditor       = dynamic(() => import('@/app/onboarding/_components/CtaEditor'),       { ssr: false })
const ReviewsPreview  = dynamic(() => import('@/app/onboarding/_components/ReviewsPreview'),  { ssr: false })
const SectionReorder  = dynamic(() => import('@/app/onboarding/_components/SectionReorder'),  { ssr: false })

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
  { id: 'barbier', label: 'Barbier', icon: <Scissors size={22} strokeWidth={1.7} /> },
  { id: 'coiffeur', label: 'Coiffeur·se', icon: <Crown size={22} strokeWidth={1.7} /> },
  { id: 'estheticienne', label: 'Esthéticienne', icon: <Sparkles size={22} strokeWidth={1.7} /> },
  { id: 'onglerie', label: 'Prothésiste ongulaire', icon: <Hand size={22} strokeWidth={1.7} /> },
  { id: 'maquillage', label: 'Maquilleuse', icon: <Brush size={22} strokeWidth={1.7} /> },
  { id: 'tatoueur', label: 'Tatoueur·se', icon: <PenTool size={22} strokeWidth={1.7} /> },
  { id: 'piercing', label: 'Perceur·se', icon: <CircleDot size={22} strokeWidth={1.7} /> },
  { id: 'massage', label: 'Masseur·se', icon: <HandHeart size={22} strokeWidth={1.7} /> },
  { id: 'sophrologue', label: 'Sophrologue', icon: <Brain size={22} strokeWidth={1.7} /> },
  // Sport & Fitness
  { id: 'coach-sport', label: 'Coach sportif', icon: <Dumbbell size={22} strokeWidth={1.7} /> },
  { id: 'coach-crossfit', label: 'Coach CrossFit', icon: <Flame size={22} strokeWidth={1.7} /> },
  { id: 'coach-yoga', label: 'Professeur de yoga', icon: <Flower2 size={22} strokeWidth={1.7} /> },
  { id: 'coach-pilates', label: 'Professeur Pilates', icon: <Activity size={22} strokeWidth={1.7} /> },
  { id: 'coach-natation', label: 'Coach natation', icon: <Waves size={22} strokeWidth={1.7} /> },
  { id: 'coach-boxe', label: 'Coach boxe / MMA', icon: <Swords size={22} strokeWidth={1.7} /> },
  { id: 'coach-course', label: 'Coach running', icon: <Footprints size={22} strokeWidth={1.7} /> },
  // Santé
  { id: 'psychologue', label: 'Psychologue', icon: <Brain size={22} strokeWidth={1.7} /> },
  { id: 'psychotherapeute', label: 'Psychothérapeute', icon: <HeartHandshake size={22} strokeWidth={1.7} /> },
  { id: 'osteopathe', label: 'Ostéopathe', icon: <Activity size={22} strokeWidth={1.7} /> },
  { id: 'kine', label: 'Kinésithérapeute', icon: <Activity size={22} strokeWidth={1.7} /> },
  { id: 'nutritionniste', label: 'Nutritionniste', icon: <Apple size={22} strokeWidth={1.7} /> },
  { id: 'dieteticien', label: 'Diététicien·ne', icon: <Carrot size={22} strokeWidth={1.7} /> },
  { id: 'acupuncteur', label: 'Acupuncteur·trice', icon: <Pin size={22} strokeWidth={1.7} /> },
  { id: 'naturopathe', label: 'Naturopathe', icon: <Leaf size={22} strokeWidth={1.7} /> },
  { id: 'hypnotherapeute', label: 'Hypnothérapeute', icon: <Moon size={22} strokeWidth={1.7} /> },
  // Coaching & Conseil
  { id: 'coach-vie', label: 'Coach de vie', icon: <Compass size={22} strokeWidth={1.7} /> },
  { id: 'coach-business', label: 'Coach business', icon: <TrendingUp size={22} strokeWidth={1.7} /> },
  { id: 'coach-carriere', label: 'Coach carrière', icon: <Target size={22} strokeWidth={1.7} /> },
  { id: 'consultant', label: 'Consultant·e', icon: <MessageSquare size={22} strokeWidth={1.7} /> },
  { id: 'mentor', label: 'Mentor / Advisor', icon: <Award size={22} strokeWidth={1.7} /> },
  // Créatif
  { id: 'photographe', label: 'Photographe', icon: <Camera size={22} strokeWidth={1.7} /> },
  { id: 'videaste', label: 'Vidéaste', icon: <Video size={22} strokeWidth={1.7} /> },
  { id: 'graphiste', label: 'Graphiste', icon: <Palette size={22} strokeWidth={1.7} /> },
  { id: 'illustrateur', label: 'Illustrateur·trice', icon: <PenTool size={22} strokeWidth={1.7} /> },
  // Tech & Digital
  { id: 'developpeur', label: 'Développeur·se', icon: <Code2 size={22} strokeWidth={1.7} /> },
  { id: 'designer-ux', label: 'Designer UX/UI', icon: <Layout size={22} strokeWidth={1.7} /> },
  { id: 'community-manager', label: 'Community Manager', icon: <Users size={22} strokeWidth={1.7} /> },
  // Formation
  { id: 'formateur', label: 'Formateur·trice', icon: <GraduationCap size={22} strokeWidth={1.7} /> },
  { id: 'professeur', label: 'Professeur particulier', icon: <BookOpen size={22} strokeWidth={1.7} /> },
  { id: 'tuteur', label: 'Tuteur·trice scolaire', icon: <Lightbulb size={22} strokeWidth={1.7} /> },
  // Juridique & Finance
  { id: 'avocat', label: 'Avocat·e', icon: <Scale size={22} strokeWidth={1.7} /> },
  { id: 'expert-comptable', label: 'Expert-comptable', icon: <Calculator size={22} strokeWidth={1.7} /> },
  { id: 'conseiller-financier', label: 'Conseiller financier', icon: <BadgeDollarSign size={22} strokeWidth={1.7} /> },
  // Autre
  { id: 'autre', label: 'Autre activité', icon: <Sparkles size={22} strokeWidth={1.7} /> },
]

const GOALS: Array<{ id: Goal; label: string; desc: string; icon: React.ReactNode }> = [
  { id: 'noshows', label: 'Réduire no-shows', desc: 'Rappels & acomptes', icon: <Bell size={20} strokeWidth={1.7} /> },
  { id: 'clients', label: 'Nouveaux clients', desc: 'Marketplace & SEO', icon: <Users size={20} strokeWidth={1.7} /> },
  { id: 'time', label: 'Gagner du temps', desc: 'Automatiser', icon: <Clock size={20} strokeWidth={1.7} /> },
  { id: 'revenue', label: 'Plus de revenus', desc: 'Remplir les créneaux', icon: <Euro size={20} strokeWidth={1.7} /> },
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

type Vibe = 'minimal' | 'barber' | 'studio' | 'organic'
type BtnStyle = 'pill' | 'rounded' | 'square'

const VIBES: Array<{ id: Vibe; label: string; desc: string; bg: string; text: string; muted: string; border: string; accent: string; emoji: string }> = [
  { id: 'minimal', label: 'Minimaliste', desc: 'Blanc · Épuré · Moderne', bg: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', accent: '#7c3aed', emoji: '◻' },
  { id: 'barber', label: 'Barbier', desc: 'Sombre · Vintage · Cuir', bg: '#110e09', text: '#f0e4cc', muted: '#9a8060', border: '#2a2010', accent: '#d4a55a', emoji: '✂' },
  { id: 'studio', label: 'Studio Flash', desc: 'Violet · Vif · Dynamique', bg: '#f5f3ff', text: '#1e1b4b', muted: '#6b7280', border: '#ddd6fe', accent: '#7c3aed', emoji: '⚡' },
  { id: 'organic', label: 'Organique', desc: 'Terre · Chaud · Bien-être', bg: '#faf7f2', text: '#3d2c1e', muted: '#8b6b4e', border: '#e8ddd0', accent: '#b07d4e', emoji: '🌿' },
]

const FONT_PAIRS: Array<{ id: string; title: string; body: string; label: string }> = [
  { id: 'clash-dm', title: 'Clash Display', body: 'DM Sans', label: 'Prestige' },
  { id: 'playfair', title: 'Playfair Display', body: 'Inter', label: 'Élégance' },
  { id: 'syne', title: 'Syne', body: 'Manrope', label: 'Moderne' },
  { id: 'bebas', title: 'Bebas Neue', body: 'Lato', label: 'Impact' },
  { id: 'cormorant', title: 'Cormorant', body: 'Nunito', label: 'Nature' },
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
        <div style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: COLORS.dark }}>Configuration de votre profil</div>
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
  const [strengths, setStrengths] = useState('')
  const [toneStyle, setToneStyle] = useState('')
  const [targetClient, setTargetClient] = useState('')
  const [yearsExp, setYearsExp] = useState('')

  const [accentColor, setAccentColor] = useState(COLORS.violet)
  const [profilePhoto, setProfilePhoto] = useState<LocalPhoto | null>(null)
  const [photos, setPhotos] = useState<LocalPhoto[]>([])

  const [aiLoading, setAiLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [template, setTemplate] = useState<SmartTemplate>('minimal')
  const [vibe, setVibe] = useState<Vibe>('minimal')
  const [fontPair, setFontPair] = useState('clash-dm')
  const [btnStyle, setBtnStyle] = useState<BtnStyle>('pill')
  const [igPost, setIgPost] = useState('')
  const [igPostLoading, setIgPostLoading] = useState(false)

  // site-builder v2
  const [themeName, setThemeName] = useState('minimalist')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [sectionsVisible, setSectionsVisible] = useState<Sections>(DEFAULT_SECTIONS)
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [copiedLink, setCopiedLink] = useState(false)

  // site-builder v3
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE)
  const [scheduleExceptions, setScheduleExceptions] = useState<ScheduleException[]>([])
  const [location, setLocation] = useState<LocationData>(DEFAULT_LOCATION)
  const [ctaConfig, setCtaConfig] = useState<CtaConfig>(DEFAULT_CTA)
  const [sectionOrder, setSectionOrder] = useState<string[]>(['about','services','reviews','schedule','gallery','cta'])
  const [reviewsMaxVisible, setReviewsMaxVisible] = useState(5)
  const [reviewsSortMode, setReviewsSortMode] = useState<'recent' | 'top'>('recent')
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal')
  const [openConsoleSection, setOpenConsoleSection] = useState<string | null>('themes')
  const [selectedProLayout, setSelectedProLayout] = useState<ProLayoutId>('modern')

  const recommendedTemplate = useMemo(() => smartTemplateFrom(category, goal), [category, goal])
  const vibeConfig = useMemo(() => VIBES.find(v => v.id === vibe) ?? VIBES[0], [vibe])
  const currentFontPair = useMemo(() => FONT_PAIRS.find(fp => fp.id === fontPair) ?? FONT_PAIRS[0], [fontPair])

  const categoryLabel = useMemo(() => METIERS.find(m => m.id === category)?.label ?? category, [category])
  const primaryService = useMemo(() => services.find(s => s.name.trim()) ?? services[0], [services])

  const previewPhotoUrl = profilePhoto?.previewUrl ?? null

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const fw = iframeRef.current?.contentWindow
    if (!fw) return
    fw.postMessage(
      {
        type: 'PREVIEW_UPDATE',
        payload: {
          fullName,
          categoryLabel,
          city,
          bio,
          accentColor,
          vibe,
          btnStyle,
          serviceName: primaryService?.name ?? '',
          serviceDuration: primaryService?.duration ?? '1h',
          servicePrice: String(primaryService?.price ?? '0'),
          photoUrl: previewPhotoUrl ?? '',
          fontTitle: currentFontPair.title,
          fontBody: currentFontPair.body,
        },
      },
      '*'
    )
  }, [fullName, categoryLabel, city, bio, accentColor, vibe, btnStyle, primaryService, previewPhotoUrl, currentFontPair])

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
          strengths,
          toneStyle,
          targetClient,
          yearsExp,
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
      const res = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          fullName,
          bio,
          city,
          category,
          accentColor,
          template,
          vibe,
          fontPair,
          btnStyle,
          services: services.filter(s => s.name.trim()).map(s => ({
            name: s.name,
            duration: s.duration,
            price: Number(s.price),
          })),
          themeName,
          fontFamily,
          heroImageUrl: heroImageUrl || null,
          logoUrl: logoUrl || null,
          sectionsVisible,
          socialLinks,
          // v3
          schedule,
          scheduleExceptions,
          locationAddress: location.address || null,
          locationLat: location.lat,
          locationLng: location.lng,
          phone: location.phone || null,
          emailContact: location.email || null,
          ctaButtonText: ctaConfig.text,
          ctaButtonStyle: ctaConfig.style,
          ctaButtonAction: ctaConfig.action,
          ctaCustomUrl: ctaConfig.customUrl || null,
          sectionOrder,
          darkMode,
          fontSize,
          showSchedule: sectionsVisible.schedule ?? true,
          showGallery: sectionsVisible.gallery ?? false,
          showReviews: sectionsVisible.reviews ?? true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? 'Publication impossible')

      // Save layout preference
      fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pro_layout: selectedProLayout }),
      }).catch(() => {})

      launchConfetti(2500)
      setTimeout(() => router.push('/dashboard'), 600)
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
            Commencer gratuitement <ArrowRight size={16} strokeWidth={2.6} />
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
                    Configuration de votre profil
                  </div>
                  <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.85rem', fontWeight: 700, color: 'white', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '0.75rem', paddingRight: '0.05em', overflow: 'visible' }}>
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
                        {checked && <Check size={10} strokeWidth={3} color="white" />}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: checked ? '#e2e8f0' : '#334155', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.25s ease' }}>
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Trust Center Premium */}
            <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.10)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a78bfa', fontFamily: 'DM Sans, sans-serif', marginBottom: '1rem' }}>
                Trust Center
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Badge 1 : Indemnité No-show */}
                <div
                  title="Garantie via empreinte bancaire en cas d'absence"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'help' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.15)' }}>
                    <ShieldCheck size={15} color="#8b5cf6" strokeWidth={2} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
                      Indemnité No-show
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'DM Sans, sans-serif' }}>
                      100% sécurisée
                    </span>
                  </div>
                </div>
                {/* Badge 2 : Disponibilité */}
                <div
                  title="Plateforme toujours accessible, même le weekend"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'help' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.15)' }}>
                    <Zap size={15} color="#f59e0b" strokeWidth={2} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
                      Disponibilité
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'DM Sans, sans-serif' }}>
                      24h/7j
                    </span>
                  </div>
                </div>
                {/* Badge 3 : Frais d'entrée */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(236,72,153,0.15)' }}>
                    <Gift size={15} color="#ec4899" strokeWidth={2} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
                      Frais d'entrée
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: "'Clash Display', 'Syne', sans-serif", padding: '2px 8px', border: '1px solid rgba(16,185,129,0.5)', borderRadius: 6, background: 'rgba(16,185,129,0.08)' }}>
                      0€
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="elite-main" style={{ padding: '4rem 3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
              {/* Progress bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: '1.8rem' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: 4, borderRadius: 999, background: i <= step ? `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})` : 'rgba(0,0,0,0.08)', transition: 'all 0.25s ease' }} />
                ))}
              </div>

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: '1.2rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>
                    Étape {step} / 4
                  </div>
                  <div style={{ marginTop: 8, fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '2.1rem', fontWeight: 700, letterSpacing: '-0.03em', color: COLORS.dark, lineHeight: 1.15, paddingRight: '0.05em', overflow: 'visible' }}>
                    Configuration de votre profil
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                    Plan : <span style={{ color: COLORS.dark }}>{plan === 'free' ? 'Starter' : plan === 'premium' ? 'Premium' : 'Infinity'}</span>
                  </div>
                  {loadingPlan && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.78rem' }}>
                      <SpinnerComponent /> Sync…
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
                      <h2 style={{ fontFamily: "'Clash Display', 'Syne', sans-serif", fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.dark }}>
                        Étape 1 : Identité
                      </h2>

                      <div style={{ background: 'white', borderRadius: 22, border: '1px solid rgba(0,0,0,0.08)', padding: '1.4rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.25s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans, sans-serif' }}>Métier</div>
                            <div style={{ marginTop: 8, color: '#64748b', fontSize: '0.92rem', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65 }}>Sélectionnez votre activité : on adapte le rendu automatiquement.</div>
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
                        Étape 2 : Mon offre
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

                          {/* ─── ✨ AI Bio Studio ─── */}
                          <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.04), rgba(236,72,153,0.04))', border: '1.5px solid rgba(124,58,237,0.18)', borderRadius: 18, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>✨</div>
                              <div>
                                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: COLORS.dark }}>Studio de bio IA</div>
                                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>Plus vous remplissez de champs, plus la bio sera unique et percutante</div>
                              </div>
                            </div>

                            {/* 2×2 Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle()}>⭐ Points forts & spécialités <span style={{ color: COLORS.rose }}>*</span></label>
                                <input
                                  className="elite-input"
                                  value={strengths}
                                  onChange={e => setStrengths(e.target.value)}
                                  placeholder="Ex : pierres chaudes, coupe afro, yoga prénatal, 10 ans d'expérience..."
                                />
                                <div style={{ fontSize: '0.68rem', color: '#a78bfa', marginTop: 4, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Champ obligatoire : c'est ici que naît votre singularité</div>
                              </div>

                              <div>
                                <label style={labelStyle()}>Ton & ambiance</label>
                                <select className="elite-input" value={toneStyle} onChange={e => setToneStyle(e.target.value)} style={{ width: '100%' }}>
                                  <option value="">Choisir un ton…</option>
                                  <option value="chaleureux et bienveillant">Chaleureux & bienveillant</option>
                                  <option value="premium et exclusif">Premium & exclusif</option>
                                  <option value="énergique et motivant">Énergique & motivant</option>
                                  <option value="doux et apaisant">Doux & apaisant</option>
                                  <option value="expert et technique">Expert & technique</option>
                                  <option value="naturel et authentique">Naturel & authentique</option>
                                  <option value="fun et accessible">Fun & accessible</option>
                                </select>
                              </div>

                              <div>
                                <label style={labelStyle()}>Client idéal</label>
                                <select className="elite-input" value={targetClient} onChange={e => setTargetClient(e.target.value)} style={{ width: '100%' }}>
                                  <option value="">Tout public</option>
                                  <option value="professionnels actifs et stressés">Professionnels actifs</option>
                                  <option value="sportifs et athlètes">Sportifs & athlètes</option>
                                  <option value="seniors et retraités">Seniors & retraités</option>
                                  <option value="femmes enceintes et jeunes mamans">Futures & jeunes mamans</option>
                                  <option value="personnes en quête de détente et bien-être">Bien-être & détente</option>
                                  <option value="adolescents et jeunes adultes">Ados & jeunes adultes</option>
                                  <option value="femmes actives et modernes">Femmes actives</option>
                                  <option value="chefs d'entreprise et cadres">Cadres & dirigeants</option>
                                </select>
                              </div>

                              <div>
                                <label style={labelStyle()}>Années d'expérience</label>
                                <input
                                  className="elite-input"
                                  type="number" min={0} max={50}
                                  value={yearsExp}
                                  onChange={e => setYearsExp(e.target.value)}
                                  placeholder="Ex : 8"
                                />
                              </div>

                              <div>
                                <label style={labelStyle()}>Diplôme / certification</label>
                                <input
                                  className="elite-input"
                                  value={''}
                                  readOnly
                                  placeholder="Ex : CAP Esthétique, Brevet massage…"
                                  onChange={() => {}}
                                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                  title="Disponible prochainement"
                                />
                              </div>

                            </div>

                            {/* Bio textarea */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <label style={labelStyle()}>Bio générée (150 max)</label>
                                <span style={{ fontSize: '0.72rem', color: bio.length > 130 ? '#ef4444' : '#94a3b8', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, transition: 'color 0.2s' }}>{bio.length}/150</span>
                              </div>
                              <textarea
                                className="elite-input"
                                value={bio}
                                onChange={e => setBio(e.target.value.slice(0, 150))}
                                placeholder="Cliquez sur 'Générer' ou rédigez votre bio manuellement…"
                                style={{ minHeight: 90, resize: 'vertical' }}
                              />
                            </div>

                            {/* Generate button row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                              {aiLoading && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.violet, fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
                                  <SpinnerComponent /> L'IA compose votre bio...
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => void onGenerateBio()}
                                disabled={aiLoading || !strengths.trim()}
                                style={{
                                  height: 44,
                                  padding: '0 1.4rem',
                                  border: 'none',
                                  borderRadius: 999,
                                  background: strengths.trim() ? `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})` : '#e2e8f0',
                                  boxShadow: strengths.trim() && !aiLoading ? '0 8px 32px rgba(124,58,237,0.35)' : 'none',
                                  color: strengths.trim() ? 'white' : '#94a3b8',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  cursor: aiLoading || !strengths.trim() ? 'not-allowed' : 'pointer',
                                  opacity: aiLoading ? 0.65 : 1,
                                  transition: 'all 0.25s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  fontFamily: 'DM Sans, sans-serif',
                                }}
                              >
                                ✨ Générer ma bio{!strengths.trim() && <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.85 }}>(points forts requis)</span>}
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 – Designer Live */}
                {step === 3 && (
                  <motion.div key="step-3" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={transition}>
                    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>

                      {/* LEFT : Dark Glass Console */}
                      <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.05 }}
                        style={{
                          background: 'rgba(11,8,22,0.93)',
                          backdropFilter: 'blur(28px)',
                          WebkitBackdropFilter: 'blur(28px)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          borderRadius: 24,
                          overflow: 'hidden',
                          boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
                        }}
                      >

                        {/* Console title bar */}
                        <div style={{ padding: '0.9rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.9 }} />)}
                          </div>
                          <span style={{ marginLeft: 6, fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'DM Sans,sans-serif' }}>Design Studio</span>
                          <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}`, transition: 'background 0.3s, box-shadow 0.3s' }} />
                        </div>

                        {/* ── PRO THEMES ── */}
                        <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>🎨 Thèmes</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {PRO_THEMES.map(t => (
                              <motion.button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setThemeName(t.id)
                                  setAccentColor(t.accent)
                                  setFontFamily(t.font)
                                  setCtaConfig(prev => ({ ...prev, style: t.btn_style as CtaConfig['style'] }))
                                }}
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                style={{
                                  border: `1.5px solid ${themeName === t.id ? t.accent : 'rgba(255,255,255,0.09)'}`,
                                  borderRadius: 12,
                                  padding: '0.5rem 0.6rem',
                                  background: themeName === t.id ? `${t.accent}20` : 'rgba(255,255,255,0.04)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  boxShadow: themeName === t.id ? `0 0 0 1px ${t.accent}50` : 'none',
                                  transition: 'border-color 0.2s, background 0.2s',
                                }}
                              >
                                <div style={{ borderRadius: 6, background: t.bg, padding: '4px 5px', marginBottom: 5, overflow: 'hidden' }}>
                                  <div style={{ height: 3, borderRadius: 99, background: t.accent, width: '50%', marginBottom: 3 }} />
                                  <div style={{ height: 2, borderRadius: 99, background: t.text, opacity: 0.3, width: '100%', marginBottom: 3 }} />
                                  <div style={{ height: 10, borderRadius: 4, background: `linear-gradient(135deg,${t.accent},${t.accent}bb)` }} />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.65rem', color: 'white', fontFamily: 'DM Sans,sans-serif', lineHeight: 1.1 }}>{t.name}</div>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* ── VIBES ── */}
                        <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>✦ Style de page</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                            {VIBES.map(v => (
                              <motion.button
                                key={v.id}
                                type="button"
                                onClick={() => setVibe(v.id)}
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                style={{
                                  border: `1.5px solid ${vibe === v.id ? accentColor : 'rgba(255,255,255,0.09)'}`,
                                  borderRadius: 14,
                                  padding: '0.6rem 0.7rem',
                                  background: vibe === v.id ? `${accentColor}18` : 'rgba(255,255,255,0.04)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  boxShadow: vibe === v.id ? `0 0 0 1px ${accentColor}50, 0 6px 24px ${accentColor}25` : 'none',
                                  transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
                                }}
                              >
                                {/* Mini site thumbnail */}
                                <div style={{ borderRadius: 7, padding: '0.4rem 0.5rem', background: v.bg, marginBottom: 7, overflow: 'hidden' }}>
                                  <div style={{ height: 4, borderRadius: 99, background: accentColor, width: '55%', marginBottom: 4, transition: 'background 0.3s' }} />
                                  <div style={{ height: 2.5, borderRadius: 99, background: v.text, opacity: 0.35, width: '100%', marginBottom: 3 }} />
                                  <div style={{ height: 2.5, borderRadius: 99, background: v.text, opacity: 0.2, width: '75%', marginBottom: 5 }} />
                                  <div style={{ height: 18, borderRadius: 5, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                                    <div style={{ height: 2, width: '40%', borderRadius: 99, background: 'rgba(255,255,255,0.8)' }} />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ fontSize: '0.9rem' }}>{v.emoji}</span>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.73rem', color: 'white', fontFamily: 'DM Sans,sans-serif', lineHeight: 1.1 }}>{v.label}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)', marginTop: 1, lineHeight: 1.2 }}>{v.desc}</div>
                                  </div>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* ── ACCENT COLOR GRID ── */}
                        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>Couleur d'accent</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 7 }}>
                            {ACCENT_COLORS.map(c => (
                              <motion.button
                                key={c.hex}
                                type="button"
                                onClick={() => setAccentColor(c.hex)}
                                whileHover={{ scale: 1.22, y: -2 }}
                                whileTap={{ scale: 0.85 }}
                                transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                                title={c.name}
                                style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', background: c.hex, border: accentColor === c.hex ? '2.5px solid white' : '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', outline: 'none', boxShadow: accentColor === c.hex ? `0 0 0 3px ${c.hex}60, 0 4px 12px ${c.hex}50` : 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* TYPOGRAPHY : Elite gated */}
                        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>Typographie</div>
                            {plan === 'free' && (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                style={{ fontSize: '0.58rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', letterSpacing: '0.06em' }}
                              >
                                ELITE ✦
                              </motion.span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
                            {FONT_PAIRS.map(fp => (
                              <motion.button
                                key={fp.id}
                                type="button"
                                onClick={() => { if (plan !== 'free') setFontPair(fp.id) }}
                                whileHover={plan !== 'free' ? { x: 4 } : {}}
                                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                style={{
                                  border: `1.5px solid ${fontPair === fp.id && plan !== 'free' ? accentColor : 'rgba(255,255,255,0.07)'}`,
                                  borderRadius: 10,
                                  padding: '0.45rem 0.75rem',
                                  background: fontPair === fp.id && plan !== 'free' ? `${accentColor}1a` : 'rgba(255,255,255,0.03)',
                                  cursor: plan !== 'free' ? 'pointer' : 'default',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  opacity: plan === 'free' ? 0.4 : 1,
                                  transition: 'border-color 0.2s, background 0.2s',
                                }}
                              >
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'white', fontFamily: 'DM Sans,sans-serif' }}>{fp.title}</div>
                                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)' }}>{fp.body}</div>
                                </div>
                                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: fontPair === fp.id && plan !== 'free' ? accentColor : 'rgba(255,255,255,0.28)', transition: 'color 0.2s' }}>{fp.label}</span>
                              </motion.button>
                            ))}
                            {plan === 'free' && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ position: 'absolute', inset: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
                              >
                                <Link href="/dashboard/pricing" onClick={e => e.stopPropagation()} style={{ fontSize: '0.73rem', fontWeight: 700, color: 'white', background: 'rgba(124,58,237,0.75)', padding: '7px 16px', borderRadius: 999, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)', backdropFilter: 'blur(4px)' }}>
                                  🔓 Débloquer avec Elite
                                </Link>
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {/* ── BUTTON STYLE ── */}
                        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>Style des boutons</div>
                          <div style={{ display: 'flex', gap: 7 }}>
                            {(['pill', 'rounded', 'square'] as BtnStyle[]).map((id, i) => (
                              <motion.button
                                key={id}
                                type="button"
                                onClick={() => setBtnStyle(id)}
                                whileHover={{ scale: 1.07, y: -3 }}
                                whileTap={{ scale: 0.94 }}
                                transition={{ type: 'spring', stiffness: 550, damping: 26 }}
                                style={{
                                  flex: 1,
                                  height: 40,
                                  borderRadius: [999, 12, 4][i],
                                  border: `1.5px solid ${btnStyle === id ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                  background: btnStyle === id ? accentColor : 'rgba(255,255,255,0.05)',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.73rem',
                                  cursor: 'pointer',
                                  fontFamily: 'DM Sans,sans-serif',
                                  boxShadow: btnStyle === id ? `0 4px 18px ${accentColor}50` : 'none',
                                  transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
                                }}
                              >
                                {['Pill', 'Arrondi', 'Carré'][i]}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* ── SECTIONS VISIBLES ── */}
                        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>Sections visibles</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {([
                              { key: 'about',    label: 'À propos',      elite: false },
                              { key: 'reviews',  label: 'Avis clients',  elite: false },
                              { key: 'schedule', label: 'Horaires',      elite: false },
                              { key: 'gallery',  label: 'Galerie photos',elite: true  },
                              { key: 'blog',     label: 'Blog',          elite: true  },
                            ] as { key: keyof Sections; label: string; elite: boolean }[]).map(item => {
                              const locked = item.elite && plan !== 'infinity'
                              return (
                                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <button
                                    type="button"
                                    disabled={locked}
                                    onClick={() => !locked && setSectionsVisible(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                    style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${sectionsVisible[item.key] && !locked ? accentColor : 'rgba(255,255,255,0.2)'}`, background: sectionsVisible[item.key] && !locked ? accentColor : 'transparent', cursor: locked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', opacity: locked ? 0.4 : 1 }}
                                  >
                                    {sectionsVisible[item.key] && !locked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                  </button>
                                  <span style={{ fontSize: '0.78rem', color: locked ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.75)', fontFamily: 'DM Sans,sans-serif' }}>{item.label}</span>
                                  {item.elite && <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 6px', borderRadius: 999, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: 'white', letterSpacing: '0.06em', marginLeft: 'auto' }}>ELITE ✦</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* ── SHARE ── */}
                        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>Lien public</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', fontSize: '0.73rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'DM Sans,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              calendapro.fr/<strong style={{ color: accentColor }}>{username || '...'}</strong>
                            </div>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                void navigator.clipboard?.writeText(`https://calendapro.fr/${username}`)
                                setCopiedLink(true)
                                setTimeout(() => setCopiedLink(false), 2000)
                              }}
                              style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: copiedLink ? '#10b981' : accentColor, color: 'white', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.3s' }}
                            >
                              {copiedLink ? '✓ Copié' : '🔗 Copier'}
                            </motion.button>
                          </div>
                        </div>

                        {/* ── SCHEDULE ── */}
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <button
                            type="button"
                            onClick={() => setOpenConsoleSection(s => s === 'schedule' ? null : 'schedule')}
                            style={{ width: '100%', padding: '0.85rem 1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>🕐 Horaires</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: openConsoleSection === 'schedule' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                          </button>
                          {openConsoleSection === 'schedule' && (
                            <div style={{ padding: '0 1.1rem 1rem' }}>
                              <ScheduleEditor
                                value={schedule}
                                onChange={setSchedule}
                                exceptions={scheduleExceptions}
                                onExceptionsChange={setScheduleExceptions}
                                accentColor={accentColor}
                              />
                            </div>
                          )}
                        </div>

                        {/* ── LOCATION ── */}
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <button
                            type="button"
                            onClick={() => setOpenConsoleSection(s => s === 'location' ? null : 'location')}
                            style={{ width: '100%', padding: '0.85rem 1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>📍 Localisation</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: openConsoleSection === 'location' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                          </button>
                          {openConsoleSection === 'location' && (
                            <div style={{ padding: '0 1.1rem 1rem' }}>
                              <LocationEditor value={location} onChange={setLocation} accentColor={accentColor} />
                            </div>
                          )}
                        </div>

                        {/* ── CTA ── */}
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <button
                            type="button"
                            onClick={() => setOpenConsoleSection(s => s === 'cta' ? null : 'cta')}
                            style={{ width: '100%', padding: '0.85rem 1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>🎯 Bouton CTA</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: openConsoleSection === 'cta' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                          </button>
                          {openConsoleSection === 'cta' && (
                            <div style={{ padding: '0 1.1rem 1rem' }}>
                              <CtaEditor value={ctaConfig} onChange={setCtaConfig} accentColor={accentColor} />
                            </div>
                          )}
                        </div>

                        {/* ── REVIEWS PREVIEW ── */}
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <button
                            type="button"
                            onClick={() => setOpenConsoleSection(s => s === 'reviews' ? null : 'reviews')}
                            style={{ width: '100%', padding: '0.85rem 1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>⭐ Aperçu avis</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: openConsoleSection === 'reviews' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                          </button>
                          {openConsoleSection === 'reviews' && (
                            <div style={{ padding: '0 1.1rem 1rem' }}>
                              <ReviewsPreview
                                username={username}
                                accentColor={accentColor}
                                maxVisible={reviewsMaxVisible}
                                onMaxVisibleChange={setReviewsMaxVisible}
                                sortMode={reviewsSortMode}
                                onSortModeChange={setReviewsSortMode}
                              />
                            </div>
                          )}
                        </div>

                        {/* ── SECTION ORDER ── */}
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <button
                            type="button"
                            onClick={() => setOpenConsoleSection(s => s === 'order' ? null : 'order')}
                            style={{ width: '100%', padding: '0.85rem 1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          >
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>↕ Ordre des sections</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: openConsoleSection === 'order' ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                          </button>
                          {openConsoleSection === 'order' && (
                            <div style={{ padding: '0 1.1rem 1rem' }}>
                              <SectionReorder order={sectionOrder} onChange={setSectionOrder} accentColor={accentColor} />
                            </div>
                          )}
                        </div>

                        {/* ── APPEARANCE ── */}
                        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>🌙 Apparence</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Dark mode */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans,sans-serif' }}>Mode sombre</span>
                              <button
                                type="button"
                                onClick={() => setDarkMode(d => !d)}
                                style={{ width: 38, height: 22, borderRadius: 99, background: darkMode ? accentColor : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}
                              >
                                <div style={{ position: 'absolute', top: 3, left: darkMode ? 'calc(100% - 19px)' : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                              </button>
                            </div>
                            {/* Font size */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans,sans-serif' }}>Taille de police</span>
                                <span style={{ fontSize: '0.68rem', color: accentColor, fontWeight: 700, fontFamily: 'DM Sans,sans-serif', textTransform: 'capitalize' }}>{fontSize}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 5 }}>
                                {(['small', 'normal', 'large'] as const).map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFontSize(s)}
                                    style={{ flex: 1, height: 30, borderRadius: 8, border: `1.5px solid ${fontSize === s ? accentColor : 'rgba(255,255,255,0.1)'}`, background: fontSize === s ? `${accentColor}20` : 'rgba(255,255,255,0.04)', color: fontSize === s ? 'white' : 'rgba(255,255,255,0.45)', fontSize: s === 'small' ? '0.62rem' : s === 'large' ? '0.82rem' : '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all 0.2s' }}
                                  >
                                    {s === 'small' ? 'Petit' : s === 'large' ? 'Grand' : 'Normal'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── PHOTO ── */}
                        <div style={{ padding: '0.9rem 1.1rem' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontFamily: 'DM Sans,sans-serif' }}>Photo de profil</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <motion.label
                              htmlFor="profile-photo"
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.94 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void pickProfilePhoto(f) }}
                              style={{ width: 66, height: 66, borderRadius: '50%', border: `2px dashed ${accentColor}55`, background: 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, transition: 'border-color 0.3s' }}
                            >
                              {previewPhotoUrl ? <img src={previewPhotoUrl} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={28} strokeWidth={1.8} color={COLORS.violet} />}
                            </motion.label>
                            <input id="profile-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) void pickProfilePhoto(f) }} />
                            <div>
                              {photoUploading
                                ? <span style={{ fontSize: '0.76rem', color: accentColor, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.3s' }}><SpinnerComponent /> Upload…</span>
                                : <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>Glissez ou cliquez</span>
                              }
                              <div style={{ marginTop: 8 }}><PhotoDropzone photos={photos} onChange={setPhotos} label="Galerie" /></div>
                            </div>
                          </div>
                        </div>

                      </motion.div>{/* end dark glass console */}

                      {/* RIGHT : Live Preview iframe */}
                      <div style={{ position: 'sticky', top: 20, borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.07)' }}>
                        {/* Browser chrome */}
                        <div style={{ background: '#f1f5f9', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
                          </div>
                          <div style={{ flex: 1, background: 'white', borderRadius: 7, padding: '4px 10px', fontSize: '0.74rem', color: '#64748b', fontFamily: 'DM Sans,sans-serif', border: '1px solid rgba(0,0,0,0.06)' }}>
                            calendapro.fr/<strong style={{ color: COLORS.dark }}>{username || 'votre-nom'}</strong>
                          </div>
                          <div style={{ padding: '3px 10px', borderRadius: 7, background: `${accentColor}18`, color: accentColor, fontSize: '0.68rem', fontWeight: 800, transition: 'all 0.3s' }}>LIVE</div>
                        </div>
                        {/* Actual iframe : receives postMessage updates */}
                        <iframe
                          ref={iframeRef}
                          src={`/api/pro/live-preview?name=${encodeURIComponent(fullName)}&metier=${encodeURIComponent(categoryLabel)}&city=${encodeURIComponent(city)}&accent=${encodeURIComponent(accentColor)}&theme=${themeName}&btn=${ctaConfig.style}&font=${encodeURIComponent(fontFamily)}&bio=${encodeURIComponent(bio)}&hero=${encodeURIComponent(heroImageUrl)}&logo=${encodeURIComponent(logoUrl)}&services=${encodeURIComponent(JSON.stringify(services.filter(s=>s.name.trim()).map(s=>({name:s.name,price:s.price,duration:s.duration}))))}&sections=${encodeURIComponent(JSON.stringify(sectionsVisible))}&ctaText=${encodeURIComponent(ctaConfig.text)}&ctaStyle=${ctaConfig.style}&phone=${encodeURIComponent(location.phone)}&address=${encodeURIComponent(location.address)}&dark=${darkMode?'1':'0'}&sched=${encodeURIComponent(JSON.stringify(schedule))}`}
                          style={{ width: '100%', height: 580, border: 'none', display: 'block', transition: 'background 0.4s' }}
                          title="Live preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* STEP 4 – Lancement & Marketing */}
                {step === 4 && (
                  <motion.div key="step-4" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={transition}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 740, margin: '0 auto' }}>

                      {/* Magic link */}
                      <div style={{ background: `linear-gradient(135deg, ${COLORS.violet}10, ${COLORS.rose}08)`, border: `1.5px solid ${COLORS.violet}22`, borderRadius: 22, padding: '1.8rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.violet, marginBottom: 8, fontFamily: 'DM Sans,sans-serif' }}>Ton site est prêt 🎉</div>
                        <div style={{ fontFamily: "'Clash Display','Syne',sans-serif", fontSize: '1.5rem', fontWeight: 700, color: COLORS.dark, marginBottom: 14 }}>
                          calendapro.fr/<span style={{ ...gradientTextStyle() }}>{username || 'votre-nom'}</span>
                        </div>
                        <button type="button" onClick={() => { if (username) void navigator.clipboard?.writeText(`https://calendapro.fr/${username}`) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0.5rem 1.1rem', borderRadius: 999, border: `1px solid ${COLORS.violet}28`, background: 'white', color: COLORS.violet, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          Copier le lien
                        </button>
                      </div>

                      {/* Social links */}
                      <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: '1.4rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, marginBottom: 14, fontFamily: 'DM Sans,sans-serif' }}>Réseaux sociaux</div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          {([
                            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/votre-profil' },
                            { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@votre-profil'  },
                            { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/votre-page'   },
                            { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/votre-profil' },
                            { key: 'whatsapp',  label: 'WhatsApp',  placeholder: '+33 6 12 34 56 78'                 },
                          ] as { key: string; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                            <div key={key} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8 }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', fontFamily: 'DM Sans,sans-serif' }}>{label}</label>
                              <input
                                className="elite-input"
                                placeholder={placeholder}
                                value={socialLinks[key] ?? ''}
                                onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                                style={{ fontSize: '0.82rem' }}
                              />
                            </div>
                          ))}
                        </div>
                        {socialLinks.whatsapp && (
                          <button
                            type="button"
                            onClick={() => {
                              const phone = (socialLinks.whatsapp ?? '').replace(/\D/g, '')
                              void navigator.clipboard?.writeText(`https://wa.me/${phone}`)
                            }}
                            style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: `1px solid ${COLORS.violet}28`, background: 'white', color: COLORS.violet, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
                          >
                            📋 Copier lien WhatsApp
                          </button>
                        )}
                      </div>

                      {/* Kit marketing */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                        {/* QR Code */}
                        <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: '1.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans,sans-serif' }}>QR Code</div>
                          <div style={{ width: 120, height: 120 }}>
                            {username ? (
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://calendapro.fr/${username}`)}&color=${accentColor.replace('#','')}&bgcolor=ffffff`} alt="QR" style={{ width: 120, height: 120, borderRadius: 12 }} />
                            ) : (
                              <div style={{ width: 120, height: 120, borderRadius: 12, background: '#f1f5f9', display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'DM Sans,sans-serif' }}>Votre QR</div>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', textAlign: 'center', lineHeight: 1.5, fontFamily: 'DM Sans,sans-serif' }}>À imprimer sur vos supports</div>
                        </div>

                        {/* Instagram AI enhanced */}
                        <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #fdf2f8)', borderRadius: 18, border: '1px solid rgba(124,58,237,0.12)', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, fontFamily: 'DM Sans,sans-serif' }}>Post Instagram IA</div>
                          {igPost ? (
                            <>
                              <div style={{ fontSize: '0.8rem', color: COLORS.dark, lineHeight: 1.6, background: 'white', borderRadius: 10, padding: '0.75rem', border: '1px solid rgba(0,0,0,0.06)', fontFamily: 'DM Sans,sans-serif', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>{igPost}</div>
                              <button type="button" onClick={() => void navigator.clipboard?.writeText(igPost)} style={{ alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 999, border: `1px solid ${COLORS.violet}28`, background: 'white', color: COLORS.violet, fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>📋 Copier</button>
                            </>
                          ) : (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.55, fontFamily: 'DM Sans,sans-serif' }}>Caption + hashtags ciblés générés par l'IA en un clic.</p>
                          )}
                          <button type="button" disabled={igPostLoading} onClick={() => {
                            setIgPostLoading(true)
                            fetch('/api/pro/generate-instagram-post', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                profession: categoryLabel,
                                city,
                                services: services.filter(s => s.name.trim()).map(s => s.name),
                                tone: 'professionnelle',
                                fullName,
                                username,
                                bio,
                              })
                            })
                              .then(r => r.json())
                              .then((d: { caption?: string; hashtags?: string[] }) => {
                                const hashtags = (d.hashtags ?? []).join(' ')
                                setIgPost(`${d.caption ?? ''}\n\n${hashtags}`)
                              })
                              .catch(() => {})
                              .finally(() => setIgPostLoading(false))
                          }} style={{ height: 40, borderRadius: 999, border: 'none', background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`, color: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: igPostLoading ? 'not-allowed' : 'pointer', opacity: igPostLoading ? 0.65 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.25s', fontFamily: 'DM Sans,sans-serif' }}>
                            {igPostLoading ? <><SpinnerComponent /> Génération…</> : '✨ Générer caption + hashtags'}
                          </button>
                        </div>
                      </div>

                      {/* Dashboard Layout */}
                      <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: '1.2rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, marginBottom: 6, fontFamily: 'DM Sans,sans-serif' }}>Votre style de tableau de bord</div>
                        <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0 0 14px', fontFamily: 'DM Sans,sans-serif' }}>
                          {PRO_LAYOUTS[selectedProLayout].idealFor}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                          {PRO_LAYOUT_IDS.map(id => {
                            const layout = PRO_LAYOUTS[id]
                            const isActive = selectedProLayout === id
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setSelectedProLayout(id)}
                                style={{
                                  borderRadius: 10,
                                  border: `2px solid ${isActive ? COLORS.violet : 'rgba(0,0,0,0.08)'}`,
                                  background: isActive ? `${COLORS.violet}08` : 'white',
                                  padding: '8px 6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {/* Mini preview */}
                                <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden', background: layout.preview?.bg ?? '#f8f7f4', display: 'flex', marginBottom: 6 }}>
                                  <div style={{ width: '28%', background: layout.preview?.sidebar ?? '#ffffff', borderRight: '1px solid rgba(0,0,0,0.1)' }} />
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: 4 }}>
                                    {[1,2,3].map(i => (
                                      <div key={i} style={{ height: 4, borderRadius: 2, background: i === 1 ? (layout.preview?.accent ?? '#7c3aed') : (layout.preview?.card ?? '#ffffff'), opacity: 0.8 }} />
                                    ))}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.62rem', fontWeight: isActive ? 700 : 500, color: isActive ? COLORS.violet : '#64748b', fontFamily: 'DM Sans,sans-serif', textAlign: 'center' }}>
                                  {layout.name}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Template */}
                      <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: '1.2rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.violet, marginBottom: 12, fontFamily: 'DM Sans,sans-serif' }}>Template de page</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                          {(['minimal', 'visual', 'direct'] as SmartTemplate[]).map(tpl => {
                            const locked = !canUseTemplate(tpl)
                            const selected = template === tpl
                            const smart = recommendedTemplate === tpl
                            return (
                              <button key={tpl} type="button" onClick={() => { if (!locked) setTemplate(tpl) }} disabled={locked} style={{ borderRadius: 14, border: `2px solid ${selected ? COLORS.violet : 'rgba(0,0,0,0.08)'}`, background: tpl === 'visual' ? COLORS.dark : 'white', padding: '1rem 0.8rem', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1, textAlign: 'left', position: 'relative', transition: 'all 0.2s', boxShadow: selected ? '0 8px 28px rgba(124,58,237,0.15)' : 'none' }}>
                                {smart && !locked && <div style={{ position: 'absolute', top: 8, right: 8, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`, color: 'white', borderRadius: 999, padding: '2px 7px', fontSize: '0.6rem', fontWeight: 800 }}>Smart</div>}
                                {locked && <div style={{ position: 'absolute', top: 8, right: 8 }}><Lock size={16} strokeWidth={1.8} color="#64748b" /></div>}
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: tpl === 'visual' ? 'white' : COLORS.dark, fontFamily: 'DM Sans,sans-serif' }}>{tpl === 'minimal' ? 'Minimal' : tpl === 'visual' ? 'Visuel' : 'Direct'}</div>
                                <div style={{ fontSize: '0.7rem', color: tpl === 'visual' ? 'rgba(255,255,255,0.55)' : '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{tpl === 'minimal' ? 'Blanc · Épuré' : tpl === 'visual' ? 'Sombre · Hero' : 'RDV en avant'}</div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Publish CTA */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '1.2rem 1.6rem', background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: COLORS.dark, fontSize: '1rem', fontFamily: 'DM Sans,sans-serif' }}>Tout est prêt !</div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2, fontFamily: 'DM Sans,sans-serif' }}>Votre page sera en ligne sur <strong style={{ color: COLORS.dark }}>/{username || '...'}</strong></div>
                        </div>
                        <button type="button" onClick={() => void publish()} disabled={publishLoading || !username.trim()} style={{ height: 56, padding: '0 2rem', border: 'none', borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.rose})`, boxShadow: '0 8px 36px rgba(124,58,237,0.4)', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: publishLoading ? 'not-allowed' : 'pointer', opacity: publishLoading ? 0.65 : 1, display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 0.25s', whiteSpace: 'nowrap', fontFamily: 'DM Sans,sans-serif' }}>
                          {publishLoading ? <><SpinnerComponent /> Publication…</> : '🚀 Mettre en ligne'}
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
                  <ArrowLeft size={16} strokeWidth={2.6} /> Retour
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
                    Continuer <ArrowRight size={16} strokeWidth={2.6} />
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

function SpinnerComponent() {
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

