'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date, options?: { locale?: typeof fr }) =>
    dfStartOfWeek(d, { weekStartsOn: 1, locale: options?.locale ?? fr }),
  getDay,
  locales: { fr },
})

const DnDCalendar = withDragAndDrop(Calendar)

type AptRow = {
  id: string
  title: string
  date: string
  duration: number | null
  status: string
  price?: number | null
  notes?: string | null
}

export type CalEvent = {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  price?: number
}

function serviceEmoji(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('coupe') || t.includes('coiff')) return '✂️'
  if (t.includes('yoga') || t.includes('pilates')) return '🧘'
  if (t.includes('massage')) return '💆'
  if (t.includes('photo')) return '📷'
  if (t.includes('soin') || t.includes('beauté')) return '✨'
  if (t.includes('cours') || t.includes('coach')) return '📚'
  return '📅'
}

function EventLabel({ event }: { event: object }) {
  const e = event as CalEvent
  return (
    <div className="flex items-start gap-1 overflow-hidden leading-tight">
      <span className="shrink-0 text-[11px]" aria-hidden>
        {serviceEmoji(e.title)}
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

export default function CalendarClient() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())
  const [focusInfinity, setFocusInfinity] = useState(false)
  const [sidebarId, setSidebarId] = useState<string | null>(null)
  const [sidebarData, setSidebarData] = useState<Record<string, unknown> | null>(null)
  const [sidebarLoading, setSidebarLoading] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickStart, setQuickStart] = useState<Date | null>(null)
  const [quickTitle, setQuickTitle] = useState('Nouveau RDV')
  const [quickDuration, setQuickDuration] = useState(60)
  const [saving, setSaving] = useState(false)

  const fetchAppointments = useCallback(async () => {
    const res = await fetch('/api/appointments')
    const data = await res.json()
    if (!Array.isArray(data)) {
      setEvents([])
      setLoading(false)
      return
    }
    const mapped: CalEvent[] = (data as AptRow[]).map(apt => {
      const start = new Date(apt.date)
      const dur = apt.duration && apt.duration > 0 ? apt.duration : 60
      return {
        id: apt.id,
        title: apt.title,
        start,
        end: new Date(start.getTime() + dur * 60000),
        status: apt.status,
        price: apt.price ?? undefined,
      }
    })
    setEvents(mapped)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  useEffect(() => {
    if (!sidebarId) {
      setSidebarData(null)
      return
    }
    setSidebarLoading(true)
    fetch(`/api/appointments/${sidebarId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) setSidebarData(d)
        else setSidebarData(null)
      })
      .finally(() => setSidebarLoading(false))
  }, [sidebarId])

  const stats = useMemo(() => {
    const { start, end } = weekBounds(date)
    const inWeek = events.filter(e => e.start >= start && e.start <= end)
    const ca = inWeek.reduce((s, e) => s + (e.price ?? 0), 0)
    const slots = 5 * 10
    const fill = Math.min(100, Math.round((inWeek.length / Math.max(slots, 1)) * 100))
    const noShowEst = Math.max(0, Math.round(inWeek.filter(e => e.status === 'confirmed').length * 0.15))
    return { ca, fill, count: inWeek.length, noShowEst }
  }, [events, date])

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
    const isConfirmed = ev.status === 'confirmed'
    return {
      style: {
        backgroundColor: isConfirmed ? '#7c3aed' : '#f59e0b',
        borderRadius: '8px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        fontWeight: 600,
        padding: '2px 6px',
        cursor: 'grab',
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
      if (!window.confirm('Déplacer ce rendez-vous ? Le client ne reçoit pas de SMS automatique — prévenez-le si besoin.')) {
        await fetchAppointments()
        return
      }
      const dur = (event.end.getTime() - event.start.getTime()) / 60000
      const res = await fetch(`/api/appointments/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: start.toISOString(), duration: Math.round(dur) }),
      })
      if (!res.ok) {
        alert('Impossible de mettre à jour le RDV')
        await fetchAppointments()
        return
      }
      setEvents(prev =>
        prev.map(e =>
          e.id === event.id
            ? { ...e, start, end: new Date(start.getTime() + dur * 60000) }
            : e
        )
      )
    },
    [fetchAppointments]
  )

  const onEventResize = useCallback(
    async (args: { event: object; start: Date | string; end: Date | string }) => {
      const event = args.event as CalEvent
      const start = new Date(args.start)
      const end = new Date(args.end)
      const dur = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000))
      const res = await fetch(`/api/appointments/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: start.toISOString(), duration: dur }),
      })
      if (!res.ok) {
        alert('Impossible de modifier la durée')
        await fetchAppointments()
        return
      }
      setEvents(prev =>
        prev.map(e => (e.id === event.id ? { ...e, start, end } : e))
      )
    },
    [fetchAppointments]
  )

  const handleSelectSlot = useCallback(({ start }: { start: Date; end: Date }) => {
    setQuickStart(start)
    setQuickOpen(true)
  }, [])

  const handleQuickSave = async () => {
    if (!quickStart) return
    setSaving(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle || 'Nouveau RDV',
          date: quickStart.toISOString(),
          duration: quickDuration,
          notes: '',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? 'Erreur')
        return
      }
      setQuickOpen(false)
      await fetchAppointments()
    } finally {
      setSaving(false)
    }
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
          content: '🌐'; position: absolute; top: 4px; right: 6px; font-size: 0.65rem; opacity: 0.45;
        }
        .cal-pro .rbc-addons-dnd .rbc-addons-dnd-resizable { position: relative; }
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
            Mois, semaine, jour et agenda — glissez-déposez les RDV, créez un créneau au clic. La ligne violette indique l&apos;heure actuelle.
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
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">No-shows évités (estim.)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">{stats.noShowEst}</p>
          <p className="text-xs text-stone-400">Basé sur les RDV confirmés</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-pink-50/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">✦</span>
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

      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-violet-600" />
          <span className="text-stone-600">Confirmé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-stone-600">En attente</span>
        </div>
      </div>

      <div className="cal-pro overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="py-24 text-center text-stone-400">Chargement du calendrier…</div>
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
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            eventPropGetter={eventStyleGetter}
            dayPropGetter={dayPropGetter}
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

      {sidebarId && (
        <div
          className="fixed inset-0 z-[80] flex justify-end bg-black/30"
          role="presentation"
          onClick={() => setSidebarId(null)}
        >
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Détail du RDV</h2>
              <button
                type="button"
                className="rounded-full p-2 text-stone-400 hover:bg-stone-100"
                onClick={() => setSidebarId(null)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            {sidebarLoading && <p className="text-sm text-stone-500">Chargement…</p>}
            {!sidebarLoading && sidebarData && (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">Titre</p>
                  <p className="font-semibold text-stone-900">{String(sidebarData.title ?? '')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">Date</p>
                  <p className="text-stone-700">
                    {sidebarData.date
                      ? new Date(String(sidebarData.date)).toLocaleString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">Statut</p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      sidebarData.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {sidebarData.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">Paiement</p>
                  <p className="text-stone-600">
                    {sidebarData.price != null && Number(sidebarData.price) > 0
                      ? `${Number(sidebarData.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
                      : 'Non renseigné / à définir'}
                  </p>
                </div>
                {sidebarData.clients != null &&
                  typeof sidebarData.clients === 'object' &&
                  sidebarData.clients !== null && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-stone-400">Client</p>
                    <p className="font-medium text-stone-900">
                      {(sidebarData.clients as { name?: string }).name ?? '—'}
                    </p>
                    {(sidebarData.clients as { email?: string }).email && (
                      <p className="text-stone-500">{(sidebarData.clients as { email: string }).email}</p>
                    )}
                    {(sidebarData.clients as { phone?: string }).phone && (
                      <p className="text-stone-500">{(sidebarData.clients as { phone: string }).phone}</p>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href={`/dashboard/appointments/${sidebarId}`}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Ouvrir la fiche complète
                  </Link>
                  <p className="text-xs text-stone-400">
                    Rappel manuel : utilisez les notifications SMS depuis la fiche client lorsque ce sera disponible.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {quickOpen && quickStart && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-stone-900">Nouveau rendez-vous</h3>
            <p className="mt-1 text-sm text-stone-500">
              {quickStart.toLocaleString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <label className="mt-4 block text-sm font-medium text-stone-700">
              Titre
              <input
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-stone-700">
              Durée (minutes)
              <input
                type="number"
                min={15}
                step={15}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                value={quickDuration}
                onChange={e => setQuickDuration(Number(e.target.value))}
              />
            </label>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700"
                onClick={() => setQuickOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                onClick={handleQuickSave}
              >
                {saving ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
