export type DepositType = 'percent' | 'fixed'
export type CancellationDelay = '1h' | '6h' | '24h' | '48h' | '72h' | 'custom'

export type CancellationDelayUnit = 'hours' | 'days'

export interface CustomCancellationDelay {
  value: number
  unit: CancellationDelayUnit
}

/** Valeur par défaut affichée / appliquée pour un acompte en % (fourchette 20–30 % demandée). */
export const DEFAULT_DEPOSIT_PERCENT = 25

export type BookingPaymentSettings = {
  online_payment_enabled: boolean
  deposit_required: boolean
  deposit_type: DepositType
  /** Pourcentage (1–100) ou montant fixe en euros selon deposit_type. */
  deposit_value: number
  allow_full_online_payment: boolean
  // Cancellation policy
  allow_cancellations?: boolean
  cancellation_delay?: CancellationDelay
  cancellation_delay_custom?: CustomCancellationDelay
  keep_deposit_on_late_cancellation?: boolean
  allow_reschedule?: boolean
  // Receipt settings
  auto_send_receipt_to_client?: boolean
  auto_send_receipt_to_pro?: boolean
  receipt_custom_message?: string
}

type ProfilePaymentRow = Partial<{
  online_payment_enabled: boolean | null
  deposit_required: boolean | null
  deposit_type: string | null
  deposit_value: number | string | null
  allow_full_online_payment: boolean | null
  // Cancellation policy
  allow_cancellations: boolean | null
  cancellation_delay: string | null
  cancellation_delay_custom_value: number | null
  cancellation_delay_custom_unit: string | null
  keep_deposit_on_late_cancellation: boolean | null
  allow_reschedule: boolean | null
  // Receipt settings
  auto_send_receipt_to_client: boolean | null
  auto_send_receipt_to_pro: boolean | null
  receipt_custom_message: string | null
}>

export function normalizeBookingPaymentSettings(row: ProfilePaymentRow): BookingPaymentSettings {
  const online_payment_enabled = row.online_payment_enabled === true

  let deposit_required = !!row.deposit_required
  const deposit_type: DepositType = row.deposit_type === 'fixed' ? 'fixed' : 'percent'
  let deposit_value = Number(row.deposit_value)
  if (!Number.isFinite(deposit_value)) {
    deposit_value = deposit_type === 'fixed' ? 20 : DEFAULT_DEPOSIT_PERCENT
  }

  let allow_full_online_payment = !!row.allow_full_online_payment

  if (!online_payment_enabled) {
    deposit_required = false
    allow_full_online_payment = false
  }

  if (deposit_type === 'percent') {
    deposit_value = Math.min(100, Math.max(1, deposit_value))
  } else {
    deposit_value = Math.min(10_000, Math.max(0.5, deposit_value))
  }

  // Cancellation policy normalization
  const validDelays: CancellationDelay[] = ['1h', '6h', '24h', '48h', '72h', 'custom']
  const cancellation_delay: CancellationDelay = validDelays.includes(row.cancellation_delay as CancellationDelay)
    ? (row.cancellation_delay as CancellationDelay)
    : '24h'

  // Custom cancellation delay normalization
  const cancellation_delay_custom: CustomCancellationDelay | undefined =
    cancellation_delay === 'custom' && row.cancellation_delay_custom_value
      ? {
          value: Number(row.cancellation_delay_custom_value) || 24,
          unit: (row.cancellation_delay_custom_unit as CancellationDelayUnit) || 'hours',
        }
      : undefined

  return {
    online_payment_enabled,
    deposit_required,
    deposit_type,
    deposit_value,
    allow_full_online_payment,
    allow_cancellations: row.allow_cancellations ?? true,
    cancellation_delay,
    cancellation_delay_custom,
    keep_deposit_on_late_cancellation: row.keep_deposit_on_late_cancellation ?? false,
    allow_reschedule: row.allow_reschedule ?? false,
    // Receipt settings
    auto_send_receipt_to_client: row.auto_send_receipt_to_client ?? true,
    auto_send_receipt_to_pro: row.auto_send_receipt_to_pro ?? false,
    receipt_custom_message: row.receipt_custom_message ?? '',
  }
}

/** Pour affichage / sauvegarde profil (mêmes règles que l'API profile). */
export function sanitizePaymentSettingsFromForm(input: {
  online_payment_enabled: boolean
  deposit_required: boolean
  deposit_type: DepositType
  deposit_value: number
  allow_full_online_payment: boolean
  allow_cancellations?: boolean
  cancellation_delay?: CancellationDelay
  cancellation_delay_custom?: CustomCancellationDelay
  keep_deposit_on_late_cancellation?: boolean
  allow_reschedule?: boolean
  auto_send_receipt_to_client?: boolean
  auto_send_receipt_to_pro?: boolean
  receipt_custom_message?: string
}): BookingPaymentSettings {
  return normalizeBookingPaymentSettings({
    online_payment_enabled: input.online_payment_enabled,
    deposit_required: input.deposit_required,
    deposit_type: input.deposit_type,
    deposit_value: input.deposit_value,
    allow_full_online_payment: input.allow_full_online_payment,
    allow_cancellations: input.allow_cancellations,
    cancellation_delay: input.cancellation_delay,
    cancellation_delay_custom_value: input.cancellation_delay_custom?.value,
    cancellation_delay_custom_unit: input.cancellation_delay_custom?.unit,
    keep_deposit_on_late_cancellation: input.keep_deposit_on_late_cancellation,
    allow_reschedule: input.allow_reschedule,
    auto_send_receipt_to_client: input.auto_send_receipt_to_client,
    auto_send_receipt_to_pro: input.auto_send_receipt_to_pro,
    receipt_custom_message: input.receipt_custom_message,
  })
}
