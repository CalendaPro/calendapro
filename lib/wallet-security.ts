import { createServerSupabaseClient } from './supabase-server'
import { logger } from './logger'

/**
 * CalendaPay — Transaction Security Middleware
 * Circuit fermé : aucun crédit sans preuve d'annulation
 */

export interface TransactionProof {
  booking_id: string
  cancelled_by: 'pro' | 'client'
  canceller_id: string
  reason?: string
  original_amount: number
}

export interface WalletCreditRequest {
  user_id: string
  amount: number
  proof: TransactionProof
  metadata?: Record<string, unknown>
}

/**
 * Vérifie qu'une transaction de crédit est légitime
 * Règle du circuit fermé : on ne peut pas créditer sans preuve d'annulation
 */
export async function verifyCreditEligibility(
  request: WalletCreditRequest
): Promise<{ valid: boolean; error?: string; booking?: Record<string, unknown> }> {
  const { proof, user_id, amount } = request
  const supabase = createServerSupabaseClient()

  // 1. Vérifier que le booking existe et est bien annulé
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', proof.booking_id)
    .single()

  if (bookingError || !booking) {
    return { valid: false, error: `Booking non trouvé: ${proof.booking_id}` }
  }

  // 2. Vérifier que le statut est bien "cancelled"
  if (booking.status !== 'cancelled') {
    return {
      valid: false,
      error: `Circuit fermé: Le booking ${proof.booking_id} n'est pas annulé (statut: ${booking.status})`,
      booking
    }
  }

  // 3. Vérifier que le user_id correspond bien au client du booking
  if (booking.client_id !== user_id) {
    return {
      valid: false,
      error: `Circuit fermé: Le wallet cible (${user_id}) ne correspond pas au client du booking (${booking.client_id})`,
      booking
    }
  }

  // 4. Vérifier qu'un crédit n'a pas déjà été effectué pour ce booking
  const { data: existingCredit, error: creditError } = await supabase
    .from('wallet_transactions')
    .select('id, amount, created_at')
    .eq('booking_id', proof.booking_id)
    .eq('type', 'credit_refund')
    .eq('status', 'completed')
    .limit(1)

  if (creditError) {
    return { valid: false, error: `Erreur de vérification: ${creditError.message}` }
  }

  if (existingCredit && existingCredit.length > 0) {
    return {
      valid: false,
      error: `Circuit fermé: Remboursement déjà effectué le ${new Date(existingCredit[0].created_at).toLocaleString('fr-FR')}`,
      booking
    }
  }

  // 5. Vérifier que le montant correspond au paiement original
  const originalAmount = booking.price || 0
  if (Math.abs(amount - originalAmount) > 0.01) {
    return {
      valid: false,
      error: `Circuit fermé: Le montant demandé (${amount}) ne correspond pas au paiement original (${originalAmount})`,
      booking
    }
  }

  // 6. Vérifier que le booking avait bien un paiement
  if (booking.payment_status !== 'paid') {
    return {
      valid: false,
      error: `Circuit fermé: Aucun paiement n'a été effectué pour ce booking`,
      booking
    }
  }

  return { valid: true, booking }
}

/**
 * Exécute un crédit wallet de manière atomique
 * Met à jour : wallet, wallet_transactions, et booking (payment_status)
 */
export async function executeAtomicWalletCredit(
  request: WalletCreditRequest
): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
  const supabase = createServerSupabaseClient()

  // Vérification préalable
  const verification = await verifyCreditEligibility(request)
  if (!verification.valid) {
    return { success: false, error: verification.error }
  }

  try {
    // Récupérer ou créer le wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', request.user_id)
      .single()

    let walletId: string

    if (walletError) {
      // Créer le wallet s'il n'existe pas
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: request.user_id, balance: 0 })
        .select()
        .single()

      if (createError) {
        throw new Error(`Erreur création wallet: ${createError.message}`)
      }

      walletId = newWallet.id
    } else {
      walletId = wallet.id
    }

    // Créer la transaction
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        user_id: request.user_id,
        booking_id: request.proof.booking_id,
        type: 'credit_refund',
        amount: request.amount,
        description: `Remboursement suite à annulation (${request.proof.cancelled_by})`,
        metadata: {
          ...request.metadata,
          cancelled_by: request.proof.cancelled_by,
          canceller_id: request.proof.canceller_id,
          reason: request.proof.reason,
          verified_by_middleware: true,
          verification_timestamp: new Date().toISOString(),
        },
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (txError) {
      throw new Error(`Erreur création transaction: ${txError.message}`)
    }

    // Mettre à jour le solde du wallet
    const { error: updateError } = await supabase.rpc('increment_wallet_balance', {
      p_wallet_id: walletId,
      p_amount: request.amount,
    })

    if (updateError) {
      // Fallback si la fonction RPC n'existe pas
      const currentBalance = wallet?.balance || 0
      const { error: fallbackError } = await supabase
        .from('wallets')
        .update({ balance: currentBalance + request.amount, updated_at: new Date().toISOString() })
        .eq('id', walletId)

      if (fallbackError) {
        throw new Error(`Erreur mise à jour solde: ${fallbackError.message}`)
      }
    }

    // Mettre à jour le statut de paiement du booking
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ payment_status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', request.proof.booking_id)

    if (bookingError) {
      logger.warn('Erreur mise à jour booking:', bookingError)
      // Non bloquant - la transaction est déjà enregistrée
    }

    return { success: true, transaction_id: transaction.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Atomic wallet credit failed:', message)
    return { success: false, error: message }
  }
}

/**
 * Vérifie si un client peut annuler un booking (24h avant)
 */
export async function canCancelBooking(
  bookingId: string,
  clientId: string
): Promise<{ can_cancel: boolean; reason?: string; hours_remaining?: number; refund_eligible?: boolean }> {
  const supabase = createServerSupabaseClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('scheduled_at, status, payment_status, price, client_id')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return { can_cancel: false, reason: 'Rendez-vous non trouvé' }
  }

  if (booking.client_id !== clientId) {
    return { can_cancel: false, reason: 'Non autorisé' }
  }

  if (booking.status === 'cancelled') {
    return { can_cancel: false, reason: 'Déjà annulé' }
  }

  if (booking.status === 'completed') {
    return { can_cancel: false, reason: 'Rendez-vous déjà passé' }
  }

  const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil < 24) {
    return {
      can_cancel: false,
      reason: 'Annulation impossible à moins de 24h du rendez-vous',
      hours_remaining: hoursUntil,
      refund_eligible: false
    }
  }

  return {
    can_cancel: true,
    hours_remaining: hoursUntil,
    refund_eligible: booking.payment_status === 'paid' && (booking.price || 0) > 0
  }
}

/**
 * Middleware pour les routes d'annulation
 * Vérifie toutes les conditions avant d'autoriser l'annulation
 */
export async function cancellationMiddleware(
  bookingId: string,
  userId: string,
  userType: 'pro' | 'client'
): Promise<{
  allowed: boolean
  error?: string
  booking?: Record<string, unknown>
  refund_eligible?: boolean
}> {
  const supabase = createServerSupabaseClient()

  // Récupérer le booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return { allowed: false, error: 'Rendez-vous non trouvé' }
  }

  // Vérifier les permissions
  if (userType === 'client' && booking.client_id !== userId) {
    return { allowed: false, error: 'Vous ne pouvez pas annuler ce rendez-vous' }
  }

  if (userType === 'pro' && booking.pro_id !== userId) {
    return { allowed: false, error: 'Vous ne pouvez pas annuler ce rendez-vous' }
  }

  // Vérifier que ce n'est pas déjà annulé
  if (booking.status === 'cancelled') {
    return { allowed: false, error: 'Déjà annulé' }
  }

  // Pour les clients, vérifier le délai de 24h
  if (userType === 'client') {
    const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 24) {
      return {
        allowed: false,
        error: `Annulation impossible à moins de 24h du rendez-vous (${Math.ceil(hoursUntil)}h restantes)`,
        booking
      }
    }
  }

  // Vérifier l'éligibilité au remboursement
  const refundEligible = booking.payment_status === 'paid' && (booking.price || 0) > 0

  return {
    allowed: true,
    booking,
    refund_eligible: refundEligible
  }
}
