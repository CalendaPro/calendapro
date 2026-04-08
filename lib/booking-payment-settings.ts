export type DepositType = 'percent' | 'fixed'

/** Valeur par défaut affichée / appliquée pour un acompte en % (fourchette 20–30 % demandée). */
export const DEFAULT_DEPOSIT_PERCENT = 25

export type BookingPaymentSettings = {
  online_payment_enabled: boolean
  deposit_required: boolean
  deposit_type: DepositType
  /** Pourcentage (1–100) ou montant fixe en euros selon deposit_type. */
  deposit_value: number
  allow_full_online_payment: boolean
}

type ProfilePaymentRow = Partial<{
  online_payment_enabled: boolean | null
  deposit_required: boolean | null
  deposit_type: string | null
  deposit_value: number | string | null
  allow_full_online_payment: boolean | null
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

  return {
    online_payment_enabled,
    deposit_required,
    deposit_type,
    deposit_value,
    allow_full_online_payment,
  }
}

/** Pour affichage / sauvegarde profil (mêmes règles que l’API profile). */
export function sanitizePaymentSettingsFromForm(input: {
  online_payment_enabled: boolean
  deposit_required: boolean
  deposit_type: DepositType
  deposit_value: number
  allow_full_online_payment: boolean
}): BookingPaymentSettings {
  return normalizeBookingPaymentSettings({
    online_payment_enabled: input.online_payment_enabled,
    deposit_required: input.deposit_required,
    deposit_type: input.deposit_type,
    deposit_value: input.deposit_value,
    allow_full_online_payment: input.allow_full_online_payment,
  })
}
