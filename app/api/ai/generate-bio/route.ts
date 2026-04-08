import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserPlan } from '@/lib/subscription'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY manquante dans .env.local')
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant (serveur)' }, { status: 500 })
  }

  const plan = await getUserPlan(userId)
  if (plan !== 'infinity') {
    return NextResponse.json({ error: 'Plan Infinity requis' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const {
    category,
    categoryLabel,
    city,
    fullName,
    serviceName,
    servicePrice,
    goal,
  } = body as {
    category?: string
    categoryLabel?: string
    city?: string
    fullName?: string
    serviceName?: string
    servicePrice?: number | string
    goal?: string
  }

  const metier = (typeof categoryLabel === 'string' && categoryLabel.trim()) ? categoryLabel.trim() : (category ?? '')

  const prompt = `Tu es un copywriter expert conversion pour CalendaPro France.
Génère une bio professionnelle (2-3 phrases MAX) pour :
- Nom : ${fullName ?? ''}
- Métier : ${metier}
- Ville : ${city ?? ''}
- Service principal : ${serviceName ?? ''} à ${servicePrice ?? ''}€
- Objectif : ${goal ?? ''}

Règles strictes : commence par le prénom ou le métier (jamais "Je"), 1 phrase bénéfice client concret, ton chaleureux et professionnel, mini CTA naturel en fin.
Retourne UNIQUEMENT la bio, rien d'autre, pas de guillemets.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      throw new Error('Erreur API Anthropic')
    }

    const data = (await response.json()) as { content?: Array<{ text?: string }> }
    let bio = data.content?.[0]?.text?.trim() ?? ''
    if (!bio) {
      const metier = (typeof categoryLabel === 'string' && categoryLabel.trim()) ? categoryLabel.trim() : (category ?? '')
      bio = `${fullName || metier}, ${metier} à ${city || 'votre ville'}. Réservez votre créneau directement en ligne.`
      return NextResponse.json({ bio, source: 'fallback' })
    }

    return NextResponse.json({ bio, source: 'ai' })
  } catch (e) {
    console.error('generate-bio error:', e)
    const fallback = `${fullName || metier}, ${metier} à ${city || 'votre ville'}. Réservez votre créneau directement en ligne.`
    return NextResponse.json({ bio: fallback, source: 'fallback' })
  }
}
