// Supabase Edge Function — Pulse Smart Reminders
// Cron: every 6 hours → analyzes patterns + sends reminders
// Deploy: supabase functions deploy pulse-smart-reminders
// Schedule: SELECT cron.schedule('pulse-reminders', '0 */6 * * *',
//   $$SELECT net.http_post(url := 'https://<project>.supabase.co/functions/v1/pulse-smart-reminders', headers := '{"Authorization": "Bearer <anon_key>"}')$$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderCandidate {
  pattern_id: string
  pro_id: string
  client_id: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  avg_interval_days: number
  last_booking_at: string
  next_expected_at: string
  booking_count: number
  preferred_service: string | null
  confidence_score: number
  days_overdue: number
  pro_full_name: string
  pro_username: string
  reminder_channel: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://calendapro.com'

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const resend = resendKey ? new Resend(resendKey) : null

    // 1. Re-analyze patterns
    const { data: patternsCount, error: pErr } = await supabase.rpc(
      'pulse_analyze_patterns',
      { target_pro_id: null }
    )
    if (pErr) console.error('Pattern analysis error:', pErr.message)
    else console.log(`Patterns analyzed: ${patternsCount}`)

    // 2. Get reminder candidates
    const { data: candidates, error: cErr } = await supabase.rpc(
      'pulse_get_reminder_candidates',
      { lookahead_days: 7 }
    )
    if (cErr) {
      throw new Error(`Candidate fetch failed: ${cErr.message}`)
    }

    const list = (candidates as ReminderCandidate[]) ?? []
    console.log(`Reminder candidates: ${list.length}`)

    let sent = 0
    let failed = 0

    for (const c of list) {
      if (!c.client_email && !c.client_phone) continue

      const clientFirst = c.client_name?.split(' ')[0] ?? 'Bonjour'
      const proName = c.pro_full_name ?? 'votre professionnel'
      const lastVisit = c.last_booking_at
        ? new Date(c.last_booking_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
          })
        : 'un moment'

      const interval = c.avg_interval_days
      const freq =
        interval <= 14
          ? 'toutes les deux semaines'
          : interval <= 35
            ? 'chaque mois'
            : interval <= 50
              ? 'toutes les six semaines'
              : `tous les ${Math.round(interval / 30)} mois`

      const bookingUrl = `${appUrl}/${c.pro_username}`

      // Send email
      if (c.client_email && resend && (c.reminder_channel === 'email' || c.reminder_channel === 'both')) {
        try {
          await resend.emails.send({
            from: 'CalendaPro Pulse <onboarding@resend.dev>',
            to: c.client_email,
            subject: `${clientFirst}, c'est bientôt le moment de reprendre RDV !`,
            html: `
              <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
                <h1 style="font-size:24px;font-weight:700;color:#0f172a">Calenda<span style="color:#7c3aed">Pro</span></h1>
                <div style="background:linear-gradient(135deg,#f5f3ff,#fdf2f8);border-radius:16px;padding:32px;margin:24px 0">
                  <h2 style="font-size:20px;color:#0f172a;margin:0 0 12px">${clientFirst}, on pense à vous !</h2>
                  <p style="color:#475569;line-height:1.6">
                    Vous passez habituellement <strong>${freq}</strong> chez <strong>${proName}</strong>
                    et votre dernière visite remonte au <strong>${lastVisit}</strong>.
                    Il est peut-être temps de réserver votre prochain créneau !
                  </p>
                </div>
                <div style="text-align:center">
                  <a href="${bookingUrl}" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">
                    Réserver mon créneau
                  </a>
                </div>
              </div>`,
          })

          // Mark as sent
          await supabase
            .from('pulse_client_patterns')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', c.pattern_id)

          await supabase.from('pulse_reminder_log').insert({
            pro_id: c.pro_id,
            client_id: c.client_id,
            pattern_id: c.pattern_id,
            channel: 'email',
            message_preview: `Rappel ${freq} pour ${c.client_name}`,
            status: 'sent',
          })

          sent++
        } catch (e) {
          console.error(`Email failed for ${c.client_email}:`, e)
          failed++
        }
      }
    }

    const result = {
      patterns_analyzed: patternsCount ?? 0,
      candidates: list.length,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    }

    console.log('Smart Reminders complete:', result)

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
