import { NextResponse } from 'next/server'
import { createBookingAndNotify } from '@/lib/booking-pipeline'

export async function POST(request: Request) {
  const payload = await request.json()
  const { username, clientName, date } = payload

  if (!username || !clientName || !date) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  try {
    const { appointment } = await createBookingAndNotify(payload)
    return NextResponse.json({ success: true, appointment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur booking'
    const status = message === 'Professionnel introuvable' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}