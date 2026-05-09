'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePlan } from '@/lib/hooks/usePlan'
import FeatureGate from '@/components/dashboard/FeatureGate'
import type { WeekSchedule, ScheduleException } from '@/app/onboarding/_components/ScheduleEditor'
import type { LocationData } from '@/app/onboarding/_components/LocationEditor'
import type { CtaConfig } from '@/app/onboarding/_components/CtaEditor'
import { logger } from '@/lib/logger'

const ScheduleEditor = dynamic(() => import('@/app/onboarding/_components/ScheduleEditor'), { ssr: false })
const LocationEditor = dynamic(() => import('@/app/onboarding/_components/LocationEditor'), { ssr: false })
const CtaEditor = dynamic(() => import('@/app/onboarding/_components/CtaEditor'), { ssr: false })

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS (SVG)
// ═══════════════════════════════════════════════════════════════════════════════

const IconPalette = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.062a1.63 1.63 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.01 17.461 2 12 2z"/>
  </svg>
)

const IconUser = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconZap = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const IconClock = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const IconImage = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
)

const IconStar = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const IconLayout = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
)

const IconFileText = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)

const IconMegaphone = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
)

const IconGlobe = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const IconSearch = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconPlus = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconPencil = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)

const IconTrash = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const IconCalendar = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconDiamond = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
  </svg>
)

const IconScissors = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>
  </svg>
)

const IconLeaf = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

const IconCircle = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
  </svg>
)

const IconHexagon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
)

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type SiteSettings = {
  username: string
  full_name: string
  bio: string
  city: string
  category: string
  phone: string
  email_contact: string
  // Design
  accent_color: string
  design_vibe: string
  font_pair: string
  btn_style: string
  theme_name: string
  font_family: string
  hero_image_url: string
  logo_url: string
  // Sections
  sections_visible: Record<string, boolean>
  section_order: string[]
  // Social
  social_links: Record<string, string>
  // Schedule
  schedule: Record<string, unknown>
  schedule_exceptions: unknown[]
  show_schedule: boolean
  // Location
  location_address: string
  location_lat: number | null
  location_lng: number | null
  // Gallery
  gallery_images: string[]
  show_gallery: boolean
  // CTA
  cta_button_text: string
  cta_button_style: string
  cta_button_action: string
  cta_custom_url: string
  // Reviews
  show_reviews: boolean
  // Appearance
  dark_mode: boolean
  font_size: string
  color_palette: string
}

type Service = { 
  id: string
  name: string
  duration: string
  price: number
  description?: string
  created_at?: string
}

type Review = { 
  id: string
  rating: number
  comment: string
  created_at: string
  client_name?: string
}

type TabId = 
  | 'design' 
  | 'identity' 
  | 'services' 
  | 'schedule' 
  | 'gallery' 
  | 'reviews'
  | 'sections'
  | 'bio'
  | 'cta'
  | 'social'
  | 'seo'

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS: SiteSettings = {
  username: '', full_name: '', bio: '', city: '', category: '',
  phone: '', email_contact: '',
  accent_color: '#7c3aed', design_vibe: 'minimal', font_pair: 'clash-dm',
  btn_style: 'gradient', theme_name: 'minimalist', font_family: 'Inter',
  hero_image_url: '', logo_url: '',
  sections_visible: { about: true, services: true, reviews: true, schedule: true, gallery: false, cta: true },
  section_order: ['about', 'services', 'reviews', 'schedule', 'gallery', 'cta'],
  social_links: {},
  schedule: {},
  schedule_exceptions: [],
  show_schedule: true,
  location_address: '', location_lat: null, location_lng: null,
  gallery_images: [], show_gallery: false,
  cta_button_text: 'Reserver maintenant', cta_button_style: 'gradient',
  cta_button_action: 'modal', cta_custom_url: '',
  show_reviews: true,
  dark_mode: false, font_size: 'normal', color_palette: 'purple',
}

const ACCENT_COLORS = [
  '#7c3aed','#6366f1','#3b82f6','#0ea5e9','#10b981','#f59e0b',
  '#f97316','#ef4444','#ec4899','#8b5cf6','#06b6d4','#84cc16',
]

const FONTS = ['Inter', 'DM Sans', 'Playfair Display', 'Outfit', 'Space Grotesk', 'Raleway']

const FONT_PAIRS = [
  { id: 'clash-dm', label: 'Clash + DM Sans' },
  { id: 'playfair-inter', label: 'Playfair + Inter' },
  { id: 'outfit-outfit', label: 'Outfit' },
  { id: 'space-grotesk', label: 'Space Grotesk' },
  { id: 'raleway-lato', label: 'Raleway + Lato' },
]

const VIBES = [
  { id: 'minimal', label: 'Minimaliste Zen', Icon: IconCircle },
  { id: 'barber', label: 'Barbier Vintage', Icon: IconScissors },
  { id: 'modern', label: 'Modern Studio', Icon: IconHexagon },
  { id: 'organic', label: 'Organic Nature', Icon: IconLeaf },
  { id: 'luxury', label: 'Luxe Premium', Icon: IconDiamond },
]

const SECTIONS_CONFIG = [
  { key: 'about', label: 'A propos / Bio', Icon: IconUser },
  { key: 'services', label: 'Services', Icon: IconZap },
  { key: 'reviews', label: 'Avis clients', Icon: IconStar },
  { key: 'schedule', label: 'Horaires', Icon: IconClock },
  { key: 'gallery', label: 'Galerie photos', Icon: IconImage },
  { key: 'cta', label: 'Bouton RDV', Icon: IconCalendar },
]

const TABS: { id: TabId; label: string; Icon: React.FC<{className?: string}>; premium?: boolean; infinity?: boolean }[] = [
  { id: 'design', label: 'Themes', Icon: IconPalette },
  { id: 'identity', label: 'Identite', Icon: IconUser },
  { id: 'services', label: 'Services', Icon: IconZap },
  { id: 'schedule', label: 'Horaires', Icon: IconClock },
  { id: 'gallery', label: 'Galerie', Icon: IconImage },
  { id: 'reviews', label: 'Avis', Icon: IconStar },
  { id: 'sections', label: 'Sections', Icon: IconLayout },
  { id: 'bio', label: 'Bio', Icon: IconFileText },
  { id: 'cta', label: 'CTA', Icon: IconMegaphone },
  { id: 'social', label: 'Social', Icon: IconGlobe },
  { id: 'seo', label: 'SEO', Icon: IconSearch, premium: true },
]

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--dl-card-bg)] border border-[var(--dl-card-border)] rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.65rem] font-extrabold tracking-wider uppercase text-[var(--dl-text-muted)] mb-2 font-['DM_Sans',sans-serif]">
      {children}
    </p>
  )
}

function Input({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  min,
  max,
  step
}: { 
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-[var(--dl-card-border)] bg-[var(--dl-sidebar-bg)] text-[var(--dl-text-primary)] text-sm font-['DM_Sans',sans-serif] outline-none focus:border-[#7c3aed] transition-colors"
    />
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#7c3aed]' : 'bg-[var(--dl-card-border)]'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[var(--dl-card-border)] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[var(--dl-text-primary)] font-['DM_Sans',sans-serif]">{label}</p>
        {desc && <p className="text-xs text-[var(--dl-text-muted)] mt-0.5 font-['DM_Sans',sans-serif]">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function Button({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'md',
  title
}: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  title?: string
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white border-transparent',
    secondary: 'bg-[var(--dl-card-bg)] text-[var(--dl-text-primary)] border-[var(--dl-card-border)]',
    danger: 'bg-red-500 text-white border-transparent',
    ghost: 'bg-transparent text-[var(--dl-text-muted)] border-transparent hover:text-[var(--dl-text-primary)]'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES MANAGER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ServicesManager({ 
  services, 
  setServices,
  sectionsVisible,
  setSectionsVisible 
}: { 
  services: Service[]
  setServices: (s: Service[]) => void
  sectionsVisible: Record<string, boolean>
  setSectionsVisible: (v: Record<string, boolean>) => void
}) {
  const [editing, setEditing] = useState<Service | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emptyService: Service = {
    id: '',
    name: '',
    duration: '30 min',
    price: 0,
    description: ''
  }

  const handleSave = async (service: Service) => {
    setLoading(true)
    setError(null)
    try {
      const isUpdate = !!service.id
      const res = await fetch('/api/services', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        setError(errData.error || `Erreur ${res.status}`)
        return
      }
      
      const data = await res.json()
      
      if (isUpdate) {
        setServices(services.map(s => s.id === data.id ? data : s))
      } else {
        setServices([data, ...services])
      }
      
      setEditing(null)
      setIsAdding(false)
    } catch (e) {
      logger.error('Failed to save service:', e)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setServices(services.filter(s => s.id !== id))
      }
    } catch (e) {
      logger.error('Failed to delete service:', e)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <ToggleRow
        label="Afficher la section Services"
        checked={sectionsVisible.services ?? true}
        onChange={v => setSectionsVisible({ ...sectionsVisible, services: v })}
      />

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--dl-text-muted)]">
          {services.length} service{services.length > 1 ? 's' : ''}
        </p>
        <Button onClick={() => { setError(null); setIsAdding(true); }} size="sm">
          <IconPlus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editing) && (
        <Card className="p-4 border-[#7c3aed]/30">
          <ServiceForm 
            service={editing || emptyService}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setIsAdding(false) }}
            loading={loading}
          />
        </Card>
      )}

      {/* Services List */}
      <div className="space-y-2">
        {services.map(service => (
          <Card key={service.id} className="p-3 flex items-center gap-3 group hover:border-[#7c3aed]/50 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--dl-text-primary)] text-sm truncate">
                {service.name}
              </p>
              <p className="text-xs text-[var(--dl-text-muted)]">
                {service.duration} — {service.price}€
                {service.description && <span className="ml-2 opacity-60">{service.description.slice(0, 50)}...</span>}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => setEditing(service)} title="Modifier">
                <IconPencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)} title="Supprimer">
                <IconTrash className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
        {services.length === 0 && (
          <div className="text-center py-8 text-[var(--dl-text-muted)] text-sm">
            Aucun service encore. Cliquez sur "Ajouter" pour commencer.
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceForm({ 
  service, 
  onSave, 
  onCancel,
  loading 
}: { 
  service: Service
  onSave: (s: Service) => void
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState(service)

  return (
    <div className="space-y-3">
      <div>
        <Label>Nom du service</Label>
        <Input 
          value={form.name} 
          onChange={v => setForm({ ...form, name: v })} 
          placeholder="Ex: Coupe homme"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Durée</Label>
          <select
            value={form.duration}
            onChange={e => setForm({ ...form, duration: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--dl-card-border)] bg-[var(--dl-sidebar-bg)] text-[var(--dl-text-primary)] text-sm outline-none"
          >
            <option value="15 min">15 min</option>
            <option value="30 min">30 min</option>
            <option value="45 min">45 min</option>
            <option value="1h">1h</option>
            <option value="1h30">1h30</option>
            <option value="2h">2h</option>
            <option value="2h30">2h30</option>
            <option value="3h+">3h+</option>
          </select>
        </div>
        <div>
          <Label>Prix (€)</Label>
          <Input 
            type="number" 
            min={0} 
            step={0.5}
            value={form.price} 
            onChange={v => setForm({ ...form, price: Number(v) })} 
            placeholder="25"
          />
        </div>
      </div>
      <div>
        <Label>Description (optionnel)</Label>
        <textarea
          value={form.description || ''}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Décrivez ce service..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-[var(--dl-card-border)] bg-[var(--dl-sidebar-bg)] text-[var(--dl-text-primary)] text-sm resize-none outline-none"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={loading || !form.name}>
          {loading ? '...' : 'Sauvegarder'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

function ReviewsManager({
  reviews,
  avgRating,
  showReviews,
  setShowReviews
}: {
  reviews: Review[]
  avgRating: number | null
  showReviews: boolean
  setShowReviews: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <ToggleRow
        label="Afficher la section Avis clients"
        desc="Affiche les avis sur votre page publique"
        checked={showReviews}
        onChange={setShowReviews}
      />

      {avgRating !== null && (
        <Card className="p-4 bg-gradient-to-r from-[#7c3aed]/10 to-[#ec4899]/10">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-[#7c3aed]">
              {avgRating.toFixed(1)}
            </div>
            <div>
              <div className="text-yellow-500 text-lg">
 {''.repeat(Math.round(avgRating))}{''.repeat(5 - Math.round(avgRating))}
              </div>
              <p className="text-sm text-[var(--dl-text-muted)]">
                {reviews.length} avis reçus
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {reviews.slice(0, 5).map(review => (
          <Card key={review.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="text-yellow-500 text-sm">
 {''.repeat(review.rating)}{''.repeat(5 - review.rating)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-[var(--dl-text-primary)] line-clamp-2">
                  "{review.comment}"
                </p>
                <p className="text-xs text-[var(--dl-text-muted)] mt-1">
                  {new Date(review.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </Card>
        ))}
        {reviews.length === 0 && (
          <div className="text-center py-8 text-[var(--dl-text-muted)] text-sm">
            Aucun avis pour le moment. Les avis apparaissent automatiquement après les rendez-vous.
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB CONTENT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function DesignTab({ settings, update }: { settings: SiteSettings; update: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  const { has } = usePlan()

  return (
    <div className="space-y-6">
      {/* Vibe */}
      <div>
        <Label>Style visuel</Label>
        <div className="grid grid-cols-2 gap-2">
          {VIBES.map(v => (
            <button
              key={v.id}
              onClick={() => update('design_vibe', v.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.design_vibe === v.id 
                  ? 'border-[#7c3aed] bg-[#7c3aed]/10' 
                  : 'border-[var(--dl-card-border)] hover:border-[#7c3aed]/50'
              }`}
            >
              <v.Icon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <Label>Couleur principale</Label>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => update('accent_color', c)}
              className={`w-8 h-8 rounded-lg transition-all ${
                settings.accent_color === c ? 'ring-2 ring-offset-2 ring-[#7c3aed]' : ''
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Font */}
      <div>
        <Label>Police</Label>
        <select
          value={settings.font_family}
          onChange={e => update('font_family', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--dl-card-border)] bg-[var(--dl-sidebar-bg)] text-sm outline-none"
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Button Style */}
      <div>
        <Label>Style des boutons</Label>
        <div className="flex gap-2">
          {['gradient', 'solid', 'outline', 'glassmorphic'].map(s => (
            <button
              key={s}
              onClick={() => update('btn_style', s)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border capitalize ${
                settings.btn_style === s
                  ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed]'
                  : 'border-[var(--dl-card-border)] text-[var(--dl-text-muted)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Dark Mode */}
      <ToggleRow
        label="Mode sombre"
        desc={has('premium') ? 'Activer le fond sombre' : 'Premium requis'}
        checked={settings.dark_mode}
        onChange={v => has('premium') && update('dark_mode', v)}
      />
    </div>
  )
}

function IdentityTab({ settings, update, plan, has }: { settings: SiteSettings; update: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void; plan: 'free' | 'premium' | 'infinity' | null; has: (p: 'premium' | 'infinity') => boolean }) {

  return (
    <div className="space-y-4">
      <div>
        <Label>Nom affiché</Label>
        <Input 
          value={settings.full_name} 
          onChange={v => update('full_name', v)} 
          placeholder="Votre nom ou marque"
        />
      </div>
      <div>
        <Label>Slogan / Métier</Label>
        <Input 
          value={settings.category} 
          onChange={v => update('category', v)} 
          placeholder="Coiffeur depuis 15 ans"
        />
      </div>
      <div>
        <Label>Ville</Label>
        <Input 
          value={settings.city} 
          onChange={v => update('city', v)} 
          placeholder="Paris"
        />
      </div>
      <div>
        <Label>Logo URL</Label>
        {has('premium') ? (
          <Input 
            value={settings.logo_url} 
            onChange={v => update('logo_url', v)} 
            placeholder="https://..."
          />
        ) : (
          <FeatureGate required="premium" current={plan}>
            <div className="h-10 bg-[var(--dl-card-border)]/30 rounded-lg" />
          </FeatureGate>
        )}
      </div>
      <div>
        <Label>Image hero URL</Label>
        {has('premium') ? (
          <Input 
            value={settings.hero_image_url} 
            onChange={v => update('hero_image_url', v)} 
            placeholder="https://..."
          />
        ) : (
          <FeatureGate required="premium" current={plan}>
            <div className="h-10 bg-[var(--dl-card-border)]/30 rounded-lg" />
          </FeatureGate>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SiteBuilderPage() {
  const { plan, has } = usePlan()
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('design')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [debouncedPreviewUrl, setDebouncedPreviewUrl] = useState('')
  
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load data
  useEffect(() => {
    fetch('/api/pro/site-settings')
      .then(r => r.json())
      .then((d: { 
        profile?: Partial<SiteSettings>
        services?: Service[]
        reviews?: Review[]
        avgRating?: number | null 
      }) => {
        if (d.profile) {
          const safe = Object.fromEntries(
            Object.entries(d.profile).filter(([, v]) => v !== null && v !== undefined)
          ) as Partial<SiteSettings>
          setSettings(prev => ({ ...prev, ...safe }))
        }
        if (d.services) setServices(d.services)
        if (d.reviews) setReviews(d.reviews)
        if (d.avgRating !== undefined) setAvgRating(d.avgRating ?? null)
      })
      .catch(logger.error)
      .finally(() => setLoading(false))
  }, [])

  // Debounced save
  const save = useCallback((patch: Partial<SiteSettings>) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch('/api/pro/site-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        setSaveMsg('Sauvegardé')
        setTimeout(() => setSaveMsg(''), 2000)
      } finally {
        setSaving(false)
      }
    }, 800)
  }, [])

  const update = useCallback(<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      save({ [key]: value })
      return next
    })
  }, [save])

  // Build preview URL
  const buildPreviewUrl = useCallback((s: SiteSettings, svcList: Service[]) => {
    const p = new URLSearchParams({
      name: s.full_name || 'Votre Nom',
      metier: s.category || 'Professionnel',
      city: s.city,
      bio: s.bio,
      theme: s.design_vibe,
      accent: s.accent_color,
      font: s.font_family,
      btn: s.btn_style,
      logo: s.logo_url,
      hero: s.hero_image_url,
      ctaText: s.cta_button_text,
      ctaStyle: s.cta_button_style,
      phone: s.phone,
      address: s.location_address,
      dark: s.dark_mode ? '1' : '0',
      sections: JSON.stringify(s.sections_visible),
      sched: JSON.stringify(s.schedule),
      services: JSON.stringify(svcList.map(sv => ({ 
        name: sv.name, 
        price: sv.price, 
        duration: sv.duration,
        description: sv.description 
      }))),
    })
    return `/api/pro/live-preview?${p.toString()}`
  }, [])

  // Debounce preview URL
  useEffect(() => {
    clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => {
      setDebouncedPreviewUrl(buildPreviewUrl(settings, services))
    }, 500)
  }, [settings, services, buildPreviewUrl])

  // Update sections visibility helper
  const updateSectionsVisible = (v: Record<string, boolean>) => {
    update('sections_visible', v)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-[var(--dl-text-muted)] font-['DM_Sans',sans-serif]">
          Chargement...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden font-['DM_Sans',sans-serif]">
      {/* ═════════════════════════════════════════════════════════════════════════
          LEFT PANEL (40%)
         ═════════════════════════════════════════════════════════════════════════ */}
      <div className="w-[40%] min-w-[360px] max-w-[480px] border-r border-[var(--dl-card-border)] flex flex-col overflow-hidden bg-[var(--dl-sidebar-bg)]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--dl-card-border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-[var(--dl-text-primary)] font-['Clash_Display',DM_Sans,sans-serif] tracking-tight">
                Site Builder
              </h1>
              <p className="text-xs text-[var(--dl-text-muted)]">
                {saving ? 'Sauvegarde...' : saveMsg || 'Modifications auto-sauvegardées'}
              </p>
            </div>
            {settings.username && (
              <Link
                href={`/${settings.username}`}
                target="_blank"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-white hover:opacity-90 transition-opacity"
              >
                Voir le site →
              </Link>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-1 p-2 border-b border-[var(--dl-card-border)] overflow-x-auto flex-shrink-0">
          {TABS.map(tab => {
            const locked = (tab.premium && !has('premium')) || (tab.infinity && !has('infinity'))
            return (
              <button
                key={tab.id}
                onClick={() => !locked && setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${activeTab === tab.id 
                    ? 'bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/30' 
                    : 'text-[var(--dl-text-muted)] hover:text-[var(--dl-text-primary)] hover:bg-[var(--dl-card-bg)]'
                  }
                  ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <tab.Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {locked && (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Card className="p-4">
            {activeTab === 'design' && (
              <DesignTab settings={settings} update={update} />
            )}
            
            {activeTab === 'identity' && (
              <IdentityTab settings={settings} update={update as <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void} plan={plan} has={has} />
            )}
            
            {activeTab === 'services' && (
              <ServicesManager 
                services={services}
                setServices={setServices}
                sectionsVisible={settings.sections_visible}
                setSectionsVisible={updateSectionsVisible}
              />
            )}
            
            {activeTab === 'reviews' && (
              <ReviewsManager
                reviews={reviews}
                avgRating={avgRating}
                showReviews={settings.show_reviews}
                setShowReviews={v => update('show_reviews', v)}
              />
            )}
            
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <ToggleRow
                  label="Afficher les horaires"
                  checked={settings.show_schedule}
                  onChange={v => update('show_schedule', v)}
                />
                <div className="bg-[#0f172a] rounded-xl p-3">
                  <ScheduleEditor
                    value={(settings.schedule ?? {}) as WeekSchedule}
                    onChange={(s: WeekSchedule) => update('schedule', s)}
                    exceptions={(settings.schedule_exceptions ?? []) as ScheduleException[]}
                    onExceptionsChange={(e: ScheduleException[]) => update('schedule_exceptions', e)}
                    accentColor={settings.accent_color}
                  />
                </div>
                <div className="bg-[#0f172a] rounded-xl p-3">
                  <LocationEditor
                    value={{
                      address: settings.location_address ?? '',
                      lat: settings.location_lat,
                      lng: settings.location_lng,
                      phone: settings.phone ?? '',
                      email: settings.email_contact ?? '',
                    }}
                    onChange={(v: LocationData) => {
                      update('location_address', v.address)
                      update('location_lat', v.lat)
                      update('location_lng', v.lng)
                      update('phone', v.phone)
                      update('email_contact', v.email)
                    }}
                    accentColor={settings.accent_color}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'gallery' && (
              <div className="space-y-4">
                <ToggleRow
                  label="Afficher la galerie"
                  checked={settings.show_gallery}
                  onChange={v => update('show_gallery', v)}
                />
                <p className="text-sm text-[var(--dl-text-muted)]">
                  {settings.gallery_images?.length ?? 0} photo(s)
                  {has('infinity') ? ' — illimité' : has('premium') ? ' — max 20' : ' — max 5'}
                </p>
                <Link
                  href="/dashboard/payments-reservations"
                  className="block text-center py-2 rounded-lg border border-dashed border-[var(--dl-card-border)] text-xs text-[var(--dl-text-muted)] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
                >
                  Gerer les photos dans Paiements & Reservations
                </Link>
              </div>
            )}
            
            {activeTab === 'sections' && (
              <div className="space-y-2">
                {SECTIONS_CONFIG.map(sc => (
                  <Card key={sc.key} className="p-3 flex items-center gap-3">
                    <sc.Icon className="w-5 h-5" />
                    <span className="flex-1 text-sm font-medium">{sc.label}</span>
                    <Toggle
                      checked={settings.sections_visible?.[sc.key] ?? true}
                      onChange={v => updateSectionsVisible({ 
                        ...settings.sections_visible, 
                        [sc.key]: v 
                      })}
                    />
                  </Card>
                ))}
              </div>
            )}
            
            {activeTab === 'bio' && (
              <div className="space-y-4">
                <div>
                  <Label>Bio courte (150 car.)</Label>
                  <textarea
                    value={settings.bio}
                    onChange={e => update('bio', e.target.value)}
                    maxLength={150}
                    rows={4}
                    placeholder="Une phrase qui donne envie de réserver..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--dl-card-border)] bg-[var(--dl-sidebar-bg)] text-sm resize-none outline-none"
                  />
                  <p className="text-[10px] text-[var(--dl-text-muted)] text-right mt-1">
                    {settings.bio.length}/150
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'cta' && (
              <div className="bg-[#0f172a] rounded-xl p-3">
                <CtaEditor
                  value={{
                    text: settings.cta_button_text,
                    style: settings.cta_button_style as CtaConfig['style'],
                    action: settings.cta_button_action as CtaConfig['action'],
                    customUrl: settings.cta_custom_url,
                  }}
                  onChange={(v: CtaConfig) => {
                    update('cta_button_text', v.text)
                    update('cta_button_style', v.style)
                    update('cta_button_action', v.action)
                    update('cta_custom_url', v.customUrl)
                  }}
                  accentColor={settings.accent_color}
                />
              </div>
            )}
            
            {activeTab === 'social' && (
              <div className="space-y-3">
                {['instagram', 'tiktok', 'facebook', 'linkedin'].map(net => (
                  <div key={net}>
                    <Label>{net.charAt(0).toUpperCase() + net.slice(1)}</Label>
                    <Input
                      value={(settings.social_links?.[net] as string) ?? ''}
                      onChange={v => update('social_links', { 
                        ...settings.social_links, 
                        [net]: v 
                      })}
                      placeholder={`https://${net}.com/...`}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'seo' && has('premium') ? (
              <div className="space-y-4">
                  <div>
                    <Label>Meta title</Label>
                    <Input 
                      value={settings.full_name} 
                      onChange={v => update('full_name', v)} 
                      placeholder="Votre nom - Métier Ville"
                    />
                  </div>
                  <div>
                    <Label>Meta description</Label>
                    <textarea
                      value={settings.bio}
                      onChange={e => update('bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--dl-card-border)] bg-[var(--dl-sidebar-bg)] text-sm resize-none outline-none"
                    />
                  </div>
                </div>
            ) : (
              <FeatureGate required="premium" current={plan}>
                <div className="h-40" />
              </FeatureGate>
            )}
          </Card>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          RIGHT PANEL (60%) - LIVE PREVIEW
         ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-[var(--dl-main-bg)] overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--dl-card-border)] bg-[var(--dl-sidebar-bg)] flex-shrink-0">
          {/* Device Toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-lg border ${
                previewMode === 'desktop' 
                  ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed]' 
                  : 'border-[var(--dl-card-border)] text-[var(--dl-text-muted)]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-lg border ${
                previewMode === 'mobile' 
                  ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed]' 
                  : 'border-[var(--dl-card-border)] text-[var(--dl-text-muted)]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--dl-main-bg)] border border-[var(--dl-card-border)] min-w-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="text-xs text-[var(--dl-text-muted)] truncate">
              calendapro.fr/{settings.username || '...'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <button
              onClick={() => setDebouncedPreviewUrl(buildPreviewUrl(settings, services))}
              className="p-2 rounded-lg border border-[var(--dl-card-border)] text-[var(--dl-text-muted)] hover:text-[var(--dl-text-primary)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            {settings.username && (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://calendapro.fr/${settings.username}`)}
                  className="p-2 rounded-lg border border-[var(--dl-card-border)] text-[var(--dl-text-muted)] hover:text-[var(--dl-text-primary)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
                <Link
                  href={`/${settings.username}`}
                  target="_blank"
                  className="p-2 rounded-lg border border-[var(--dl-card-border)] text-[var(--dl-text-muted)] hover:text-[var(--dl-text-primary)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Preview Frame */}
        <div className={`flex-1 flex items-start justify-center overflow-auto ${
          previewMode === 'mobile' ? 'bg-gray-300 p-6' : 'p-4'
        }`}>
          <div className={`relative overflow-hidden bg-white shadow-2xl transition-all ${
            previewMode === 'mobile' 
              ? 'w-[390px] h-[844px] rounded-[40px] shadow-[0_0_0_8px_#1f2937,0_20px_60px_rgba(0,0,0,0.3)]' 
              : 'w-full h-full rounded-xl border border-[var(--dl-card-border)]'
          }`}>
            {debouncedPreviewUrl ? (
              <iframe
                key={debouncedPreviewUrl}
                src={debouncedPreviewUrl}
                className="w-full h-full border-0"
                title="Aperçu du site"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-[var(--dl-text-muted)]">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--dl-card-border)] border-t-[#7c3aed] animate-spin mx-auto mb-3" />
                  Chargement...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
