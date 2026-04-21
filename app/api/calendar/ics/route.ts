import { NextResponse } from 'next/server'

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toIcsDate(iso: string): string {
  // "2024-04-20T14:30:00" → "20240420T143000Z" (treat as UTC)
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z?$/, '').replace('T', 'T') + (iso.endsWith('Z') ? '' : 'Z')
}

function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@calendapro.fr`
}

/**
 * GET /api/calendar/ics
 * Query params:
 *   title        — event title (required)
 *   start        — ISO datetime (required), e.g. 2024-04-20T14:00:00
 *   duration     — duration in minutes (default: 60)
 *   pro_name     — pro full name (optional)
 *   location     — location string (optional)
 *   description  — extra notes (optional)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const title       = searchParams.get('title')
  const start       = searchParams.get('start')
  const duration    = parseInt(searchParams.get('duration') ?? '60', 10)
  const proName     = searchParams.get('pro_name') ?? ''
  const location    = searchParams.get('location') ?? ''
  const description = searchParams.get('description') ?? ''

  if (!title || !start) {
    return NextResponse.json({ error: 'title et start requis' }, { status: 400 })
  }

  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(start)) {
    return NextResponse.json({ error: 'start doit être au format ISO (YYYY-MM-DDTHH:mm)' }, { status: 400 })
  }

  const startIso = start.includes('Z') ? start : `${start}:00Z`
  const endIso   = addMinutes(startIso, Number.isFinite(duration) && duration > 0 ? duration : 60)

  const dtStart = toIcsDate(startIso)
  const dtEnd   = toIcsDate(endIso)
  const now     = toIcsDate(new Date().toISOString())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalendaPro//CalendaPro//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid()}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(title)}`,
    ...(proName     ? [`ORGANIZER;CN=${escapeIcs(proName)}:mailto:noreply@calendapro.fr`] : []),
    ...(location    ? [`LOCATION:${escapeIcs(location)}`] : []),
    ...(description ? [`DESCRIPTION:${escapeIcs(description)}`] : []),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const icsContent = lines.join('\r\n')

  const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
  const filename  = `rdv-${safeTitle}.ics`

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  })
}
