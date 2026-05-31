import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const result = await resend.emails.send({
      from: 'CalendaPro <onboarding@resend.dev>',
      to: 'contact.calendapro@gmail.com',
      subject: 'Test email CalendaPro',
      html: '<p>Test email fonctionne ✅</p>',
    })

    return NextResponse.json({ success: true, result })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
