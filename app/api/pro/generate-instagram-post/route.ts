import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const BEST_POST_TIMES = [
  { day: 'Mardi',   time: '14h – 16h', score: 0.87 },
  { day: 'Mercredi', time: '19h – 21h', score: 0.82 },
  { day: 'Vendredi', time: '11h – 13h', score: 0.79 },
]

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const {
    profession,
    city,
    services = [],
    tone = 'professionnelle',
    fullName,
    username,
    bio,
  } = body as {
    profession?: string
    city?: string
    services?: string[]
    tone?: string
    fullName?: string
    username?: string
    bio?: string
  }

  const servicesStr = Array.isArray(services) ? services.join(', ') : ''
  const profileUrl  = `https://calendapro.fr/${username ?? ''}`

  const prompt = `Tu es un copywriter expert en marketing Instagram pour indépendants français.

Rédige un post Instagram d'annonce de lancement pour ce professionnel :
- Nom : ${fullName ?? ''}
- Métier : ${profession ?? ''}
- Ville : ${city ?? ''}
- Services : ${servicesStr || 'Non précisé'}
- Bio : ${bio ?? ''}
- Lien réservation : ${profileUrl}
- Ton souhaité : ${tone}

RÈGLES :
1. Accroche qui arrête le scroll (interdit : "Je suis heureux", "C'est officiel")
2. Corps : 3-4 lignes max, mini-histoire différenciante
3. CTA avec le lien intégré naturellement
4. 7-9 hashtags ciblés (macro + niche + local) sur une ligne séparée
5. Max 2-3 émojis placés stratégiquement
6. Ton : authentique, direct, humain

RETOURNE UNIQUEMENT LE POST (caption + hashtags sur ligne séparée).`

  const hashtagPrompt = `Génère 9 hashtags Instagram populaires et ciblés pour un ${profession ?? 'professionnel'} à ${city ?? 'France'}.
Format : #tag1 #tag2 ... (une ligne, sans explication)`

  try {
    const [postResp, hashResp] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 100, messages: [{ role: 'user', content: hashtagPrompt }] }),
      }),
    ])

    const postData = (await postResp.json()) as { content?: Array<{ text?: string }> }
    const hashData = (await hashResp.json()) as { content?: Array<{ text?: string }> }

    const caption  = postData.content?.[0]?.text?.trim() ?? ''
    const hashtags = (hashData.content?.[0]?.text?.trim() ?? '').split(/\s+/).filter(h => h.startsWith('#'))

    return NextResponse.json({
      caption,
      hashtags,
      best_post_times: BEST_POST_TIMES,
      cta_link: profileUrl,
    })
  } catch {
    return NextResponse.json({
      caption: `${fullName ?? profession} vient de lancer sa page CalendaPro ! Réservez en ligne : ${profileUrl}`,
      hashtags: [`#${profession?.toLowerCase().replace(/\s+/g,'') ?? 'pro'}`, `#${city?.toLowerCase().replace(/\s+/g,'') ?? 'france'}`, '#calendapro', '#rdvenligne'],
      best_post_times: BEST_POST_TIMES,
      cta_link: profileUrl,
    })
  }
}
