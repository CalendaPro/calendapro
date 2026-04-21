import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY manquante dans .env.local')
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant (serveur)' }, { status: 500 })
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
    strengths,
    toneStyle,
    targetClient,
    yearsExp,
  } = body as {
    category?: string
    categoryLabel?: string
    city?: string
    fullName?: string
    serviceName?: string
    servicePrice?: number | string
    goal?: string
    strengths?: string
    toneStyle?: string
    targetClient?: string
    yearsExp?: string | number
  }

  const metier = (typeof categoryLabel === 'string' && categoryLabel.trim()) ? categoryLabel.trim() : (category ?? '')

  const toneLabel = (typeof toneStyle === 'string' && toneStyle.trim()) ? toneStyle.trim() : 'chaleureux et professionnel'
  const clientLabel = (typeof targetClient === 'string' && targetClient.trim()) ? targetClient.trim() : ''
  const expLabel = (yearsExp != null && String(yearsExp).trim()) ? `${String(yearsExp).trim()} ans de pratique` : ''

  const prompt = `Tu es un copywriter d'élite, spécialisé en personal branding et conversion pour des indépendants en France. Ta mission : rédiger une bio de profil qui capte l'attention en 3 secondes, inspire une confiance immédiate et donne envie de réserver.

PROFIL À METTRE EN VALEUR :
• Nom : ${fullName ?? ''}
• Métier : ${metier}
• Ville : ${city ?? ''}
• Service star : ${serviceName ?? ''} à ${servicePrice ?? ''}€${expLabel ? `
• Expérience : ${expLabel}` : ''}${strengths ? `
• Points forts & spécialités UNIQUES : ${strengths}` : ''}${clientLabel ? `
• Clientèle cible : ${clientLabel}` : ''}
• Ton souhaité : ${toneLabel}
• Objectif : ${goal ?? ''}

CONSIGNES ABSOLUES (chaque règle est non-négociable) :
1. 2 à 3 PHRASES MAXIMUM — jamais plus
2. Commence par le prénom OU le métier — JAMAIS « Je suis », « Bienvenue » ou « Notre »
3. Intègre les POINTS FORTS UNIQUES de façon naturelle dans le flow (pas en liste)
4. Une phrase = un BÉNÉFICE CLIENT concret et tangible (ce qu'il ressent, gagne, obtient)${clientLabel ? `
5. La bio doit résonner spécifiquement pour : ${clientLabel}` : ''}
6. Ton calibré sur « ${toneLabel} » — chaque mot doit transmettre cette énergie
7. Termine par un CTA naturel et invitant (ex : « Réservez votre séance », « Prenez rendez-vous en ligne »)
8. INTERDITS absolus : « passion », « accompagner », « bien-être au quotidien », « professionnel dévoué », tout cliché générique
9. Chaque mot doit être UTILE — la bio doit être unique, impossible à copier par un concurrent
10. Si des spécialités techniques sont mentionnées, utilise-les EXACTEMENT telles quelles

RETOURNE UNIQUEMENT LA BIO, RIEN D'AUTRE. Pas de guillemets. Pas de numérotation. Pas d'explication.`

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
