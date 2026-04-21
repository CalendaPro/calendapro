/**
 * Source unique de vérité pour le mapping des statuts booking.
 *
 * BD stocke : 'upcoming' | 'pending' | 'completed' | 'cancelled' | 'no_show'
 * UI affiche : 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show'
 *
 * La seule différence : 'upcoming' (BD) ↔ 'confirmed' (UI)
 */

export type DbBookingStatus = 'upcoming' | 'pending' | 'completed' | 'cancelled' | 'no_show'
export type UiBookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show'

const DB_TO_UI: Record<DbBookingStatus, UiBookingStatus> = {
  upcoming:  'confirmed',
  pending:   'pending',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show:   'no_show',
}

const UI_TO_DB: Record<UiBookingStatus, DbBookingStatus> = {
  confirmed: 'upcoming',
  pending:   'pending',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show:   'no_show',
}

export function toUiStatus(dbStatus: string): UiBookingStatus {
  return DB_TO_UI[dbStatus as DbBookingStatus] ?? 'pending'
}

export function toDbStatus(uiStatus: string): DbBookingStatus {
  return UI_TO_DB[uiStatus as UiBookingStatus] ?? (uiStatus as DbBookingStatus)
}

export const ACTIVE_DB_STATUSES: DbBookingStatus[] = ['upcoming', 'pending']
export const TERMINAL_DB_STATUSES: DbBookingStatus[] = ['completed', 'cancelled', 'no_show']
