'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
} from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import {
  format,
  parse,
  startOfWeek as dfStartOfWeek,
  endOfWeek as dfEndOfWeek,
  getDay,
  addDays,
  setHours,
  setMinutes,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { supabase } from '@/lib/supabase'
import { toUiStatus } from '@/lib/booking-status'
import { logger } from '@/lib/logger'

// Dynamic import to avoid SSR issues
const AppointmentDetails = dynamic(() => import('./AppointmentDetails'), { ssr: false })

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date, options?: { locale?: typeof fr }) =>
    dfStartOfWeek(d, { weekStartsOn: 1, locale: options?.locale ?? fr }),
  getDay,
  locales: { fr },
})

const DnDCalendar = withDragAndDrop(Calendar)

type Booking = {
  id: string
  service_name: string | null
  scheduled_at: string
  duration_minutes: number | null
  status: string
  price: number | null
  notes?: string | null
  client_id?: string | null
}

export type CalEvent = {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  price?: number
  notes?: string | null
  client_id?: string | null
}

function serviceIcon(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('coupe') || t.includes('coiff')) return 'C'
  if (t.includes('yoga') || t.includes('pilates')) return 'Y'
  if (t.includes('massage')) return 'M'
  if (t.includes('photo')) return 'P'
  if (t.includes('soin') || t.includes('beauté')) return 'B'
  if (t.includes('cours') || t.includes('coach')) return 'L'
  return 'R'
}

function EventLabel({ event }: { event: object }) {
  const e = event as CalEvent
  return (
    <div className="flex items-start gap-1 overflow-hidden leading-tight">
      <span className="shrink-0 text-[11px] font-semibold" aria-hidden>
        {serviceIcon(e.title)}
      </span>
      <span className="truncate">{e.title}</span>
    </div>
  )
}

function weekBounds(anchor: Date) {
  const start = dfStartOfWeek(anchor, { weekStartsOn: 1, locale: fr })
  const end = dfEndOfWeek(anchor, { weekStartsOn: 1, locale: fr })
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// Types pour la gestion d'erreur
type SyncError = {
  message: string
  timestamp: number
  recoverable: boolean
}

// Hook for mobile breakpoint detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export default function CalendarClient() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<SyncError | null>(null)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const isMobile = useIsMobile()
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())

  // Set default view to DAY on mobile
  useEffect(() => {
    if (isMobile && view === Views.WEEK) {
      setView(Views.DAY)
    }
  }, [isMobile])
  const [focusInfinity, setFocusInfinity] = useState(false)
  const [sidebarId, setSidebarId] = useState<string | null>(null)
  const [sidebarData, setSidebarData] = useState<{
    id: string
    title: string
    client_name: string
    client_id?: string
    date: string
    duration: number
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
    notes?: string
    price?: number
    cancellation_reason?: string
    client?: { name?: string; phone?: string } | null
  } | null>(null)
  const [sidebarLoading, setSidebarLoading] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickStart, setQuickStart] = useState<Date | null>(null)
  const [quickTitle, setQuickTitle] = useState('Nouveau RDV')
  const [quickDuration, setQuickDuration] = useState(60)
  const [quickClientId, setQuickClientId] = useState<string>('')
  const [quickNotes, setQuickNotes] = useState('')
  const [quickHour, setQuickHour] = useState(9)
  const [quickMinute, setQuickMinute] = useState(0)
  const [saving, setSaving] = useState(false)
  
  // Clients list for select dropdown
  const [clients, setClients] = useState<Array<{ user_id: string; name: string; phone?: string }>>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  
  // Edit mode for existing appointments
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  
  // Track pending operations for optimistic updates
  const pendingOps = useRef<Set<string>>(new Set())
  const [proId, setProId] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Stats enrichies depuis l'API
  const [calStats, setCalStats] = useState<{
    todayCount: number
    weekCount: number
    weekRevenue: number
    noShowRate: number
  } | null>(null)

  const fetchAppointments = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const res = await fetch('/api/calendar', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      })
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erreur réseau' }))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide')
      }
      
      const mapped: CalEvent[] = (data as Booking[]).map(b => {
        const start = new Date(b.scheduled_at)
        const dur = b.duration_minutes && b.duration_minutes > 0 ? b.duration_minutes : 60
        return {
          id: b.id,
          title: b.service_name || 'Rendez-vous',
          start,
          end: new Date(start.getTime() + dur * 60000),
          status: toUiStatus(b.status),
          price: b.price ?? undefined,
        }
      })
      
      setEvents(mapped)
      setSyncError(null) // Clear any previous error
      setIsOnline(true)
    } catch (err) {
      logger.error('[Calendar] Fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement'
      setSyncError({
        message: errorMessage.includes('abort') ? 'Connexion lente - vérifiez votre réseau' : errorMessage,
        timestamp: Date.now(),
        recoverable: true
      })
      // Keep existing events if we have them, otherwise empty
      if (events.length === 0) {
        setEvents([])
      }
    } finally {
      setLoading(false)
    }
  }, [events.length])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Surveillance de la connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncError(null)
      fetchAppointments({ silent: true }) // Refresh en arrière-plan
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSyncError({
        message: 'Mode hors ligne - modifications en attente',
        timestamp: Date.now(),
        recoverable: true
      })
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Vérification initiale
    if (!navigator.onLine) handleOffline()
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [fetchAppointments])

  // Récupérer le proId depuis l'API auth (Clerk) pour le realtime
  // Plus fiable que /api/profile qui depend de la creation du profil Supabase
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d?.userId) setProId(d.userId) })
      .catch(() => {})
  }, [])

  // Realtime Supabase : remplace le polling 30s
  useEffect(() => {
    if (!proId) return
    const channel = supabase
      .channel(`bookings_pro_${proId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `pro_id=eq.${proId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const b = payload.new as Booking
            const dur = b.duration_minutes || 60
            const start = new Date(b.scheduled_at)
            setEvents(prev => {
              if (prev.some(e => e.id === b.id)) return prev
              return [...prev, {
                id: b.id,
                title: b.service_name || 'Rendez-vous',
                start,
                end: new Date(start.getTime() + dur * 60000),
                status: toUiStatus(b.status),
                price: b.price ?? undefined,
              }]
            })
          } else if (payload.eventType === 'UPDATE') {
            const b = payload.new as Booking
            const dur = b.duration_minutes || 60
            const start = new Date(b.scheduled_at)
            setEvents(prev => prev.map(e =>
              e.id === b.id
                ? {
                    ...e,
                    title: b.service_name || e.title,
                    start,
                    end: new Date(start.getTime() + dur * 60000),
                    status: toUiStatus(b.status),
                  }
                : e
            ))
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== (payload.old as { id?: string })?.id))
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [proId])

  useEffect(() => {
    if (!sidebarId) {
      setSidebarData(null)
      return
    }
    setSidebarLoading(true)
    fetch(`/api/calendar/${sidebarId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setSidebarData(d)
          // Pre-fill form for potential editing
          setQuickTitle(d.title || 'RDV')
          setQuickDuration(d.duration || 60)
          setQuickNotes(d.notes || '')
          setQuickClientId(d.client_id || '')
          const dateObj = new Date(d.date)
          setQuickHour(dateObj.getHours())
          setQuickMinute(dateObj.getMinutes())
          setQuickStart(dateObj)
        } else {
          setSidebarData(null)
        }
      })
      .finally(() => setSidebarLoading(false))
  }, [sidebarId])

  // Handle opening edit mode from sidebar
  const handleStartEdit = () => {
    setIsEditMode(true)
    setQuickOpen(true)
    setSidebarId(null)
    fetchClients()
  }

  // Update existing appointment
  const handleUpdateAppointment = async () => {
    if (!sidebarData?.id || !quickStart) return
    setUpdating(true)
    
    const finalDate = new Date(quickStart)
    finalDate.setHours(quickHour, quickMinute, 0, 0)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const res = await fetch(`/api/calendar/${sidebarData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: finalDate.toISOString(),
          duration: quickDuration,
          notes: quickNotes,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      const data = await res.json().catch(() => ({ error: 'Erreur serveur' }))
      if (!res.ok) {
        if (res.status === 409) {
          setConflictError(data.error || 'Ce créneau est déjà occupé.')
          return
        }
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      
      // Update event in list
      setEvents(prev =>
        prev.map(e =>
          e.id === sidebarData.id
            ? {
                ...e,
                title: data.title,
                start: new Date(data.date),
                end: new Date(new Date(data.date).getTime() + (data.duration || 60) * 60000),
                status: data.status,
              }
            : e
        )
      )
      
      setSyncError(null)
      setConflictError(null)
      setQuickOpen(false)
      resetQuickForm()
    } catch (err) {
      logger.error('[Calendar] Update error:', err)
      setSyncError({
        message: err instanceof Error ? err.message : 'Échec de la modification',
        timestamp: Date.now(),
        recoverable: true
      })
    } finally {
      setUpdating(false)
    }
  }

  // Delete appointment
  const handleDeleteAppointment = async () => {
    if (!sidebarData?.id) return
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const res = await fetch(`/api/calendar/${sidebarData.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      // Remove from events
      setEvents(prev => prev.filter(e => e.id !== sidebarData.id))
      setSidebarId(null)
      setSidebarData(null)
      setDeleteConfirmOpen(false)
      setSyncError(null)
    } catch (err) {
      logger.error('[Calendar] Delete error:', err)
      setSyncError({
        message: err instanceof Error ? err.message : 'Échec de la suppression',
        timestamp: Date.now(),
        recoverable: true
      })
    }
  }

  // Chargement des stats enrichies
  useEffect(() => {
    fetch('/api/dashboard/stats', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setCalStats({
          todayCount: d.todayCount,
          weekCount: d.weekCount,
          weekRevenue: d.weekRevenue,
          noShowRate: d.noShowRate || 0,
        })
      })
      .catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const { start, end } = weekBounds(date)
    const inWeek = events.filter(e => e.start >= start && e.start <= end)
    // Utilise les stats API si disponibles, sinon fallback sur le calcul local
    const ca = calStats?.weekRevenue ?? inWeek.reduce((s, e) => s + (e.price ?? 0), 0)
    const slots = 5 * 10
    const fill = Math.min(100, Math.round((inWeek.length / Math.max(slots, 1)) * 100))
    // Calcul du no-show réel depuis les events
    const realNoShows = events.filter(e => e.status === 'no_show' && e.start >= start && e.start <= end).length
    const noShowEst = realNoShows > 0 ? realNoShows : Math.max(0, Math.round(inWeek.filter(e => e.status === 'confirmed').length * 0.15))
    return { ca, fill, count: inWeek.length, noShowEst }
  }, [events, date, calStats])

  const backgroundEvents = useMemo(() => {
    if (!focusInfinity || (view !== 'week' && view !== 'day')) return []
    const { start } = weekBounds(date)
    const out: { id: string; title: string; start: Date; end: Date }[] = []
    ;[0, 2, 4].forEach((d, i) => {
      const day = addDays(start, d)
      const s = setMinutes(setHours(day, 14), 0)
      const e = setMinutes(setHours(day, 14), 30)
      out.push({
        id: `smart-${i}`,
        title: 'Smart slot · Marketplace',
        start: s,
        end: e,
      })
    })
    return out
  }, [focusInfinity, view, date])

  const eventStyleGetter = (event: object) => {
    const ev = event as CalEvent
    // Couleurs par statut : confirmé=violet, en attente=orange, annulé=rouge
    let bgColor: string
    switch (ev.status) {
      case 'confirmed':
        bgColor = '#7c3aed' // violet
        break
      case 'cancelled':
        bgColor = '#ef4444' // rouge
        break
      case 'completed':
        bgColor = '#10b981' // emerald
        break
      default:
        bgColor = '#f59e0b' // orange (pending)
    }
    return {
      style: {
        backgroundColor: bgColor,
        borderRadius: '8px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        fontWeight: 600,
        padding: '2px 6px',
        cursor: ev.status === 'cancelled' ? 'not-allowed' : 'grab',
        opacity: ev.status === 'cancelled' ? 0.7 : 1,
        textDecoration: ev.status === 'cancelled' ? 'line-through' : 'none',
      },
    }
  }

  const dayPropGetter = (d: Date) => {
    const showGlobe = d.getDay() === 3
    return {
      className: showGlobe ? 'cal-day-globe' : undefined,
    }
  }

  const onEventDrop = useCallback(
    async (args: { event: object; start: Date | string; end: Date | string }) => {
      const event = args.event as CalEvent
      const start = new Date(args.start)
      const dur = (event.end.getTime() - event.start.getTime()) / 60000
      
      // Confirmation utilisateur
      if (!window.confirm('Déplacer ce rendez-vous ? Le client ne reçoit pas de SMS automatique : prévenez-le si besoin.')) {
        return // Annulation, pas besoin de rollback car on a pas encore modifié
      }
      
      // Marquer l'opération comme en cours
      pendingOps.current.add(event.id)
      
 // Optimistic update : mise à jour UI immédiate
      const originalEvent = { ...event }
      setEvents(prev =>
        prev.map(e =>
          e.id === event.id
            ? { ...e, start, end: new Date(start.getTime() + dur * 60000) }
            : e
        )
      )
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const res = await fetch(`/api/calendar/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: start.toISOString(), duration: Math.round(dur) }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        
        const dragData = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        if (!res.ok) {
 // ROLLBACK position originale
          setEvents(prev =>
            prev.map(e =>
              e.id === event.id
                ? { ...e, start: originalEvent.start, end: originalEvent.end }
                : e
            )
          )
          if (res.status === 409) {
            setConflictError(dragData.error || 'Ce créneau est déjà occupé.')
            return
          }
          throw new Error(dragData.error || `HTTP ${res.status}`)
        }
        
 // Succès - l'UI est déjà à jour
        setSyncError(null)
        setConflictError(null)
      } catch (err) {
        logger.error('[Calendar] Drag update error:', err)
        
 // ROLLBACK : restaurer la position originale
        setEvents(prev =>
          prev.map(e =>
            e.id === event.id
              ? { ...e, start: originalEvent.start, end: originalEvent.end }
              : e
          )
        )
        
        setSyncError({
          message: err instanceof Error ? err.message : 'Échec du déplacement',
          timestamp: Date.now(),
          recoverable: true
        })
      } finally {
        pendingOps.current.delete(event.id)
      }
    },
    []
  )

  const onEventResize = useCallback(
    async (args: { event: object; start: Date | string; end: Date | string }) => {
      const event = args.event as CalEvent
      const start = new Date(args.start)
      const end = new Date(args.end)
      const dur = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000))
      
      pendingOps.current.add(event.id)
      
 // Optimistic update
      const originalEvent = { ...event }
      setEvents(prev =>
        prev.map(e => (e.id === event.id ? { ...e, start, end } : e))
      )
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const res = await fetch(`/api/calendar/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: start.toISOString(), duration: dur }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Erreur serveur' }))
          throw new Error(errorData.error || `HTTP ${res.status}`)
        }
        
        setSyncError(null)
      } catch (err) {
        logger.error('[Calendar] Resize error:', err)
        
 // ROLLBACK
        setEvents(prev =>
          prev.map(e =>
            e.id === event.id
              ? { ...e, start: originalEvent.start, end: originalEvent.end }
              : e
          )
        )
        
        setSyncError({
          message: err instanceof Error ? err.message : 'Échec du redimensionnement',
          timestamp: Date.now(),
          recoverable: true
        })
      } finally {
        pendingOps.current.delete(event.id)
      }
    },
    []
  )

  // Fetch clients for the select dropdown
  const fetchClients = useCallback(async () => {
    setClientsLoading(true)
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data || [])
      }
    } catch (err) {
      logger.error('[Calendar] Error fetching clients:', err)
    } finally {
      setClientsLoading(false)
    }
  }, [])

  const handleSelectSlot = useCallback(({ start }: { start: Date; end: Date }) => {
 // Validation anti-passé : ignorer silencieusement les clics sur créneaux passés
    const now = new Date()
    if (start < now) {
      return
    }
    
    setQuickStart(start)
    setQuickHour(start.getHours())
    setQuickMinute(start.getMinutes())
    setQuickClientId('')
    setQuickNotes('')
    setIsEditMode(false)
    setSidebarId(null)
    setQuickOpen(true)
    fetchClients()
  }, [fetchClients])

 // Griser les créneaux passés dans le calendrier
  const slotPropGetter = useCallback((date: Date) => {
    const now = new Date()
    const isPast = date < now
    return {
      className: isPast ? 'rbc-day-slot-past' : undefined,
      style: isPast ? { 
        backgroundColor: 'rgba(0,0,0,0.06)',
        cursor: 'not-allowed'
      } : undefined
    }
  }, [])

  // Handle appointment cancellation with reason
  const handleCancelAppointment = useCallback(async (reason: string) => {
    if (!sidebarData?.id) return
    
    setCancelling(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const res = await fetch(`/api/calendar/${sidebarData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancellation_reason: reason 
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      
      // Update event in list with cancelled status
      setEvents(prev =>
        prev.map(e =>
          e.id === sidebarData.id
            ? { ...e, status: 'cancelled' }
            : e
        )
      )
      
      // Update sidebar data
      setSidebarData(prev => prev ? { ...prev, status: 'cancelled', cancellation_reason: reason } : null)
      
      setSyncError(null)
    } catch (err) {
      logger.error('[Calendar] Cancel error:', err)
      setSyncError({
        message: err instanceof Error ? err.message : 'Échec de l\'annulation',
        timestamp: Date.now(),
        recoverable: true
      })
    } finally {
      setCancelling(false)
    }
  }, [sidebarData])

  const handleQuickSave = async () => {
    if (!quickStart) return
    setSaving(true)
    
    // Build precise datetime from date + hour + minute
    const finalDate = new Date(quickStart)
    finalDate.setHours(quickHour, quickMinute, 0, 0)
    
 // Optimistic update : ajouter temporairement le RDV
    const tempId = `temp-${Date.now()}`
    const newEvent: CalEvent = {
      id: tempId,
      title: quickTitle || 'Nouveau RDV',
      start: finalDate,
      end: new Date(finalDate.getTime() + quickDuration * 60000),
      status: 'pending',
    }
    
    setEvents(prev => [...prev, newEvent])
    setQuickOpen(false)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle || 'Nouveau RDV',
          date: finalDate.toISOString(),
          duration: quickDuration,
          notes: quickNotes,
          client_id: quickClientId || undefined,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      const data = await res.json()
      
      if (!res.ok) {
        // Supprimer le RDV temporaire en cas d'erreur
        setEvents(prev => prev.filter(e => e.id !== tempId))
        if (res.status === 409) {
          setConflictError(data.error || 'Ce créneau est déjà occupé.')
          return
        }
        throw new Error(data.error || 'Erreur lors de la création')
      }
      
      // Remplacer le temporaire par le vrai RDV avec l'ID serveur
      setEvents(prev =>
        prev.map(e =>
          e.id === tempId
            ? {
                id: data.id,
                title: data.title,
                start: new Date(data.date),
                end: new Date(new Date(data.date).getTime() + (data.duration || 60) * 60000),
                status: data.status,
                price: data.price,
              }
            : e
        )
      )
      
      setSyncError(null)
      setConflictError(null)
      
      // Réinitialiser le formulaire
      resetQuickForm()
    } catch (err) {
      logger.error('[Calendar] Create error:', err)
      setSyncError({
        message: err instanceof Error ? err.message : 'Échec de la création',
        timestamp: Date.now(),
        recoverable: true
      })
    } finally {
      setSaving(false)
    }
  }
  
  const resetQuickForm = () => {
    setQuickTitle('Nouveau RDV')
    setQuickDuration(60)
    setQuickClientId('')
    setQuickNotes('')
    setQuickHour(9)
    setQuickMinute(0)
    setIsEditMode(false)
  }

  const handleComplete = useCallback(async (validationType: 'completed' | 'no_show') => {
    if (!sidebarId) return
    const localId = sidebarId
    setIsCompleting(true)
    try {
      const res = await fetch(`/api/calendar/${localId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: validationType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || 'Erreur serveur')
      }
      setSidebarId(null)
      setEvents(prev => prev.map(e => e.id === localId ? { ...e, status: validationType } : e))
    } catch (err) {
      setSyncError({
        message: err instanceof Error ? err.message : 'Echec de la validation',
        timestamp: Date.now(),
        recoverable: true,
      })
    } finally {
      setIsCompleting(false)
    }
  }, [sidebarId])
  
  // Fonction pour réessayer après une erreur
  const handleRetrySync = () => {
    setSyncError(null)
    fetchAppointments()
  }

  const widgetHref = `/dashboard/widget`

  const minT = new Date(0, 0, 0, 7, 0, 0)
  const maxT = new Date(0, 0, 0, 21, 0, 0)

  const calendarCss = `
        .cal-pro .rbc-calendar { font-family: 'DM Sans', system-ui, sans-serif; }
        .cal-pro .rbc-toolbar { flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
        .cal-pro .rbc-toolbar button {
          border-radius: 9999px; border: 1px solid #e7e5e4; padding: 0.35rem 0.9rem;
          font-size: 0.8rem; font-weight: 600; color: #44403c; background: white;
        }
        .cal-pro .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; border-color: transparent;
        }
        .cal-pro .rbc-toolbar button:hover { background: #fafaf9; }
        .cal-pro .rbc-toolbar button.rbc-active:hover { filter: brightness(1.05); }
        .cal-pro .rbc-header { padding: 0.5rem 0; font-weight: 600; font-size: 0.75rem; color: #78716c; }
        .cal-pro .rbc-today { background-color: rgba(245, 243, 255, 0.5); }
        .cal-pro .rbc-current-time-indicator {
          background: linear-gradient(90deg, transparent, #7c3aed, #ec4899) !important;
          height: 2px !important;
        }
        .cal-pro .rbc-time-content { border-top: 1px solid #e7e5e4; }
        .cal-pro .rbc-day-slot .rbc-time-slot { border-color: #f5f5f4; }
        .cal-pro .cal-day-globe { position: relative; }
        .cal-pro .cal-day-globe::after {
          content: 'WEB'; position: absolute; top: 4px; right: 6px; font-size: 0.55rem; opacity: 0.45; font-weight: 600; letter-spacing: 0.02em;
        }
        .cal-pro .rbc-addons-dnd .rbc-addons-dnd-resizable { position: relative; }
        .cal-pro .rbc-day-slot-past { 
          background-color: rgba(0,0,0,0.04) !important; 
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(0,0,0,0.02) 8px,
            rgba(0,0,0,0.02) 16px
          ) !important;
        }
        .cal-pro .rbc-background-event {
          background: rgba(124, 58, 237, 0.12) !important;
          border: 1px dashed rgba(124, 58, 237, 0.45) !important;
          border-radius: 8px !important;
          color: #6b21a8 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }
      `

  return (
    <div className="cal-pro w-full max-w-[1600px] mx-auto px-4 pb-10">
      <style dangerouslySetInnerHTML={{ __html: calendarCss }} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-stone-400 font-medium mb-1">Planning</p>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Calendrier</h1>
          <p className="text-sm text-stone-500 mt-1 max-w-xl">
            Mois, semaine, jour et agenda : glissez-déposez les RDV, créez un créneau au clic. La ligne violette indique l&apos;heure actuelle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={widgetHref}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
          >
            Voir le widget
          </Link>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">CA prévu (semaine)</p>
          <p className="mt-1 text-2xl font-bold text-stone-900 tabular-nums">
            {stats.ca.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">Taux de remplissage</p>
          <p className="mt-1 text-2xl font-bold text-violet-600 tabular-nums">{stats.fill}%</p>
          <p className="text-xs text-stone-400">≈ {stats.count} RDV / semaine (estim.)</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">No-shows constatés</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">{stats.noShowEst}</p>
          <p className="text-xs text-stone-400">{calStats ? 'Données réelles de la semaine' : 'Basé sur les RDV confirmés'}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-pink-50/50 px-4 py-3">
        <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
          <div>
            <p className="text-sm font-semibold text-stone-800">Focus Infinity · Smart slots</p>
            <p className="text-xs text-stone-500">Met en évidence des créneaux conseillés pour la marketplace (démo).</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={focusInfinity}
          onClick={() => setFocusInfinity(v => !v)}
          className={`relative h-8 w-14 rounded-full transition-colors ${focusInfinity ? 'bg-violet-600' : 'bg-stone-300'}`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${focusInfinity ? 'left-7' : 'left-1'}`}
          />
        </button>
      </div>

      {/* Bandeau de conflit de créneau */}
      {conflictError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeWidth="2" d="M8 8l8 8M16 8l-8 8"/></svg>
            <div>
              <p className="text-sm font-semibold text-orange-900">Créneau déjà occupé</p>
              <p className="text-xs text-orange-700">{conflictError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConflictError(null)}
            className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800 hover:bg-orange-200"
          >
            OK
          </button>
        </div>
      )}

      {/* Bandeau d'erreur de synchronisation */}
      {syncError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Erreur de synchronisation</p>
              <p className="text-xs text-red-600">{syncError.message}</p>
            </div>
          </div>
          {syncError.recoverable && (
            <button
              type="button"
              onClick={handleRetrySync}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
            >
              Réessayer
            </button>
          )}
        </div>
      )}

      {/* Indicateur hors ligne */}
      {!isOnline && !syncError && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          <p className="text-sm font-semibold text-amber-800">Mode hors ligne</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-violet-600" />
          <span className="text-stone-600">Confirmé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-stone-600">En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-stone-600">Annulé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-stone-600">Terminé</span>
        </div>
      </div>

      <div className="cal-pro overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-violet-600"></div>
            <p className="text-stone-500">Chargement du calendrier…</p>
          </div>
        ) : (
          <DnDCalendar
            localizer={localizer}
            culture="fr"
            events={events}
            backgroundEvents={backgroundEvents}
            startAccessor={(e: object) => (e as CalEvent).start}
            endAccessor={(e: object) => (e as CalEvent).end}
            style={{ minHeight: 720 }}
            view={view}
            onView={v => setView(v)}
            date={date}
            onNavigate={d => setDate(d)}
            views={isMobile ? [Views.DAY, Views.AGENDA] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
            slotPropGetter={slotPropGetter}
            messages={{
              next: 'Suivant',
              previous: 'Précédent',
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Heure',
              event: 'Événement',
              noEventsInRange: 'Aucun rendez-vous sur cette période',
              showMore: (n: number) => `+${n} de plus`,
            }}
            formats={{
              dayHeaderFormat: (d, c, loc) => loc!.format(d, 'EEEE d MMMM', c),
              dayRangeHeaderFormat: ({ start, end }, c, loc) =>
                `${loc!.format(start, 'd MMM', c)} – ${loc!.format(end, 'd MMM yyyy', c)}`,
              agendaDateFormat: 'EEE d MMM',
              agendaTimeFormat: 'HH:mm',
              agendaTimeRangeFormat: ({ start, end }, c, loc) =>
                `${loc!.format(start, 'HH:mm', c)} – ${loc!.format(end, 'HH:mm', c)}`,
            }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={e => setSidebarId((e as CalEvent).id)}
            components={{
              event: EventLabel,
            }}
            scrollToTime={new Date()}
            step={15}
            timeslots={4}
            min={minT}
            max={maxT}
            showMultiDayTimes
            resizable
            draggableAccessor={() => true}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
          />
        )}
      </div>

      {/* Appointment Details Slide-over */}
      {sidebarId && sidebarData && (
        <AppointmentDetails
          appointment={sidebarData}
          onClose={() => setSidebarId(null)}
          onEdit={handleStartEdit}
          onCancel={handleCancelAppointment}
          onDelete={handleDeleteAppointment}
          onComplete={handleComplete}
          isCancelling={cancelling}
          isDeleting={false}
          isCompleting={isCompleting}
        />
      )}

      {/* Mobile Fixed Bottom Button */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-stone-200 z-40 safe-area-pb">
          <button
            onClick={() => {
              const now = new Date()
              setQuickStart(now)
              setQuickHour(now.getHours())
              setQuickMinute(Math.ceil(now.getMinutes() / 15) * 15)
              setQuickOpen(true)
            }}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-semibold text-base touch-target flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau RDV
          </button>
        </div>
      )}

      {/* Appointment Manager Modal - Create/Edit */}
      {quickOpen && quickStart && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-stone-900">
                {isEditMode ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                {quickStart.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>

            <div className="space-y-5">
              {/* Service/Title */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Service / Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  placeholder="Ex: Coupe + brushing"
                />
              </div>

              {/* Client Select */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Client
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm appearance-none bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                    value={quickClientId}
                    onChange={e => setQuickClientId(e.target.value)}
                    disabled={clientsLoading}
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map(client => (
                      <option key={client.user_id} value={client.user_id}>
                        {client.name} {client.phone ? `(${client.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">▼</span>
                </div>
                {clientsLoading && (
                  <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-stone-300 border-t-violet-600"></span>
                    Chargement des clients…
                  </p>
                )}
              </div>

              {/* Time Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Heure <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm bg-white focus:border-violet-500 outline-none"
                      value={quickHour}
                      onChange={e => setQuickHour(Number(e.target.value))}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}h</option>
                      ))}
                    </select>
                    <span className="text-stone-400 font-medium">:</span>
                    <select
                      className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm bg-white focus:border-violet-500 outline-none"
                      value={quickMinute}
                      onChange={e => setQuickMinute(Number(e.target.value))}
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Durée <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm bg-white focus:border-violet-500 outline-none"
                    value={quickDuration}
                    onChange={e => setQuickDuration(Number(e.target.value))}
                  >
                    {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180].map(d => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Notes (optionnel)
                </label>
                <textarea
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm min-h-[80px] resize-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                  value={quickNotes}
                  onChange={e => setQuickNotes(e.target.value)}
                  placeholder="Notes particulières sur le rendez-vous…"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-stone-200 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                onClick={() => {
                  setQuickOpen(false)
                  if (isEditMode) resetQuickForm()
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving || updating || !quickTitle.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                onClick={isEditMode ? handleUpdateAppointment : handleQuickSave}
              >
                {saving || updating ? (isEditMode ? 'Mise à jour…' : 'Création…') : (isEditMode ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
