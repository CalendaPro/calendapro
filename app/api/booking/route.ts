import { NextResponse } from 'next/server'
import { createBookingAndNotify } from '@/lib/booking-pipeline'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { username, clientName, clientEmail, date, source_channel } = payload

    if (!username || !clientName || !date) {
      return NextResponse.json({ error: 'Champs requis manquants (nom, date, professionnel)' }, { status: 400 })
    }

    if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: 'Adresse email invalide ou manquante' }, { status: 400 })
    }

    const { appointment } = await createBookingAndNotify({ ...payload, source_channel })
    return NextResponse.json({ success: true, appointment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur booking'
    const isPaiementRequired = message.includes('Paiement requis')
    const isNotFound = message === 'Professionnel introuvable'
    const status = isNotFound ? 404 : isPaiementRequired ? 402 : 500
    return NextResponse.json({ error: message }, { status })
  }
}