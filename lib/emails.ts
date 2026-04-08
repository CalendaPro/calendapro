import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingNotification({
  professionalEmail,
  professionalName,
  clientName,
  clientEmail,
  date,
  notes,
}: {
  professionalEmail: string
  professionalName: string
  clientName: string
  clientEmail: string
  date: string
  notes?: string
}) {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  await resend.emails.send({
    from: 'CalendaPro <onboarding@resend.dev>',
    to: professionalEmail,
    subject: `Nouvelle demande de RDV de ${clientName}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">
            Calenda<span style="color: #7c3aed;">Pro</span>
          </h1>
        </div>

        <div style="background: #f8fafc; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
            Nouvelle demande de rendez-vous
          </h2>
          <p style="color: #64748b; margin: 0 0 24px 0;">
            Bonjour ${professionalName}, vous avez reçu une nouvelle demande.
          </p>

          <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: 16px;">
              <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Client</div>
              <div style="font-size: 16px; font-weight: 600; color: #0f172a;">${clientName}</div>
              <div style="font-size: 14px; color: #64748b;">${clientEmail}</div>
            </div>
            <div style="margin-bottom: 16px;">
              <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Date souhaitée</div>
              <div style="font-size: 16px; font-weight: 600; color: #7c3aed;">${formattedDate}</div>
            </div>
            ${notes ? `
            <div>
              <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Message</div>
              <div style="font-size: 14px; color: #0f172a;">${notes}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/appointments" 
             style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Voir dans mon dashboard
          </a>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px;">
          Propulsé par CalendaPro
        </p>
      </div>
    `,
  })
}

export async function sendBookingConfirmation({
  clientEmail,
  clientName,
  professionalName,
  date,
}: {
  clientEmail: string
  clientName: string
  professionalName: string
  date: string
}) {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  await resend.emails.send({
    from: 'CalendaPro <onboarding@resend.dev>',
    to: clientEmail,
    subject: `Votre demande de RDV avec ${professionalName} est confirmée`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">
            Calenda<span style="color: #7c3aed;">Pro</span>
          </h1>
        </div>

        <div style="background: #f0fdf4; border-radius: 16px; padding: 32px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 56px; height: 56px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">✓</div>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0; text-align: center;">
            Demande envoyée !
          </h2>
          <p style="color: #64748b; margin: 0; text-align: center;">
            Bonjour ${clientName}, votre demande de rendez-vous avec <strong>${professionalName}</strong> a bien été reçue.
          </p>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Date souhaitée</div>
          <div style="font-size: 18px; font-weight: 600; color: #7c3aed;">${formattedDate}</div>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">
          ${professionalName} vous contactera prochainement pour confirmer le rendez-vous.
        </p>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px;">
          Propulsé par CalendaPro
        </p>
      </div>
    `,
  })
}
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendBookingSMS({
  to,
  professionalName,
  date,
}: {
  to: string
  professionalName: string
  date: string
}) {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  await twilioClient.messages.create({
    body: `CalendaPro — Votre RDV avec ${professionalName} est confirmé pour le ${formattedDate}. À bientôt !`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

export async function sendReminderSMS({
  to,
  professionalName,
  date,
}: {
  to: string
  professionalName: string
  date: string
}) {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  await twilioClient.messages.create({
    body: `CalendaPro — Rappel : vous avez un RDV avec ${professionalName} demain ${formattedDate}. À bientôt !`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}