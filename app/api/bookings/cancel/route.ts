import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

// POST /api/bookings/cancel - Annuler un RDV avec crédit wallet
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { booking_id, reason, cancelled_by } = body

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id requis' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Vérifier le booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Rendez-vous non trouvé' }, { status: 404 })
  }

  // Vérifier les permissions selon qui annule
  const isPro = booking.pro_id === userId
  let isClient = booking.client_id === userId

  // Si pas encore trouvé, vérifier par email Clerk (client anonyme)
  if (!isClient && !isPro) {
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      const userEmail = user.emailAddresses[0]?.emailAddress
      if (userEmail && booking.client_id === userEmail) {
        isClient = true
      }
    } catch {}
  }

  if (!isPro && !isClient) {
    return NextResponse.json({ error: 'Non autorisé à annuler ce rendez-vous' }, { status: 403 })
  }

  // Si client, vérifier le délai de 24h
  if (isClient) {
    const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      return NextResponse.json({
        error: 'Annulation impossible à moins de 24h du rendez-vous',
        hours_remaining: hoursUntil,
      }, { status: 403 })
    }
  }

  // Si déjà annulé
  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Rendez-vous déjà annulé' }, { status: 400 })
  }

  // Annuler via la fonction RPC
  const { data: cancelResult, error: cancelError } = await supabase.rpc(
    'cancel_booking_with_wallet_credit',
    {
      p_booking_id: booking_id,
      p_cancelled_by: cancelled_by || (isPro ? 'pro' : 'client'),
      p_canceller_id: userId,
      p_reason: reason || null,
    }
  )

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 500 })
  }

  const result = cancelResult as { success: boolean; error?: string; refund_amount?: number; wallet_credited?: boolean }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Envoyer l'email de confirmation au client si remboursement
  if (result.wallet_credited && result.refund_amount && result.refund_amount > 0) {
    try {
      // Les coordonnées sont stockées directement sur le booking
      // (la table legacy `clients` n'est plus utilisée pour le flux client_profiles)
      const clientEmail = booking.client_email as string | null
      const clientName = booking.client_name as string | null

      if (clientEmail) {
        await resend.emails.send({
          from: 'CalendaPay <wallet@calendapro.app>',
          to: clientEmail,
          subject: 'Votre acompte est disponible dans votre porte-monnaie CalendaPro',
          html: `
            <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #10b981; font-family: 'Clash Display', sans-serif;">Remboursement effectué</h1>
              <p>Bonjour ${clientName || ''},</p>
              <p>Votre rendez-vous du <strong>${new Date(booking.scheduled_at).toLocaleDateString('fr-FR')}</strong> a été annulé.</p>
              <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #10b981;">
 <p style="margin: 0; font-size: 14px; color: #065f46;"> Montant crédité sur votre porte-monnaie</p>
                <p style="margin: 8px 0 0; font-size: 32px; font-weight: 700; color: #10b981;">${result.refund_amount.toFixed(2)} €</p>
              </div>
              <p>Votre acompte est maintenant disponible dans votre porte-monnaie CalendaPro et peut être utilisé pour votre prochaine réservation.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/wallet" 
                 style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 20px;">
                Voir mon porte-monnaie
              </a>
              <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">
                Si vous avez des questions, contactez-nous à support@calendapro.app
              </p>
            </div>
          `,
        })
      }
    } catch (emailError) {
      logger.error('Failed to send wallet email:', emailError)
      // Ne pas bloquer l'annulation si l'email échoue
    }
  }

  return NextResponse.json({
    success: true,
    booking_id,
    status: 'cancelled',
    wallet_credited: result.wallet_credited,
    refund_amount: result.refund_amount,
    message: result.wallet_credited
      ? 'Rendez-vous annulé et remboursement crédité sur votre porte-monnaie'
      : 'Rendez-vous annulé',
  })
}
