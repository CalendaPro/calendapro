import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const {
    profession,
    city,
    years_experience,
    strengths,
    style = 'professionnel',
    fullName,
  } = body as {
    profession?: string
    city?: string
    years_experience?: number | string
    strengths?: string[]
    style?: string
    fullName?: string
  }

  const strengthsStr = Array.isArray(strengths) ? strengths.join(', ') : (strengths ?? '')
  const expStr = years_experience ? `${years_experience} ans d'expérience` : ''

  const prompt = `Tu es un copywriter d'élite spécialisé en personal branding pour des indépendants en France.

Génère une bio professionnelle pour un ${profession ?? 'professionnel'} ${city ? `à ${city}` : ''}.
${expStr ? `Expérience : ${expStr}.` : ''}
${strengthsStr ? `Points forts : ${strengthsStr}.` : ''}
Style souhaité : ${style}.
${fullName ? `Nom : ${fullName}.` : ''}

CONTRAINTES ABSOLUES :
- Maximum 150 caractères
- Première personne
- Commence par le métier ou le prénom — JAMAIS "Je suis"
- Un CTA naturel en fin (ex: "Réservez en ligne")
- Zéro cliché ("passion", "accompagner", "au quotidien")
- Unique, impossible à copier par un concurrent

RETOURNE UNIQUEMENT LA BIO, RIEN D'AUTRE.`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = (await resp.json()) as { content?: Array<{ text?: string }> }
    const bio = data.content?.[0]?.text?.trim().slice(0, 150) ?? ''

    if (!bio) {
      const fallback = `${fullName ?? profession ?? 'Professionnel'} ${city ? `à ${city}` : ''}. Réservez votre créneau directement en ligne.`
      return NextResponse.json({ bio: fallback.slice(0, 150) })
    }

    return NextResponse.json({ bio })
  } catch {
    const fallback = `${fullName ?? profession ?? 'Professionnel'} ${city ? `à ${city}` : ''}. Réservez directement en ligne.`
    return NextResponse.json({ bio: fallback.slice(0, 150) })
  }
}
