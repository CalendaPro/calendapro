// Supabase Edge Function — Pulse Daily Briefing
// Cron: daily at 8:00 AM Paris time → generates + sends briefing emails
// Deploy: supabase functions deploy pulse-daily-briefing
// Schedule: SELECT cron.schedule('pulse-daily-briefing', '0 6 * * *',  -- 6 UTC = 8 CET
//   $$SELECT net.http_post(url := 'https://<project>.supabase.co/functions/v1/pulse-daily-briefing', headers := '{"Authorization": "Bearer <anon_key>"}')$$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BriefingAppointment {
  id: string
  title: string
  date: string
  client_name: string | null
  client_tag: string
  is_birthday: boolean
  is_new_client: boolean
  total_visits: number
}

interface BriefingData {
  appointments: BriefingAppointment[]
  revenue_forecast: number
  week_revenue: number
  month_bookings: number
  pending_count: number
  total_clients: number
  birthdays_today: Array<{ name: string; email: string | null }>
  churn_risk_count: number
  reminder_candidates: number
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://calendapro.com'

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const resend = resendKey ? new Resend(resendKey) : null

    // Get all pros with briefing enabled
    const { data: settings, error: sErr } = await supabase
      .from('pulse_settings')
      .select('pro_id')
      .eq('daily_briefing_enabled', true)

    if (sErr) throw new Error(`Settings fetch failed: ${sErr.message}`)

    const proIds = (settings ?? []).map((s: { pro_id: string }) => s.pro_id)
    console.log(`Pros with briefing enabled: ${proIds.length}`)

    const today = new Date().toISOString().slice(0, 10)
    let generated = 0
    let emailed = 0
    let failed = 0

    for (const proId of proIds) {
      try {
        // Check if already generated today
        const { data: existing } = await supabase
          .from('pulse_daily_briefings')
          .select('id')
          .eq('pro_id', proId)
          .eq('briefing_date', today)
          .single()

        if (existing) {
          console.log(`Briefing already exists for ${proId}`)
          continue
        }

        // Get pro profile + email from Clerk
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', proId)
          .single()

        const proName = profile?.full_name ?? 'Professionnel'

        // Get briefing data
        const { data: briefingData, error: bErr } = await supabase.rpc(
          'pulse_get_briefing_data',
          { target_pro_id: proId }
        )

        if (bErr) {
          console.error(`Briefing data error for ${proId}:`, bErr.message)
          failed++
          continue
        }

        const data = briefingData as BriefingData

        // Generate AI summary
        let aiSummary: string
        if (anthropicKey) {
          aiSummary = await generateAISummary(anthropicKey, proName, data)
        } else {
          aiSummary = generateFallback(proName, data)
        }

        const appointments = data.appointments ?? []
        const birthdays = data.birthdays_today ?? []

        // Store briefing
        const { data: stored, error: storeErr } = await supabase
          .from('pulse_daily_briefings')
          .insert({
            pro_id: proId,
            briefing_date: today,
            content: data,
            ai_summary: aiSummary,
            revenue_forecast: data.revenue_forecast ?? 0,
            appointment_count: appointments.length,
            new_clients_count: appointments.filter((a) => a.is_new_client).length,
            loyal_clients_count: appointments.filter((a) => a.client_tag === 'fidele').length,
            birthdays: birthdays,
          })
          .select()
          .single()

        if (storeErr) {
          console.error(`Store error for ${proId}:`, storeErr.message)
          failed++
          continue
        }

        generated++

        // Send email
        if (resend && profile?.email) {
          try {
            const todayFormatted = new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })

            const appointmentRows = appointments
              .map((a) => {
                const time = a.date ? new Date(a.date).toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                }) : '—'
                const badge = a.is_new_client
                  ? '<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600">Nouveau</span>'
                  : a.client_tag === 'fidele'
                    ? '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600">Fidèle</span>'
                    : ''
                const bday = a.is_birthday ? ' 🎂' : ''
                return `<tr>
                  <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#7c3aed">${time}</td>
                  <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;color:#0f172a">${a.client_name ?? 'Client'}${bday} ${badge}</td>
                  <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;color:#64748b">${a.title}</td>
                </tr>`
              })
              .join('')

            const summaryHtml = aiSummary.replace(/\n/g, '<br>')

            await resend.emails.send({
              from: 'CalendaPro Pulse <onboarding@resend.dev>',
              to: profile.email,
              subject: `☀️ Votre briefing du ${todayFormatted}`,
              html: `
                <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto;padding:40px 20px">
                  <h1 style="font-size:24px;font-weight:700;color:#0f172a">
                    Calenda<span style="color:#7c3aed">Pro</span>
                    <span style="font-size:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-left:8px">PULSE</span>
                  </h1>

                  <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:16px;padding:28px;margin:24px 0;color:#fff">
                    <p style="font-size:13px;opacity:.8;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em">Briefing du jour</p>
                    <h2 style="font-size:22px;font-weight:700;margin:0 0 4px">Bonjour ${proName}</h2>
                    <p style="opacity:.9;font-size:14px;margin:0">${todayFormatted}</p>
                  </div>

                  <div style="display:flex;gap:12px;margin-bottom:24px">
                    <div style="flex:1;background:#f8fafc;border-radius:12px;padding:16px;text-align:center">
                      <div style="font-size:28px;font-weight:700;color:#7c3aed">${appointments.length}</div>
                      <div style="font-size:12px;color:#64748b;margin-top:2px">RDV</div>
                    </div>
                    <div style="flex:1;background:#f8fafc;border-radius:12px;padding:16px;text-align:center">
                      <div style="font-size:28px;font-weight:700;color:#059669">${data.revenue_forecast}€</div>
                      <div style="font-size:12px;color:#64748b;margin-top:2px">Revenu</div>
                    </div>
                    <div style="flex:1;background:#f8fafc;border-radius:12px;padding:16px;text-align:center">
                      <div style="font-size:28px;font-weight:700;color:#0f172a">${data.total_clients}</div>
                      <div style="font-size:12px;color:#64748b;margin-top:2px">Clients</div>
                    </div>
                  </div>

                  ${birthdays.length > 0 ? `
                  <div style="background:#fef3c7;border-radius:12px;padding:16px;margin-bottom:24px">
                    <p style="margin:0;font-weight:600;color:#92400e">🎂 Anniversaire(s) : ${birthdays.map((b) => b.name).join(', ')}</p>
                  </div>` : ''}

                  <div style="background:#f5f3ff;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #7c3aed">
                    <p style="font-size:12px;font-weight:600;color:#7c3aed;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em">✨ Recommandations IA</p>
                    <p style="color:#334155;line-height:1.6;margin:0;font-size:14px">${summaryHtml}</p>
                  </div>

                  ${appointments.length > 0 ? `
                  <h3 style="font-size:16px;font-weight:600;color:#0f172a;margin:0 0 12px">Planning détaillé</h3>
                  <table style="width:100%;border-collapse:collapse">
                    <thead><tr style="border-bottom:2px solid #e2e8f0">
                      <th style="padding:8px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Heure</th>
                      <th style="padding:8px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Client</th>
                      <th style="padding:8px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Service</th>
                    </tr></thead>
                    <tbody>${appointmentRows}</tbody>
                  </table>` : ''}

                  <div style="text-align:center;margin-top:24px">
                    <a href="${appUrl}/dashboard" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
                      Ouvrir mon dashboard
                    </a>
                  </div>

                  <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:32px">Propulsé par CalendaPro Pulse Engine</p>
                </div>`,
            })

            // Mark as sent
            if (stored?.id) {
              await supabase
                .from('pulse_daily_briefings')
                .update({ sent_at: new Date().toISOString() })
                .eq('id', stored.id)
            }

            emailed++
          } catch (emailErr) {
            console.error(`Email send error for ${proId}:`, emailErr)
          }
        }
      } catch (proErr) {
        console.error(`Processing error for ${proId}:`, proErr)
        failed++
      }
    }

    const result = {
      pros_processed: proIds.length,
      briefings_generated: generated,
      emails_sent: emailed,
      failed,
      timestamp: new Date().toISOString(),
    }

    console.log('Daily Briefing complete:', JSON.stringify(result))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Edge Function error:', e)
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ── AI Summary generation ───────────────────────────────────
async function generateAISummary(
  apiKey: string,
  proName: string,
  data: BriefingData
): Promise<string> {
  const appointments = data.appointments ?? []
  const birthdays = data.birthdays_today ?? []

  const clientProfiles = appointments
    .map((a) => {
      const tags: string[] = []
      if (a.is_new_client) tags.push('Nouveau')
      if (a.client_tag === 'fidele') tags.push('Fidèle')
      if (a.is_birthday) tags.push('Anniversaire')
      const tagStr = tags.length ? ` [${tags.join(', ')}]` : ''
      return `- ${a.date?.slice(11, 16)} → ${a.client_name ?? 'Client'}${tagStr} — ${a.title}`
    })
    .join('\n')

  const prompt = `Tu es l'assistant IA de CalendaPro. Génère un briefing matinal concis pour ${proName}.

DONNÉES :
• ${appointments.length} RDV · ${data.revenue_forecast}€ estimés · ${data.pending_count} en attente
• ${data.total_clients} clients · ${data.churn_risk_count} à risque · ${data.reminder_candidates} relances

PLANNING :
${clientProfiles || '(Journée libre)'}
${birthdays.length ? `🎂 Anniversaires : ${birthdays.map((b) => b.name).join(', ')}` : ''}

CONSIGNES : 1 accroche motivante, brief opérationnel, conseils pourboires/upsell, max 150 mots, ton pro+chaleureux.`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!resp.ok) {
      console.error('Anthropic error:', await resp.text())
      return generateFallback(proName, data)
    }

    const result = (await resp.json()) as { content?: Array<{ text?: string }> }
    return result.content?.[0]?.text?.trim() || generateFallback(proName, data)
  } catch {
    return generateFallback(proName, data)
  }
}

function generateFallback(proName: string, data: BriefingData): string {
  const appts = data.appointments ?? []
  const lines = [`Bonjour ${proName} ! ${appts.length} RDV aujourd'hui pour ${data.revenue_forecast}€ estimés.`]
  const newClients = appts.filter((a) => a.is_new_client)
  if (newClients.length) lines.push(`${newClients.length} nouveau(x) client(s) — faites bonne impression !`)
  if (data.birthdays_today?.length) lines.push(`🎂 Anniversaire(s) : ${data.birthdays_today.map((b) => b.name).join(', ')}`)
  if (data.pending_count) lines.push(`${data.pending_count} RDV en attente de confirmation.`)
  lines.push('Bonne journée ! 💪')
  return lines.join('\n')
}
