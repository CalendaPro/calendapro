'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Check, CheckCircle,
  Search, Users, Share2, Megaphone, MapPin, MoreHorizontal,
  Scissors, Sparkles, Dumbbell, Camera, Lightbulb, Heart,
  Palette, Briefcase, Music2, Wrench,
  Globe, Sunrise, Sun, Moon, Phone,
} from 'lucide-react'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
type SourceOption = { id: string; label: string; icon: React.ReactNode }
type ServiceOption = { id: string; label: string; icon: React.ReactNode }

// ─────────────────────────────────────────
// Data
// ─────────────────────────────────────────
const SOURCES: SourceOption[] = [
  { id: 'google',         label: 'Via Google',                        icon: <Search size={18} /> },
  { id: 'recommendation', label: "Un ami me l'a recommande",          icon: <Users size={18} /> },
  { id: 'social',         label: 'Reseaux sociaux (Instagram, TikTok)', icon: <Share2 size={18} /> },
  { id: 'ads',            label: 'Publicite en ligne',                icon: <Megaphone size={18} /> },
  { id: 'local',          label: "J'ai trouve le site en cherchant",  icon: <MapPin size={18} /> },
  { id: 'other',          label: 'Autre',                             icon: <MoreHorizontal size={18} /> },
]

const SERVICES: ServiceOption[] = [
  { id: 'hair',    label: 'Coiffure & Beaute',            icon: <Scissors size={18} /> },
  { id: 'wellness',label: 'Bien-etre & Spa',              icon: <Sparkles size={18} /> },
  { id: 'fitness', label: 'Sport & Fitness',              icon: <Dumbbell size={18} /> },
  { id: 'photo',   label: 'Photographie',                 icon: <Camera size={18} /> },
  { id: 'coaching',label: 'Coaching & Developpement',     icon: <Lightbulb size={18} /> },
  { id: 'health',  label: 'Sante & Medical',              icon: <Heart size={18} /> },
  { id: 'art',     label: 'Art & Creatif',                icon: <Palette size={18} /> },
  { id: 'business',label: 'Conseil & Business',           icon: <Briefcase size={18} /> },
  { id: 'music',   label: 'Divertissement',               icon: <Music2 size={18} /> },
  { id: 'repair',  label: 'Reparation & Services',        icon: <Wrench size={18} /> },
]

const RADII = [5, 10, 25, 50]

const CONFETTI_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316']

// ─────────────────────────────────────────
// Toggle component
// ─────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onChange(!value)}
      style={{
        width: 42, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
        background: value ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : '#e2e8f0',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 20 : 2,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

// ─────────────────────────────────────────
// Step indicator circle
// ─────────────────────────────────────────
function StepCircle({ num, current, total }: { num: number; current: number; total: number }) {
  const done = num < current
  const active = num === current
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.78rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.3s',
        background: done
          ? 'linear-gradient(135deg, #7c3aed, #ec4899)'
          : active
            ? '#ffffff'
            : '#f1f5f9',
        border: active ? '2px solid #7c3aed' : done ? 'none' : '2px solid #e2e8f0',
        color: done ? '#fff' : active ? '#7c3aed' : '#94a3b8',
        boxShadow: active ? '0 0 0 4px rgba(124,58,237,0.12)' : 'none',
      }}>
        {done ? <Check size={14} strokeWidth={2.5} /> : num}
      </div>
      {num < total && (
        <div style={{
          width: 40, height: 2, margin: '0 4px',
          background: num < current ? 'linear-gradient(90deg, #7c3aed, #ec4899)' : '#e2e8f0',
          transition: 'background 0.4s',
        }} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// Slide variants
// ─────────────────────────────────────────
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: EASE } }),
}

// ─────────────────────────────────────────
// CSS (injected as style tag)
// ─────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f8f7f4;
  --surface: #ffffff;
  --surface-2: #fafaf8;
  --border: rgba(0,0,0,0.08);
  --border-focus: #7c3aed;
  --text: #0f172a;
  --text-muted: #64748b;
  --text-light: #94a3b8;
  --accent: #7c3aed;
  --accent-light: rgba(124,58,237,0.06);
  --accent-ring: rgba(124,58,237,0.12);
  --gradient: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 16px 48px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  --shadow-accent: 0 8px 24px rgba(124,58,237,0.28);
  --r-sm: 8px; --r-md: 14px; --r-lg: 22px; --r-xl: 28px; --r-full: 9999px;
}

html, body { font-family: 'DM Sans', sans-serif; background: var(--bg); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
}
@keyframes checkPop {
  0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); }
}

.ob-root {
  min-height: 100vh;
  background: var(--bg);
  display: flex; flex-direction: column;
  font-family: 'DM Sans', sans-serif;
  position: relative; overflow-x: hidden;
}

.ob-header {
  position: fixed; top: 0; left: 0; right: 0;
  height: 64px; z-index: 100;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2.5rem; gap: 1rem;
}

.ob-progress {
  position: fixed; top: 64px; left: 0; right: 0;
  height: 3px; background: rgba(0,0,0,0.06); z-index: 99;
}
.ob-progress-fill {
  height: 100%; background: var(--gradient);
  transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
}

.ob-center {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 96px 1rem 2rem;
}

.ob-card {
  background: var(--surface);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg);
  width: 100%; max-width: 560px;
  overflow: hidden;
  border: 1px solid var(--border);
  animation: fadeUp 0.4s cubic-bezier(0.4,0,0.2,1);
}

.ob-card-head { padding: 2rem 2.5rem 0; }
.ob-card-body { padding: 1.75rem 2.5rem; }
.ob-card-foot {
  padding: 1.25rem 2.5rem 1.75rem;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}

.ob-badge {
  display: inline-flex; align-items: center;
  background: var(--accent-light); color: var(--accent);
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.3rem 0.9rem; border-radius: var(--r-full);
}

.ob-title {
  font-family: 'Clash Display', 'DM Sans', sans-serif;
  font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em;
  color: var(--text); margin-top: 0.75rem; line-height: 1.1;
}

.ob-subtitle {
  font-size: 0.88rem; color: var(--text-muted);
  font-weight: 300; margin-top: 0.5rem; line-height: 1.6;
}

/* ── Source options ── */
.ob-option {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.9rem 1.1rem; border-radius: var(--r-md);
  border: 1.5px solid var(--border); cursor: pointer;
  transition: all 0.18s ease; user-select: none;
}
.ob-option:hover { border-color: rgba(124,58,237,0.3); background: var(--accent-light); transform: translateX(3px); }
.ob-option.selected { border-color: var(--accent); background: var(--accent-light); box-shadow: 0 0 0 3px var(--accent-ring); }
.ob-option-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: #f1f5f9; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); flex-shrink: 0; transition: all 0.18s;
}
.ob-option.selected .ob-option-icon { background: rgba(124,58,237,0.1); color: var(--accent); }
.ob-option-label { flex: 1; font-size: 0.88rem; font-weight: 400; color: var(--text); }
.ob-radio {
  width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border);
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  transition: all 0.18s; background: transparent;
}
.ob-option.selected .ob-radio { border-color: var(--accent); background: var(--accent); }

/* ── Services grid ── */
.ob-services-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.65rem;
}
.ob-service {
  padding: 1.1rem 0.9rem; border-radius: var(--r-md);
  border: 1.5px solid var(--border);
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.6rem;
  cursor: pointer; transition: all 0.18s ease; position: relative; user-select: none;
}
.ob-service:hover:not(.disabled) { border-color: rgba(124,58,237,0.25); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.ob-service.selected { border-color: var(--accent); background: var(--accent-light); }
.ob-service.disabled { opacity: 0.35; cursor: not-allowed; }
.ob-service-check {
  position: absolute; top: 8px; right: 8px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--gradient);
  display: flex; align-items: center; justify-content: center;
  animation: checkPop 0.25s cubic-bezier(0.4,0,0.2,1);
}
.ob-service-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: #f1f5f9; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); transition: all 0.18s;
}
.ob-service.selected .ob-service-icon { background: rgba(124,58,237,0.1); color: var(--accent); }
.ob-service-label { font-size: 0.72rem; font-weight: 500; color: var(--text); line-height: 1.3; }

/* ── Location ── */
.ob-input-wrap { position: relative; }
.ob-input-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--text-light); pointer-events: none;
}
.ob-input {
  width: 100%; padding: 0.85rem 1rem 0.85rem 2.6rem;
  border-radius: var(--r-md); border: 1.5px solid var(--border);
  font-size: 0.95rem; font-family: 'DM Sans', sans-serif;
  background: var(--surface); color: var(--text);
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.ob-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
.ob-pills { display: flex; gap: 0.5rem; }
.ob-pill {
  flex: 1; text-align: center; padding: 0.55rem;
  border-radius: var(--r-full); border: 1.5px solid var(--border);
  font-size: 0.82rem; font-weight: 500; cursor: pointer;
  transition: all 0.18s; color: var(--text-muted); white-space: nowrap;
}
.ob-pill:hover { border-color: rgba(124,58,237,0.3); color: var(--accent); }
.ob-pill.active { background: var(--gradient); color: white; border-color: transparent; box-shadow: var(--shadow-accent); }
.ob-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1rem; border-radius: var(--r-md);
  background: var(--surface-2); border: 1px solid var(--border);
}
.ob-time-cards { display: flex; gap: 0.65rem; }
.ob-time-card {
  flex: 1; padding: 0.85rem 0.5rem; border-radius: var(--r-md);
  border: 1.5px solid var(--border);
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  cursor: pointer; transition: all 0.18s; color: var(--text-muted);
}
.ob-time-card:hover { border-color: rgba(124,58,237,0.25); color: var(--accent); }
.ob-time-card.selected { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
.ob-time-label { font-size: 0.72rem; font-weight: 500; }

/* ── Step 4 ── */
.ob-avatar-zone {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.ob-avatar-circle {
  width: 88px; height: 88px; border-radius: 50%;
  background: #f1f5f9; border: 2px dashed #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative; overflow: hidden;
  transition: all 0.2s;
}
.ob-avatar-circle:hover { border-color: var(--accent); background: var(--accent-light); }
.ob-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
.ob-phone-row { display: flex; gap: 0.5rem; }
.ob-phone-prefix {
  padding: 0.85rem 0.85rem; border-radius: var(--r-md);
  border: 1.5px solid var(--border); background: var(--surface-2);
  font-size: 0.9rem; color: var(--text-muted); white-space: nowrap;
  display: flex; align-items: center; gap: 0.35rem;
}
.ob-input-plain {
  flex: 1; padding: 0.85rem 1rem; border-radius: var(--r-md);
  border: 1.5px solid var(--border); font-size: 0.95rem;
  font-family: 'DM Sans', sans-serif; background: var(--surface); color: var(--text);
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.ob-input-plain:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }

/* ── Success ── */
.ob-success {
  text-align: center; padding: 3rem 2.5rem; position: relative; overflow: hidden;
}
.ob-confetti-piece {
  position: absolute; width: 8px; height: 8px; border-radius: 2px;
  animation: confettiFall 1.8s ease-in forwards;
}

/* ── Buttons ── */
.ob-btn-back {
  display: flex; align-items: center; gap: 0.4rem;
  background: none; border: none; cursor: pointer;
  font-size: 0.85rem; color: var(--text-muted); font-family: 'DM Sans', sans-serif;
  padding: 0.5rem; transition: color 0.15s;
}
.ob-btn-back:hover { color: var(--text); }
.ob-btn-skip {
  background: none; border: none; cursor: pointer;
  font-size: 0.8rem; color: var(--text-light); font-family: 'DM Sans', sans-serif;
  padding: 0.5rem; transition: color 0.15s;
}
.ob-btn-skip:hover { color: var(--text-muted); }
.ob-btn-next {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border: none; border-radius: var(--r-full);
  font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.9rem;
  cursor: pointer; transition: all 0.2s ease;
}
.ob-btn-next.ready {
  background: var(--gradient); color: white; box-shadow: var(--shadow-accent);
}
.ob-btn-next.not-ready {
  background: #f1f5f9; color: var(--text-light); cursor: not-allowed;
}
.ob-btn-primary {
  width: 100%; padding: 1rem; border: none; border-radius: var(--r-full);
  background: var(--gradient); color: white;
  font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; box-shadow: var(--shadow-accent);
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  transition: opacity 0.15s;
}
.ob-btn-primary:hover { opacity: 0.9; }
.ob-btn-ghost {
  width: 100%; padding: 0.75rem; border: none; background: none;
  font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
  color: var(--text-muted); cursor: pointer; transition: color 0.15s;
}
.ob-btn-ghost:hover { color: var(--text); }

/* ── Toast ── */
.ob-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #0f172a; color: white; padding: 0.6rem 1.2rem;
  border-radius: var(--r-full); font-size: 0.8rem; font-weight: 500;
  z-index: 200; pointer-events: none; white-space: nowrap;
}

/* ── Section label ── */
.ob-label {
  font-size: 0.8rem; font-weight: 600; color: var(--text); letter-spacing: 0.01em;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .ob-header { padding: 0 1.25rem; }
  .ob-center { padding: 90px 0 0; align-items: flex-start; }
  .ob-card { border-radius: 0; max-width: 100%; min-height: calc(100vh - 67px); box-shadow: none; border: none; }
  .ob-card-head { padding: 1.5rem 1.5rem 0; }
  .ob-card-body { padding: 1.25rem 1.5rem; }
  .ob-card-foot { padding: 1rem 1.5rem 1.5rem; }
  .ob-services-grid { grid-template-columns: repeat(2, 1fr); }
  .ob-pills { overflow-x: auto; flex-wrap: nowrap; }
  .steps-desktop { display: none !important; }
  .ob-title { font-size: 1.45rem; }
}
`

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────
export default function ClientOnboardingPage() {
  const { user } = useUser()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const confettiRef = useRef<HTMLDivElement>(null)

  // Form state
  const [source, setSource] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [radius, setRadius] = useState(10)
  const [includeOnline, setIncludeOnline] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [phone, setPhone] = useState('')
  const [smsReminders, setSmsReminders] = useState(true)

  const TOTAL = 4

  const canNext = useCallback(() => {
    if (step === 1) return true
    if (step === 2) return interests.length > 0
    if (step === 3) return city.trim().length > 0
    return true
  }, [step, interests, city])

  const goNext = () => { setDirection(1); setStep(s => s + 1) }
  const goBack = () => { setDirection(-1); setStep(s => s - 1) }
  const skip = () => { setDirection(1); setStep(s => Math.min(s + 1, TOTAL)) }

  const toggleInterest = (id: string) => {
    setInterests(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 5) { setToast(true); setTimeout(() => setToast(false), 2200); return prev }
      return [...prev, id]
    })
  }

  const toggleTime = (t: string) =>
    setAvailableTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  // Confetti effect
  useEffect(() => {
    if (!done || !confettiRef.current) return
    const container = confettiRef.current
    const pieces: HTMLDivElement[] = []
    for (let i = 0; i < 16; i++) {
      const el = document.createElement('div')
      el.className = 'ob-confetti-piece'
      el.style.left = `${Math.random() * 100}%`
      el.style.top = `${Math.random() * 30}%`
      el.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      el.style.animationDelay = `${Math.random() * 0.4}s`
      el.style.animationDuration = `${1.2 + Math.random() * 0.8}s`
      container.appendChild(el)
      pieces.push(el)
    }
    const cleanup = setTimeout(() => pieces.forEach(p => p.remove()), 2500)
    return () => clearTimeout(cleanup)
  }, [done])

  const handleFinish = async () => {
    setSaving(true)
    try {
      await fetch('/api/client-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source, interests, city, radius,
          includeOnline, availableTimes,
          phone, smsReminders,
          onboarding_completed: true,
        }),
      })
    } catch (e) { logger.error(e) }
    setSaving(false)
    setDone(true)
  }

  // ── Step renderers ──────────────────────
  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {SOURCES.map(s => (
        <div
          key={s.id}
          className={`ob-option${source === s.id ? ' selected' : ''}`}
          onClick={() => setSource(prev => prev === s.id ? '' : s.id)}
        >
          <span className="ob-option-icon">{s.icon}</span>
          <span className="ob-option-label">{s.label}</span>
          <span className="ob-radio">
            {source === s.id && <Check size={10} strokeWidth={3} color="white" />}
          </span>
        </div>
      ))}
    </div>
  )

  const renderStep2 = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem', minHeight: 26 }}>
        <AnimatePresence>
          {interests.length > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: 'white', borderRadius: 9999,
                fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.7rem',
              }}
            >
              {interests.length}/5
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="ob-services-grid">
        {SERVICES.map(svc => {
          const sel = interests.includes(svc.id)
          const disabled = !sel && interests.length >= 5
          return (
            <div
              key={svc.id}
              className={`ob-service${sel ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
              onClick={() => !disabled && toggleInterest(svc.id)}
            >
              {sel && (
                <span className="ob-service-check">
                  <Check size={10} strokeWidth={3} color="white" />
                </span>
              )}
              <span className="ob-service-icon">{svc.icon}</span>
              <span className="ob-service-label">{svc.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="ob-input-wrap">
        <span className="ob-input-icon"><MapPin size={16} /></span>
        <input
          className="ob-input"
          placeholder="Paris, Lyon, Marseille..."
          value={city}
          onChange={e => setCity(e.target.value)}
        />
      </div>

      <div>
        <div className="ob-label" style={{ marginBottom: '0.6rem' }}>Dans quel rayon ?</div>
        <div className="ob-pills">
          {RADII.map(r => (
            <div
              key={r}
              className={`ob-pill${radius === r ? ' active' : ''}`}
              onClick={() => setRadius(r)}
            >
              {r} km
            </div>
          ))}
        </div>
      </div>

      <div className="ob-toggle-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Globe size={16} color="var(--accent)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Inclure les pros en ligne</span>
        </div>
        <Toggle value={includeOnline} onChange={setIncludeOnline} />
      </div>

      <div>
        <div className="ob-label" style={{ marginBottom: '0.6rem' }}>Vous etes dispo plutot quand ?</div>
        <div className="ob-time-cards">
          {([
            { id: 'morning',   label: 'Matin',      icon: <Sunrise size={18} /> },
            { id: 'afternoon', label: 'Apres-midi', icon: <Sun size={18} /> },
            { id: 'evening',   label: 'Soir',        icon: <Moon size={18} /> },
          ] as const).map(t => (
            <div
              key={t.id}
              className={`ob-time-card${availableTimes.includes(t.id) ? ' selected' : ''}`}
              onClick={() => toggleTime(t.id)}
            >
              {t.icon}
              <span className="ob-time-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div>
      <div className="ob-avatar-zone">
        <div className="ob-avatar-circle" onClick={() => fileRef.current?.click()}>
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar" />
            : <Camera size={22} color="#94a3b8" />
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
          {avatarPreview ? 'Changer la photo' : 'Ajouter une photo'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div className="ob-label" style={{ marginBottom: '0.5rem' }}>
            Telephone (optionnel)
          </div>
          <div className="ob-phone-row">
            <div className="ob-phone-prefix">
              <Phone size={14} />
              <span>+33</span>
            </div>
            <input
              className="ob-input-plain"
              placeholder="6 12 34 56 78"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              type="tel"
            />
          </div>
        </div>

        <div className="ob-toggle-row">
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
              Recevoir des rappels 24h avant mes RDV
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 2 }}>
              Gratuit, vous pouvez desactiver a tout moment
            </div>
          </div>
          <Toggle value={smsReminders} onChange={setSmsReminders} />
        </div>
      </div>
    </div>
  )

  // ── Success screen ──────────────────────
  if (done) {
    return (
      <>
        <style>{CSS}</style>
        <div className="ob-root" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="ob-card" style={{ maxWidth: 480 }}>
            <div className="ob-success" ref={confettiRef}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', boxShadow: '0 8px 24px rgba(124,58,237,0.28)',
                }}
              >
                <CheckCircle size={40} color="white" strokeWidth={2} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em',
                  color: 'var(--text)', marginTop: '1.5rem',
                }}
              >
                {"C'est parti !"}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}
              >
                Votre compte est configure. Trouvez un professionnel et reservez en quelques secondes.
              </motion.p>

              {city && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    borderRadius: 9999, padding: '0.35rem 1rem',
                    fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem',
                  }}
                >
                  <MapPin size={13} /> Pros disponibles a {city}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                style={{ marginTop: '2rem' }}
              >
                <button className="ob-btn-primary" onClick={() => router.push('/marketplace')}>
                  Explorer la Marketplace <ArrowRight size={18} />
                </button>
                <button className="ob-btn-ghost" onClick={() => router.push('/client/profile')}>
                  Completer mon profil plus tard
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Step titles ─────────────────────────
  const stepMeta = [
    { badge: `Etape 1 sur ${TOTAL}`, title: `Bonjour ${user?.firstName || 'vous'} \u{1F44B}`, sub: 'Comment vous avez entendu parler de nous ? (optionnel)' },
    { badge: `Etape 2 sur ${TOTAL}`, title: 'Quels services vous interessent ?', sub: 'Choisissez ce qui vous parle. Max 5 categories.' },
    { badge: `Etape 3 sur ${TOTAL}`, title: 'Ou cherchez-vous ?', sub: 'Pour voir ce qui est disponible pres de chez vous.' },
    { badge: `Etape 4 sur ${TOTAL}`, title: 'Presque termine !', sub: 'Ces infos sont optionnelles \u2014 vous pouvez les ajouter plus tard.' },
  ]
  const meta = stepMeta[step - 1]

  return (
    <>
      <style>{CSS}</style>
      <div className="ob-root">
        {/* Header */}
        <header className="ob-header">
          <span style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.03em', color: '#0f172a' }}>
            Calenda
            <span style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Pro
            </span>
          </span>

          {/* Steps indicator */}
          <div className="steps-desktop" style={{ display: 'flex', alignItems: 'center' }}>
            {Array.from({ length: TOTAL }, (_, i) => (
              <StepCircle key={i + 1} num={i + 1} current={step} total={TOTAL} />
            ))}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
            {user?.firstName ?? ''}
          </div>
        </header>

        {/* Progress bar */}
        <div className="ob-progress">
          <div className="ob-progress-fill" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>

        {/* Card */}
        <div className="ob-center">
          <div className="ob-card">
            {/* Card header */}
            <div className="ob-card-head">
              <span className="ob-badge">{meta.badge}</span>
              <h1 className="ob-title">{meta.title}</h1>
              <p className="ob-subtitle">{meta.sub}</p>
            </div>

            {/* Card body — animated */}
            <div className="ob-card-body">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                  {step === 4 && renderStep4()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="ob-card-foot">
              {step > 1
                ? <button className="ob-btn-back" onClick={goBack}><ArrowLeft size={15} /> Retour</button>
                : <div />
              }

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(step === 1 || step === 4) && (
                  <button className="ob-btn-skip" onClick={skip}>Passer</button>
                )}
                <button
                  className={`ob-btn-next ${canNext() ? 'ready' : 'not-ready'}`}
                  onClick={step === TOTAL ? handleFinish : goNext}
                  disabled={!canNext() || saving}
                >
                  {saving ? 'Enregistrement...' : step === TOTAL ? 'Commencer' : 'Suivant'}
                  {!saving && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Max-selection toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="ob-toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            Maximum atteint — deselectionnez pour changer
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
