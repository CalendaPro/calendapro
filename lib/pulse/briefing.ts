import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { BriefingData, DailyBriefing, BriefingAppointment } from './types'

// ── Fetch raw briefing data from the SQL function ───────────
export async function fetchBriefingData(proId: string): Promise<BriefingData> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.rpc('pulse_get_briefing_data', {
    target_pro_id: proId,
  })

  if (error) {
    console.error('[Pulse:Briefing] Data fetch failed:', error.message)
    throw new Error(`Briefing data fetch failed: ${error.message}`)
  }

  return data as BriefingData
}

// ── Generate AI summary via Anthropic ───────────────────────
export async function generateAISummary(
  proName: string,
  data: BriefingData
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[Pulse:Briefing] ANTHROPIC_API_KEY missing — using template')
    return generateFallbackSummary(proName, data)
  }

  const appointments = data.appointments ?? []
  const birthdays = data.birthdays_today ?? []

  const clientProfiles = appointments
    .map((a: BriefingAppointment) => {
      const tags: string[] = []
      if (a.is_new_client) tags.push('🆕 Nouveau client')
      if (a.client_tag === 'fidele') tags.push('⭐ Client fidèle')
      if (a.is_birthday) tags.push('🎂 Anniversaire aujourd\'hui')
      const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : ''
      return `- ${a.date?.slice(11, 16)} → ${a.client_name ?? 'Client'}${tagStr} — ${a.title}`
    })
    .join('\n')

  const birthdayNames = birthdays.map((b) => b.name).join(', ')

  const prompt = `Tu es l'assistant IA de CalendaPro. Génère un briefing matinal concis et actionnable pour ${proName}.

DONNÉES DU JOUR :
• RDV aujourd'hui : ${appointments.length}
• Revenu estimé : ${data.revenue_forecast}€
• RDV en attente de confirmation : ${data.pending_count}
• Total clients : ${data.total_clients}
• Revenu semaine : ${data.week_revenue}€
• RDV ce mois : ${data.month_bookings}
• Clients à risque de perte : ${data.churn_risk_count}
• Relances intelligentes à envoyer : ${data.reminder_candidates}

PLANNING :
${clientProfiles || '(Pas de RDV aujourd\'hui)'}

${birthdayNames ? `🎂 ANNIVERSAIRES : ${birthdayNames}` : ''}

CONSIGNES :
1. Commence par un message d'accroche motivant et personnalisé (1 ligne)
2. Résume le planning en mode "brief opérationnel" (pas de listes longues)
3. Mets en valeur les clients importants : nouveaux (à impressionner), fidèles (à remercier), anniversaires (à féliciter)
4. Donne 2-3 conseils concrets pour maximiser la journée (pourboires, upsell, fidélisation)
5. Si des relances sont à faire, mentionne-le brièvement
6. Termine par une phrase de motivation
7. Maximum 200 mots. Ton : professionnel, chaleureux, motivant
8. Utilise des emojis avec parcimonie (max 5)

RETOURNE UNIQUEMENT LE BRIEFING, RIEN D'AUTRE.`

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
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[Pulse:Briefing] Anthropic error:', err)
      return generateFallbackSummary(proName, data)
    }

    const result = (await response.json()) as {
      content?: Array<{ text?: string }>
    }
    const summary = result.content?.[0]?.text?.trim()

    if (!summary) {
      return generateFallbackSummary(proName, data)
    }

    return summary
  } catch (e) {
    console.error('[Pulse:Briefing] AI generation failed:', e)
    return generateFallbackSummary(proName, data)
  }
}

// ── Template-based fallback when AI is unavailable ──────────
function generateFallbackSummary(
  proName: string,
  data: BriefingData
): string {
  const appts = data.appointments ?? []
  const birthdays = data.birthdays_today ?? []
  const newClients = appts.filter((a) => a.is_new_client)
  const loyalClients = appts.filter((a) => a.client_tag === 'fidele')

  const lines: string[] = [
    `Bonjour ${proName} ! Voici votre briefing du jour.`,
    '',
    `📅 ${appts.length} rendez-vous aujourd'hui — ${data.revenue_forecast}€ de revenu estimé.`,
  ]

  if (newClients.length > 0) {
    lines.push(
      `🆕 ${newClients.length} nouveau(x) client(s) : ${newClients.map((c) => c.client_name).join(', ')}. Faites une première impression mémorable !`
    )
  }

  if (loyalClients.length > 0) {
    lines.push(
      `⭐ ${loyalClients.length} client(s) fidèle(s) aujourd'hui. Un petit geste de remerciement peut faire la différence.`
    )
  }

  if (birthdays.length > 0) {
    lines.push(
      `🎂 Anniversaire(s) : ${birthdays.map((b) => b.name).join(', ')}. Pensez à leur souhaiter !`
    )
  }

  if (data.pending_count > 0) {
    lines.push(
      `⏳ ${data.pending_count} RDV en attente de confirmation — pensez à les valider.`
    )
  }

  if (data.reminder_candidates > 0) {
    lines.push(
      `📨 ${data.reminder_candidates} client(s) pourraient être relancés via le Pulse Engine.`
    )
  }

  lines.push('', 'Bonne journée ! 💪')

  return lines.join('\n')
}

// ── Build + store the daily briefing ────────────────────────
export async function buildAndStoreBriefing(
  proId: string,
  proName: string
): Promise<DailyBriefing> {
  const supabase = createServerSupabaseClient()
  const today = new Date().toISOString().slice(0, 10)

  // Check if briefing already exists for today
  const { data: existing } = await supabase
    .from('pulse_daily_briefings')
    .select('*')
    .eq('pro_id', proId)
    .eq('briefing_date', today)
    .single()

  if (existing?.ai_summary) {
    return existing as DailyBriefing
  }

  // Build fresh briefing
  const data = await fetchBriefingData(proId)
  const appointments = data.appointments ?? []
  const birthdays = data.birthdays_today ?? []
  const aiSummary = await generateAISummary(proName, data)

  const newClients = appointments.filter((a) => a.is_new_client)
  const loyalClients = appointments.filter(
    (a) => a.client_tag === 'fidele'
  )

  const briefing = {
    pro_id: proId,
    briefing_date: today,
    content: data,
    ai_summary: aiSummary,
    revenue_forecast: data.revenue_forecast ?? 0,
    appointment_count: appointments.length,
    new_clients_count: newClients.length,
    loyal_clients_count: loyalClients.length,
    birthdays: birthdays,
  }

  const { data: stored, error } = await supabase
    .from('pulse_daily_briefings')
    .upsert(briefing, { onConflict: 'pro_id,briefing_date' })
    .select()
    .single()

  if (error) {
    console.error('[Pulse:Briefing] Store failed:', error.message)
    throw new Error(`Briefing store failed: ${error.message}`)
  }

  return stored as DailyBriefing
}

// ── Get the latest briefing for a pro ───────────────────────
export async function getLatestBriefing(
  proId: string
): Promise<DailyBriefing | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pulse_daily_briefings')
    .select('*')
    .eq('pro_id', proId)
    .order('briefing_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Briefing fetch failed: ${error.message}`)
  }

  return (data as DailyBriefing) ?? null
}

// ── Mark a briefing as sent ─────────────────────────────────
export async function markBriefingSent(briefingId: string): Promise<void> {
  const supabase = createServerSupabaseClient()

  await supabase
    .from('pulse_daily_briefings')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', briefingId)
}
