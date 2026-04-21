// ============================================================
// Pulse Engine — Shared Types
// ============================================================

export type PulseSettings = {
  pro_id: string
  smart_reminders_enabled: boolean
  dynamic_pricing_enabled: boolean
  daily_briefing_enabled: boolean
  briefing_delivery: 'email' | 'sms' | 'both'
  reminder_channel: 'email' | 'sms' | 'both'
  reminder_lookahead_days: number
  created_at: string
  updated_at: string
}

export type ClientPattern = {
  id: string
  pro_id: string
  client_id: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  avg_interval_days: number | null
  stddev_interval_days: number | null
  last_booking_at: string | null
  next_expected_at: string | null
  reminder_sent_at: string | null
  booking_count: number
  preferred_service: string | null
  preferred_day_of_week: number | null
  confidence_score: number
  status: 'active' | 'paused' | 'churned'
  created_at: string
  updated_at: string
}

export type ReminderCandidate = {
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
  reminder_channel: 'email' | 'sms' | 'both'
}

export type PricingRule = {
  id: string
  pro_id: string
  enabled: boolean
  discount_percent: number
  hours_before_threshold: number
  min_price_floor: number
  applicable_days: number[]
  applicable_hours_start: string
  applicable_hours_end: string
  created_at: string
  updated_at: string
}

export type DiscountedSlot = {
  id: string
  pro_id: string
  rule_id: string
  service_id: string | null
  service_name: string | null
  slot_time: string
  original_price: number
  discounted_price: number
  discount_percent: number
  booked: boolean
  expired: boolean
  created_at: string
}

export type BriefingAppointment = {
  id: string
  title: string
  date: string
  duration: number | null
  notes: string | null
  status: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  is_birthday: boolean
  total_visits: number
  is_new_client: boolean
  client_tag: 'nouveau' | 'regulier' | 'fidele' | 'inconnu'
}

export type BriefingBirthday = {
  name: string
  email: string | null
  phone: string | null
}

export type BriefingData = {
  appointments: BriefingAppointment[]
  revenue_forecast: number
  week_revenue: number
  month_bookings: number
  pending_count: number
  total_clients: number
  birthdays_today: BriefingBirthday[]
  churn_risk_count: number
  reminder_candidates: number
}

export type DailyBriefing = {
  id: string
  pro_id: string
  briefing_date: string
  content: BriefingData
  ai_summary: string | null
  revenue_forecast: number
  appointment_count: number
  new_clients_count: number
  loyal_clients_count: number
  birthdays: BriefingBirthday[]
  sent_at: string | null
  created_at: string
}

export type ReminderLogEntry = {
  id: string
  pro_id: string
  client_id: string | null
  pattern_id: string | null
  channel: 'email' | 'sms'
  message_preview: string | null
  status: 'sent' | 'delivered' | 'failed' | 'clicked'
  created_at: string
}

export type PulseEmptySlot = {
  pro_id: string
  rule_id: string
  service_id: string
  service_name: string
  slot_time: string
  original_price: number
  discount_percent: number
  discounted_price: number
}
