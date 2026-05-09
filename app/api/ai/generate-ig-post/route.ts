import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const { fullName, categoryLabel, city, username, serviceName, servicePrice, bio } = body as {
    fullName?: string
    categoryLabel?: string
    city?: string
    username?: string
    serviceName?: string
    servicePrice?: string | number
    bio?: string
  }

  const prompt = `Tu es un copywriter expert en marketing Instagram pour indépendants et artisans français. Tu connais les codes de chaque secteur et tu sais écrire des posts qui génèrent de vrais rendez-vous.

MISSION : Rédige le post d'ouverture Instagram de ${fullName ?? 'ce professionnel'} pour annoncer le lancement de sa page de réservation en ligne.

PROFIL DU PRO :
• Nom : ${fullName ?? ''}
• Métier : ${categoryLabel ?? ''}
• Ville : ${city ?? ''}
• Bio / positionnement : ${bio ? `"${bio}"` : 'Non fourni'}
• Service phare : ${serviceName ?? ''} à ${servicePrice ?? ''}€
• Lien de réservation : https://calendapro.fr/${username ?? ''}

RÈGLES D'ÉCRITURE :
1. ACCROCHE : Commence par une phrase-choc qui arrête le scroll (interdit : "Je suis heureux/fier", "C'est officiel")
2. CORPS : 3 à 4 lignes max — raconte une mini-histoire qui justifie pourquoi ce pro est différent, en s'appuyant sur sa bio
3. CTA : Intègre le lien naturellement dans la dernière phrase, pas juste collé à la fin
4. HASHTAGS : 6 à 9 hashtags ultra-ciblés (mélange macro + niche + local) sur une ligne séparée
5. ÉMOJIS : 2 à 3 max, placés stratégiquement pour le rythme, jamais en début de chaque ligne
6. TON : Authentique, direct, humain — comme si le pro parlait à ses meilleurs clients

RETOURNE UNIQUEMENT LE POST (aucun commentaire, aucune explication).`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json() as { content?: Array<{ type: string; text: string }>; error?: { message: string } }

    if (!response.ok || data.error) {
      return NextResponse.json({ post: `${fullName} vient de lancer sa page CalendaPro ! Réservez en ligne : calendapro.fr/${username ?? ''}` })
    }

    const post = data.content?.[0]?.type === 'text' ? data.content[0].text.trim() : ''
    return NextResponse.json({ post })
  } catch {
    return NextResponse.json({ post: `${fullName} vient de lancer sa page CalendaPro ! Réservez en ligne : calendapro.fr/${username ?? ''}` })
  }
}
