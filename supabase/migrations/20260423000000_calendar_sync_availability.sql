-- ============================================================
-- CalendaPro — Calendar Sync & Availability Engine
-- Tables: calendar_connections, sync_logs, blocked_slots
-- ============================================================

-- ── CALENDAR CONNECTIONS ────────────────────────────────────
-- Stores OAuth tokens for Google Calendar / Apple iCloud
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id          text        NOT NULL,
  provider        text        NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_email  text,
  access_token    text        NOT NULL,
  refresh_token   text,
  token_expires_at timestamptz,
  calendar_id     text,          -- Google: calendar ID, Apple: CalDAV URL
  watch_channel_id text,         -- Google push notification channel ID
  watch_resource_id text,        -- Google push notification resource ID
  watch_expiration timestamptz,  -- Google watch expiry
  sync_enabled    boolean     NOT NULL DEFAULT true,
  last_synced_at  timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (pro_id, provider)
);

CREATE INDEX IF NOT EXISTS calendar_connections_pro_id_idx ON public.calendar_connections(pro_id);
CREATE INDEX IF NOT EXISTS calendar_connections_watch_idx ON public.calendar_connections(watch_channel_id);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro_manage_own_connections"
  ON public.calendar_connections FOR ALL
  TO authenticated
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

CREATE POLICY "service_role_calendar_connections"
  ON public.calendar_connections FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── SYNC LOGS ───────────────────────────────────────────────
-- Audit trail for every sync operation
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id          text        NOT NULL,
  provider        text        NOT NULL,
  direction       text        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status          text        NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'partial')),
  events_synced   integer     DEFAULT 0,
  error_message   text,
  started_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS sync_logs_pro_id_idx ON public.sync_logs(pro_id);
CREATE INDEX IF NOT EXISTS sync_logs_started_at_idx ON public.sync_logs(started_at DESC);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro_read_own_sync_logs"
  ON public.sync_logs FOR SELECT
  TO authenticated
  USING (pro_id = auth.uid()::text);

CREATE POLICY "service_role_sync_logs"
  ON public.sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── BLOCKED SLOTS ───────────────────────────────────────────
-- External calendar events that block availability
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id          text        NOT NULL,
  source          text        NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('google', 'apple', 'manual')),
  external_event_id text,       -- Google/Apple event ID for dedup
  title           text,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  all_day         boolean     DEFAULT false,
  recurring       boolean     DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (pro_id, source, external_event_id)
);

CREATE INDEX IF NOT EXISTS blocked_slots_pro_id_idx ON public.blocked_slots(pro_id);
CREATE INDEX IF NOT EXISTS blocked_slots_time_idx ON public.blocked_slots(pro_id, start_at, end_at);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro_manage_own_blocked_slots"
  ON public.blocked_slots FOR ALL
  TO authenticated
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

CREATE POLICY "service_role_blocked_slots"
  ON public.blocked_slots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── BOOKINGS: add reminder_sent columns if missing ──────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_sent_24h boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reminder_sent_2h  boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_id_type    text    DEFAULT 'clerk_uid';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS source_channel    text    DEFAULT 'direct';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_amount    numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- ── SQL Function: get_available_slots ────────────────────────
-- Returns available time slots for a given pro on a given date.
-- Crosses: schedule (opening hours), bookings, and blocked_slots.
CREATE OR REPLACE FUNCTION get_available_slots(
  p_pro_id          text,
  p_date            date,
  p_duration_minutes integer DEFAULT 60,
  p_slot_interval    integer DEFAULT 30
)
RETURNS TABLE (
  slot_start  timestamptz,
  slot_end    timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_schedule       jsonb;
  v_day_name       text;
  v_day_config     jsonb;
  v_open_start     time;
  v_open_end       time;
  v_slot_time      timestamptz;
  v_slot_end_time  timestamptz;
  v_has_conflict   boolean;
BEGIN
  -- Get the pro's schedule
  SELECT p.schedule INTO v_schedule
  FROM public.profiles p
  WHERE p.id = p_pro_id;

  IF v_schedule IS NULL THEN
    RETURN; -- No schedule configured
  END IF;

  -- Map PostgreSQL day-of-week to French day names used in schedule JSON
  v_day_name := CASE EXTRACT(DOW FROM p_date)
    WHEN 0 THEN 'dimanche'
    WHEN 1 THEN 'lundi'
    WHEN 2 THEN 'mardi'
    WHEN 3 THEN 'mercredi'
    WHEN 4 THEN 'jeudi'
    WHEN 5 THEN 'vendredi'
    WHEN 6 THEN 'samedi'
  END;

  v_day_config := v_schedule -> v_day_name;

  -- Check if the day is closed
  IF v_day_config IS NULL OR (v_day_config ->> 'closed')::boolean = true THEN
    RETURN;
  END IF;

  v_open_start := (v_day_config ->> 'start')::time;
  v_open_end   := (v_day_config ->> 'end')::time;

  -- Generate slots within opening hours
  v_slot_time := (p_date + v_open_start) AT TIME ZONE 'Europe/Paris';

  WHILE v_slot_time + (p_duration_minutes * interval '1 minute') 
        <= (p_date + v_open_end) AT TIME ZONE 'Europe/Paris'
  LOOP
    v_slot_end_time := v_slot_time + (p_duration_minutes * interval '1 minute');

    -- Check conflict with existing bookings
    SELECT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.pro_id = p_pro_id
        AND b.status NOT IN ('cancelled', 'no_show')
        AND b.scheduled_at < v_slot_end_time
        AND b.scheduled_at + (COALESCE(b.duration_minutes, 60) * interval '1 minute') > v_slot_time
    ) INTO v_has_conflict;

    -- Check conflict with blocked slots (external calendars)
    IF NOT v_has_conflict THEN
      SELECT EXISTS (
        SELECT 1 FROM public.blocked_slots bs
        WHERE bs.pro_id = p_pro_id
          AND bs.start_at < v_slot_end_time
          AND bs.end_at > v_slot_time
      ) INTO v_has_conflict;
    END IF;

    -- Only return if no conflict and slot is in the future
    IF NOT v_has_conflict AND v_slot_time > NOW() THEN
      slot_start := v_slot_time;
      slot_end   := v_slot_end_time;
      RETURN NEXT;
    END IF;

    v_slot_time := v_slot_time + (p_slot_interval * interval '1 minute');
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION get_available_slots TO authenticated, service_role, anon;

-- ── SQL Function: get_monthly_analytics ──────────────────────
-- Returns real-time monthly analytics for a pro
CREATE OR REPLACE FUNCTION get_monthly_analytics(p_pro_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_month_start timestamptz;
  v_month_end   timestamptz;
  v_prev_start  timestamptz;
  v_prev_end    timestamptz;
BEGIN
  v_month_start := date_trunc('month', NOW());
  v_month_end   := date_trunc('month', NOW()) + interval '1 month';
  v_prev_start  := v_month_start - interval '1 month';
  v_prev_end    := v_month_start;

  SELECT jsonb_build_object(
    'monthly_revenue', COALESCE((
      SELECT SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(price, 0) ELSE COALESCE(deposit_amount, 0) END)
      FROM public.bookings
      WHERE pro_id = p_pro_id
        AND scheduled_at >= v_month_start
        AND scheduled_at < v_month_end
        AND status NOT IN ('cancelled')
    ), 0),
    'prev_monthly_revenue', COALESCE((
      SELECT SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(price, 0) ELSE COALESCE(deposit_amount, 0) END)
      FROM public.bookings
      WHERE pro_id = p_pro_id
        AND scheduled_at >= v_prev_start
        AND scheduled_at < v_prev_end
        AND status NOT IN ('cancelled')
    ), 0),
    'monthly_bookings', COALESCE((
      SELECT COUNT(*)
      FROM public.bookings
      WHERE pro_id = p_pro_id
        AND scheduled_at >= v_month_start
        AND scheduled_at < v_month_end
        AND status NOT IN ('cancelled')
    ), 0),
    'no_show_count', COALESCE((
      SELECT COUNT(*)
      FROM public.bookings
      WHERE pro_id = p_pro_id
        AND scheduled_at >= v_month_start
        AND scheduled_at < v_month_end
        AND status = 'no_show'
    ), 0),
    'no_show_rate', COALESCE((
      SELECT CASE WHEN COUNT(*) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE status = 'no_show')::numeric / COUNT(*)::numeric) * 100,
          1
        )
        ELSE 0
      END
      FROM public.bookings
      WHERE pro_id = p_pro_id
        AND scheduled_at >= v_month_start
        AND scheduled_at < v_month_end
        AND status NOT IN ('cancelled')
    ), 0),
    'sms_sent_count', COALESCE((
      SELECT COUNT(*)
      FROM public.notification_queue
      WHERE type = 'client_sms'
        AND status = 'sent'
        AND created_at >= v_month_start
        AND created_at < v_month_end
        AND booking_id IN (
          SELECT id FROM public.bookings WHERE pro_id = p_pro_id
        )
    ), 0),
    'new_clients_count', COALESCE((
      SELECT COUNT(DISTINCT client_id)
      FROM public.bookings b1
      WHERE b1.pro_id = p_pro_id
        AND b1.scheduled_at >= v_month_start
        AND b1.scheduled_at < v_month_end
        AND b1.status NOT IN ('cancelled')
        AND NOT EXISTS (
          SELECT 1 FROM public.bookings b2
          WHERE b2.pro_id = p_pro_id
            AND b2.client_id = b1.client_id
            AND b2.scheduled_at < v_month_start
            AND b2.status NOT IN ('cancelled')
        )
    ), 0),
    'cancellation_count', COALESCE((
      SELECT COUNT(*)
      FROM public.bookings
      WHERE pro_id = p_pro_id
        AND scheduled_at >= v_month_start
        AND scheduled_at < v_month_end
        AND status = 'cancelled'
    ), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_monthly_analytics TO authenticated, service_role;
