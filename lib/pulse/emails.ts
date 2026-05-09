import { Resend } from 'resend'
import type { BriefingData, BriefingAppointment, ReminderCandidate } from './types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'CalendaPro Pulse <onboarding@resend.dev>'

// ── Smart Reminder email ────────────────────────────────────
export async function sendSmartReminderEmail(candidate: ReminderCandidate) {
  const clientFirst = candidate.client_name?.split(' ')[0] ?? 'Bonjour'
  const proName = candidate.pro_full_name ?? 'votre professionnel'
  const lastVisit = candidate.last_booking_at
    ? new Date(candidate.last_booking_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      })
    : 'un moment'

  const interval = candidate.avg_interval_days
  const frequencyLabel =
    interval <= 14
      ? 'toutes les deux semaines'
      : interval <= 35
        ? 'chaque mois'
        : interval <= 50
          ? 'toutes les six semaines'
          : `tous les ${Math.round(interval / 30)} mois`

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${candidate.pro_username}`

  await resend.emails.send({
    from: FROM,
    to: candidate.client_email!,
    subject: `${clientFirst}, c'est bientôt le moment de reprendre RDV !`,
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">
            Calenda<span style="color: #7c3aed;">Pro</span>
            <span style="font-size: 12px; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-left: 8px;">PULSE</span>
          </h1>
        </div>

        <div style="background: linear-gradient(135deg, #f5f3ff, #fdf2f8); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 12px 0;">
            ${clientFirst}, on pense à vous !
          </h2>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
            Vous passez habituellement <strong>${frequencyLabel}</strong> chez <strong>${proName}</strong>
            et votre dernière visite remonte au <strong>${lastVisit}</strong>.
          </p>
          <p style="color: #475569; line-height: 1.6; margin: 0;">
            Il est peut-être temps de réserver votre prochain créneau pour garder votre rythme !
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${bookingUrl}"
             style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Réserver mon créneau
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">
          Suggestion personnalisée par CalendaPro Pulse · 
          <a href="${bookingUrl}" style="color: #94a3b8;">Se désinscrire</a>
        </p>
      </div>
    `,
  })
}

// ── Daily Briefing email ────────────────────────────────────
export async function sendDailyBriefingEmail(
  proEmail: string,
  proName: string,
  aiSummary: string,
  data: BriefingData
) {
  const appointments = data.appointments ?? []
  const birthdays = data.birthdays_today ?? []
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const appointmentRows = appointments
    .map((a: BriefingAppointment) => {
      const time = a.date ? new Date(a.date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }) : '—'
      const badge =
        a.client_tag === 'nouveau'
          ? '<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">Nouveau</span>'
          : a.client_tag === 'fidele'
            ? '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">Fidèle</span>'
            : ''
 const birthdayIcon = a.is_birthday ? ' ' : ''
      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #7c3aed;">${time}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${a.client_name ?? 'Client'}${birthdayIcon} ${badge}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${a.title}</td>
        </tr>`
    })
    .join('')

  const birthdaySection =
    birthdays.length > 0
      ? `
        <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 600; color: #92400e;">
 Anniversaire(s) aujourd'hui : ${birthdays.map((b) => b.name).join(', ')}
          </p>
        </div>`
      : ''

  const summaryHtml = aiSummary.replace(/\n/g, '<br>')

  await resend.emails.send({
    from: FROM,
    to: proEmail,
 subject: ` Votre briefing du ${today}`,
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">
            Calenda<span style="color: #7c3aed;">Pro</span>
            <span style="font-size: 12px; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-left: 8px;">PULSE</span>
          </h1>
        </div>

        <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 16px; padding: 28px; margin-bottom: 24px; color: white;">
          <p style="font-size: 13px; opacity: 0.8; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em;">Briefing du jour</p>
          <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 4px 0;">Bonjour ${proName}</h2>
          <p style="opacity: 0.9; font-size: 14px; margin: 0;">${today}</p>
        </div>

        <!-- KPI cards -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #7c3aed;">${appointments.length}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">RDV</div>
          </div>
          <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #059669;">${data.revenue_forecast}€</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Revenu estimé</div>
          </div>
          <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: #0f172a;">${data.total_clients}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Clients</div>
          </div>
        </div>

        ${birthdaySection}

        <!-- AI Summary -->
        <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #7c3aed;">
          <p style="font-size: 12px; font-weight: 600; color: #7c3aed; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">
 Recommandations IA
          </p>
          <p style="color: #334155; line-height: 1.6; margin: 0; font-size: 14px;">${summaryHtml}</p>
        </div>

        <!-- Appointments table -->
        ${appointments.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 12px 0;">Planning détaillé</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px; text-align: left; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Heure</th>
                <th style="padding: 8px; text-align: left; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Client</th>
                <th style="padding: 8px; text-align: left; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Service</th>
              </tr>
            </thead>
            <tbody>
              ${appointmentRows}
            </tbody>
          </table>
        </div>` : ''}

        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Ouvrir mon dashboard
          </a>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px;">
          Propulsé par CalendaPro Pulse Engine
        </p>
      </div>
    `,
  })
}
