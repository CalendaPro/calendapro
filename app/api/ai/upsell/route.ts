import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { pro_id, selected_service_name, selected_service_price, services } = await request.json()

  if (!pro_id || !selected_service_name || !services?.length) {
    return NextResponse.json({ suggestion: null })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  // Filter out the selected service — suggest from remaining
  const otherServices = (services as Array<{ name: string; price: number; duration: number }>)
    .filter(s => s.name !== selected_service_name)

  if (otherServices.length === 0) {
    return NextResponse.json({ suggestion: null })
  }

  // Fast path: if no AI key, pick the best complement heuristically
  if (!apiKey) {
    const sorted = [...otherServices].sort((a, b) => b.price - a.price)
    const pick = sorted[0]
    return NextResponse.json({
      suggestion: {
        name: pick.name,
        price: pick.price,
        duration: pick.duration,
        discount_percent: 10,
        discounted_price: Math.round(pick.price * 0.9),
        reason: `Complétez votre ${selected_service_name} avec un ${pick.name} pour une expérience optimale.`,
      },
    })
  }

  // AI path
  const prompt = `Tu es un expert en upselling pour un salon/professionnel. Le client a choisi "${selected_service_name}" (${selected_service_price}€).

Services complémentaires disponibles :
${otherServices.map(s => `- ${s.name} : ${s.price}€ (${s.duration} min)`).join('\n')}

Choisis LE MEILLEUR service complémentaire et écris une phrase de vente ultra-convaincante (max 20 mots). Le ton doit être luxueux mais pas agressif.

Réponds UNIQUEMENT en JSON : {"name":"...","reason":"..."}`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!resp.ok) throw new Error('AI error')

    const data = (await resp.json()) as { content?: Array<{ text?: string }> }
    const text = data.content?.[0]?.text?.trim() ?? ''
    const parsed = JSON.parse(text) as { name: string; reason: string }

    const match = otherServices.find(s => s.name === parsed.name) ?? otherServices[0]
    return NextResponse.json({
      suggestion: {
        name: match.name,
        price: match.price,
        duration: match.duration,
        discount_percent: 10,
        discounted_price: Math.round(match.price * 0.9),
        reason: parsed.reason || `Complétez votre expérience avec ${match.name}.`,
      },
    })
  } catch {
    const pick = otherServices[0]
    return NextResponse.json({
      suggestion: {
        name: pick.name,
        price: pick.price,
        duration: pick.duration,
        discount_percent: 10,
        discounted_price: Math.round(pick.price * 0.9),
        reason: `Ajoutez ${pick.name} pour une expérience complète.`,
      },
    })
  }
}
