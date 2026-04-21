-- ============================================================
-- CalendaPro PULSE ENGINE
-- Smart Reminders · Dynamic Pricing · Daily Briefing
-- ============================================================

-- ── Trigger helper (ensure function exists) ─────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── PULSE SETTINGS (per pro) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pulse_settings (
  pro_id                    text        PRIMARY KEY,
  smart_reminders_enabled   boolean     NOT NULL DEFAULT true,
  dynamic_pricing_enabled   boolean     NOT NULL DEFAULT false,
  daily_briefing_enabled    boolean     NOT NULL DEFAULT true,
  briefing_delivery         text        NOT NULL DEFAULT 'email'
    CHECK (briefing_delivery IN ('email', 'sms', 'both')),
  reminder_channel          text        NOT NULL DEFAULT 'email'
    CHECK (reminder_channel IN ('email', 'sms', 'both')),
  reminder_lookahead_days   int         NOT NULL DEFAULT 7
    CHECK (reminder_lookahead_days BETWEEN 1 AND 30),
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

ALTER TABLE public.pulse_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro manage own pulse settings" ON public.pulse_settings;
CREATE POLICY "pro manage own pulse settings"
  ON public.pulse_settings FOR ALL
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

-- ── CLIENT BOOKING PATTERNS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pulse_client_patterns (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id                text        NOT NULL,
  client_id             uuid        NOT NULL,
  client_name           text,
  client_email          text,
  client_phone          text,
  avg_interval_days     int,
  stddev_interval_days  numeric(6,2),
  last_booking_at       timestamptz,
  next_expected_at      timestamptz,
  reminder_sent_at      timestamptz,
  booking_count         int         NOT NULL DEFAULT 0,
  preferred_service     text,
  preferred_day_of_week int,          -- 0 = Sunday … 6 = Saturday
  confidence_score      numeric(3,2) NOT NULL DEFAULT 0
    CHECK (confidence_score BETWEEN 0 AND 1),
  status                text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'churned')),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(pro_id, client_id)
);

CREATE INDEX IF NOT EXISTS pulse_patterns_pro_idx
  ON public.pulse_client_patterns(pro_id);
CREATE INDEX IF NOT EXISTS pulse_patterns_next_expected_idx
  ON public.pulse_client_patterns(next_expected_at)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS pulse_patterns_reminder_sent_idx
  ON public.pulse_client_patterns(reminder_sent_at)
  WHERE status = 'active';

ALTER TABLE public.pulse_client_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro read own patterns" ON public.pulse_client_patterns;
CREATE POLICY "pro read own patterns"
  ON public.pulse_client_patterns FOR SELECT
  USING (pro_id = auth.uid()::text);

-- ── DYNAMIC PRICING RULES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pulse_pricing_rules (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id                  text        NOT NULL UNIQUE,
  enabled                 boolean     NOT NULL DEFAULT false,
  discount_percent        int         NOT NULL DEFAULT 15
    CHECK (discount_percent BETWEEN 5 AND 50),
  hours_before_threshold  int         NOT NULL DEFAULT 24
    CHECK (hours_before_threshold BETWEEN 1 AND 72),
  min_price_floor         numeric(10,2) NOT NULL DEFAULT 0,
  applicable_days         int[]       NOT NULL DEFAULT '{1,2,3,4,5}',
  applicable_hours_start  time        NOT NULL DEFAULT '09:00',
  applicable_hours_end    time        NOT NULL DEFAULT '18:00',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE public.pulse_pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro manage own pricing rules" ON public.pulse_pricing_rules;
CREATE POLICY "pro manage own pricing rules"
  ON public.pulse_pricing_rules FOR ALL
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

-- ── DISCOUNTED SLOTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pulse_discounted_slots (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id            text        NOT NULL,
  rule_id           uuid        REFERENCES public.pulse_pricing_rules(id) ON DELETE CASCADE,
  service_id        uuid,
  service_name      text,
  slot_time         timestamptz NOT NULL,
  original_price    numeric(10,2) NOT NULL,
  discounted_price  numeric(10,2) NOT NULL,
  discount_percent  int         NOT NULL,
  booked            boolean     NOT NULL DEFAULT false,
  expired           boolean     NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pulse_slots_pro_active_idx
  ON public.pulse_discounted_slots(pro_id, slot_time)
  WHERE booked = false AND expired = false;
CREATE INDEX IF NOT EXISTS pulse_slots_expiry_idx
  ON public.pulse_discounted_slots(slot_time)
  WHERE expired = false;

ALTER TABLE public.pulse_discounted_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read active discounts" ON public.pulse_discounted_slots;
CREATE POLICY "public read active discounts"
  ON public.pulse_discounted_slots FOR SELECT
  USING (booked = false AND expired = false);

DROP POLICY IF EXISTS "pro read own discounts" ON public.pulse_discounted_slots;
CREATE POLICY "pro read own discounts"
  ON public.pulse_discounted_slots FOR SELECT
  USING (pro_id = auth.uid()::text);

-- ── DAILY BRIEFINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pulse_daily_briefings (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id              text        NOT NULL,
  briefing_date       date        NOT NULL,
  content             jsonb       NOT NULL DEFAULT '{}',
  ai_summary          text,
  revenue_forecast    numeric(10,2) DEFAULT 0,
  appointment_count   int         DEFAULT 0,
  new_clients_count   int         DEFAULT 0,
  loyal_clients_count int         DEFAULT 0,
  birthdays           jsonb       DEFAULT '[]',
  sent_at             timestamptz,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(pro_id, briefing_date)
);

CREATE INDEX IF NOT EXISTS pulse_briefings_lookup_idx
  ON public.pulse_daily_briefings(pro_id, briefing_date DESC);

ALTER TABLE public.pulse_daily_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro read own briefings" ON public.pulse_daily_briefings;
CREATE POLICY "pro read own briefings"
  ON public.pulse_daily_briefings FOR SELECT
  USING (pro_id = auth.uid()::text);

-- ── REMINDER LOG (audit trail) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.pulse_reminder_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id          text        NOT NULL,
  client_id       uuid,
  pattern_id      uuid        REFERENCES public.pulse_client_patterns(id) ON DELETE SET NULL,
  channel         text        NOT NULL CHECK (channel IN ('email', 'sms')),
  message_preview text,
  status          text        NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'delivered', 'failed', 'clicked')),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pulse_reminder_log_pro_idx
  ON public.pulse_reminder_log(pro_id, created_at DESC);

ALTER TABLE public.pulse_reminder_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro read own reminder logs" ON public.pulse_reminder_log;
CREATE POLICY "pro read own reminder logs"
  ON public.pulse_reminder_log FOR SELECT
  USING (pro_id = auth.uid()::text);

-- ── ADD birthday TO clients ─────────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS birthday date;

-- ============================================================
-- SQL FUNCTIONS — Heavy lifting in the database layer
-- ============================================================

-- ── Analyze booking patterns for all (or one) pro ───────────
CREATE OR REPLACE FUNCTION public.pulse_analyze_patterns(
  target_pro_id text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  patterns_updated int := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    WITH booking_intervals AS (
      SELECT
        a.user_id   AS pro_id,
        a.client_id,
        c.name       AS client_name,
        c.email      AS client_email,
        c.phone      AS client_phone,
        a.date       AS booking_date,
        a.title,
        LAG(a.date) OVER (
          PARTITION BY a.user_id, a.client_id ORDER BY a.date
        ) AS prev_date,
        COUNT(*) OVER (
          PARTITION BY a.user_id, a.client_id
        ) AS total_bookings
      FROM public.appointments a
      JOIN public.clients c ON c.id = a.client_id
      WHERE a.client_id IS NOT NULL
        AND a.status IN ('pending', 'confirmed', 'completed')
        AND (target_pro_id IS NULL OR a.user_id = target_pro_id)
    ),
    client_stats AS (
      SELECT
        bi.pro_id,
        bi.client_id,
        bi.client_name,
        bi.client_email,
        bi.client_phone,
        MAX(bi.total_bookings)::int AS booking_count,
        MAX(bi.booking_date)        AS last_booking,
        -- Average interval in days between consecutive bookings
        AVG(
          EXTRACT(EPOCH FROM (bi.booking_date - bi.prev_date)) / 86400
        )::int AS avg_days,
        -- Standard deviation → lower = more regular
        STDDEV(
          EXTRACT(EPOCH FROM (bi.booking_date - bi.prev_date)) / 86400
        )::numeric(6,2) AS stddev_days,
        -- Most common day of week
        MODE() WITHIN GROUP (
          ORDER BY EXTRACT(DOW FROM bi.booking_date)::int
        ) AS preferred_dow,
        -- Most common service (from appointment title)
        MODE() WITHIN GROUP (ORDER BY bi.title) AS top_title
      FROM booking_intervals bi
      WHERE bi.prev_date IS NOT NULL
      GROUP BY bi.pro_id, bi.client_id, bi.client_name,
               bi.client_email, bi.client_phone
      HAVING COUNT(*) >= 2  -- need ≥ 2 intervals
    )
    SELECT
      cs.*,
      -- Predicted next appointment
      (cs.last_booking + (cs.avg_days || ' days')::interval) AS next_expected,
      -- Confidence: high bookings + low stddev → high confidence
      LEAST(1.0, GREATEST(0.0,
        (LEAST(cs.booking_count, 10)::numeric / 10) *
        (1 - LEAST(COALESCE(cs.stddev_days, 999), cs.avg_days)
             / GREATEST(cs.avg_days, 1))
      ))::numeric(3,2) AS confidence
    FROM client_stats cs
  LOOP
    INSERT INTO public.pulse_client_patterns (
      pro_id, client_id, client_name, client_email, client_phone,
      avg_interval_days, stddev_interval_days,
      last_booking_at, next_expected_at,
      booking_count, preferred_day_of_week, preferred_service,
      confidence_score, status
    )
    VALUES (
      rec.pro_id, rec.client_id, rec.client_name,
      rec.client_email, rec.client_phone,
      rec.avg_days, rec.stddev_days,
      rec.last_booking, rec.next_expected,
      rec.booking_count, rec.preferred_dow, rec.top_title,
      rec.confidence,
      CASE
        WHEN rec.last_booking < now() - (rec.avg_days * 3 || ' days')::interval
          THEN 'churned'
        ELSE 'active'
      END
    )
    ON CONFLICT (pro_id, client_id) DO UPDATE SET
      client_name          = EXCLUDED.client_name,
      client_email         = EXCLUDED.client_email,
      client_phone         = EXCLUDED.client_phone,
      avg_interval_days    = EXCLUDED.avg_interval_days,
      stddev_interval_days = EXCLUDED.stddev_interval_days,
      last_booking_at      = EXCLUDED.last_booking_at,
      next_expected_at     = EXCLUDED.next_expected_at,
      booking_count        = EXCLUDED.booking_count,
      preferred_day_of_week = EXCLUDED.preferred_day_of_week,
      preferred_service    = EXCLUDED.preferred_service,
      confidence_score     = EXCLUDED.confidence_score,
      status               = EXCLUDED.status,
      updated_at           = now();

    patterns_updated := patterns_updated + 1;
  END LOOP;

  RETURN patterns_updated;
END;
$$;

-- ── Get clients who need a reminder ─────────────────────────
CREATE OR REPLACE FUNCTION public.pulse_get_reminder_candidates(
  lookahead_days int DEFAULT 7
)
RETURNS TABLE (
  pattern_id          uuid,
  pro_id              text,
  client_id           uuid,
  client_name         text,
  client_email        text,
  client_phone        text,
  avg_interval_days   int,
  last_booking_at     timestamptz,
  next_expected_at    timestamptz,
  booking_count       int,
  preferred_service   text,
  confidence_score    numeric,
  days_overdue        int,
  pro_full_name       text,
  pro_username        text,
  reminder_channel    text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id              AS pattern_id,
    p.pro_id,
    p.client_id,
    p.client_name,
    p.client_email,
    p.client_phone,
    p.avg_interval_days,
    p.last_booking_at,
    p.next_expected_at,
    p.booking_count,
    p.preferred_service,
    p.confidence_score,
    EXTRACT(DAY FROM now() - p.next_expected_at)::int AS days_overdue,
    pr.full_name      AS pro_full_name,
    pr.username        AS pro_username,
    ps.reminder_channel
  FROM public.pulse_client_patterns p
  JOIN public.profiles pr  ON pr.id::text = p.pro_id
  JOIN public.pulse_settings ps ON ps.pro_id = p.pro_id
  WHERE p.status = 'active'
    AND p.confidence_score >= 0.3
    AND ps.smart_reminders_enabled = true
    AND p.next_expected_at <= now() + (lookahead_days || ' days')::interval
    AND (
      p.reminder_sent_at IS NULL
      OR p.reminder_sent_at < now() - interval '7 days'
    )
    -- Skip clients who already booked upcoming
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.user_id = p.pro_id
        AND a.client_id = p.client_id
        AND a.date > now()
        AND a.status IN ('pending', 'confirmed')
    )
  ORDER BY p.confidence_score DESC, p.next_expected_at ASC;
$$;

-- ── Get structured briefing data for a pro ──────────────────
CREATE OR REPLACE FUNCTION public.pulse_get_briefing_data(
  target_pro_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result        jsonb;
  tz            text := 'Europe/Paris';
  today_start   timestamptz;
  today_end     timestamptz;
BEGIN
  today_start := date_trunc('day', now() AT TIME ZONE tz) AT TIME ZONE tz;
  today_end   := today_start + interval '1 day';

  SELECT jsonb_build_object(
    -- Today's appointments with client intel
    'appointments', COALESCE((
      SELECT jsonb_agg(row_data ORDER BY (row_data->>'date'))
      FROM (
        SELECT jsonb_build_object(
          'id',            a.id,
          'title',         a.title,
          'date',          a.date,
          'duration',      a.duration,
          'notes',         a.notes,
          'status',        a.status,
          'client_name',   c.name,
          'client_email',  c.email,
          'client_phone',  c.phone,
          'is_birthday',   (
            c.birthday IS NOT NULL
            AND EXTRACT(MONTH FROM c.birthday) = EXTRACT(MONTH FROM now())
            AND EXTRACT(DAY   FROM c.birthday) = EXTRACT(DAY   FROM now())
          ),
          'total_visits',  (
            SELECT COUNT(*) FROM public.appointments a2
            WHERE a2.user_id = target_pro_id
              AND a2.client_id = c.id
              AND a2.status IN ('completed','confirmed','pending')
          ),
          'is_new_client', (
            SELECT COUNT(*) <= 1 FROM public.appointments a2
            WHERE a2.user_id = target_pro_id
              AND a2.client_id = c.id
          ),
          'client_tag', CASE
            WHEN c.id IS NULL THEN 'inconnu'
            WHEN (SELECT COUNT(*) FROM public.appointments a2
                  WHERE a2.user_id = target_pro_id AND a2.client_id = c.id) <= 1
              THEN 'nouveau'
            WHEN (SELECT COUNT(*) FROM public.appointments a2
                  WHERE a2.user_id = target_pro_id AND a2.client_id = c.id) >= 5
              THEN 'fidele'
            ELSE 'regulier'
          END
        ) AS row_data
        FROM public.appointments a
        LEFT JOIN public.clients c ON c.id = a.client_id
        WHERE a.user_id = target_pro_id
          AND a.date >= today_start
          AND a.date <  today_end
          AND a.status IN ('pending', 'confirmed')
      ) sub
    ), '[]'::jsonb),

    -- Revenue forecast from bookings with prices
    'revenue_forecast', COALESCE((
      SELECT SUM(b.price)
      FROM public.bookings b
      WHERE b.pro_id = target_pro_id
        AND b.scheduled_at >= today_start
        AND b.scheduled_at <  today_end
        AND b.status IN ('upcoming', 'completed')
    ), 0),

    -- This week's revenue
    'week_revenue', COALESCE((
      SELECT SUM(b.price)
      FROM public.bookings b
      WHERE b.pro_id = target_pro_id
        AND b.scheduled_at >= date_trunc('week', now() AT TIME ZONE tz) AT TIME ZONE tz
        AND b.status IN ('upcoming', 'completed')
        AND b.payment_status = 'paid'
    ), 0),

    -- This month appointment count
    'month_bookings', (
      SELECT COUNT(*)
      FROM public.appointments a
      WHERE a.user_id = target_pro_id
        AND a.date >= date_trunc('month', now() AT TIME ZONE tz) AT TIME ZONE tz
        AND a.status IN ('pending', 'confirmed', 'completed')
    ),

    -- Pending appointments needing action
    'pending_count', (
      SELECT COUNT(*)
      FROM public.appointments a
      WHERE a.user_id = target_pro_id
        AND a.status = 'pending'
        AND a.date > now()
    ),

    -- Total unique clients
    'total_clients', (
      SELECT COUNT(*)
      FROM public.clients c
      WHERE c.user_id = target_pro_id
    ),

    -- Clients with birthdays today
    'birthdays_today', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name',  c.name,
        'email', c.email,
        'phone', c.phone
      ))
      FROM public.clients c
      WHERE c.user_id = target_pro_id
        AND c.birthday IS NOT NULL
        AND EXTRACT(MONTH FROM c.birthday) = EXTRACT(MONTH FROM now())
        AND EXTRACT(DAY   FROM c.birthday) = EXTRACT(DAY   FROM now())
    ), '[]'::jsonb),

    -- Clients at risk of churning
    'churn_risk_count', (
      SELECT COUNT(*)
      FROM public.pulse_client_patterns p
      WHERE p.pro_id = target_pro_id
        AND p.status = 'churned'
    ),

    -- Smart reminder candidates count
    'reminder_candidates', (
      SELECT COUNT(*)
      FROM public.pulse_client_patterns p
      WHERE p.pro_id = target_pro_id
        AND p.status = 'active'
        AND p.next_expected_at <= now()
        AND (p.reminder_sent_at IS NULL
             OR p.reminder_sent_at < now() - interval '7 days')
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ── Find empty slots eligible for dynamic pricing ───────────
CREATE OR REPLACE FUNCTION public.pulse_find_empty_slots(
  target_pro_id text DEFAULT NULL
)
RETURNS TABLE (
  pro_id            text,
  rule_id           uuid,
  service_id        uuid,
  service_name      text,
  slot_time         timestamptz,
  original_price    numeric,
  discount_percent  int,
  discounted_price  numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH pro_rules AS (
    SELECT r.*
    FROM public.pulse_pricing_rules r
    WHERE r.enabled = true
      AND (target_pro_id IS NULL OR r.pro_id = target_pro_id)
  ),
  pro_services AS (
    SELECT s.id, s.user_id, s.name, s.price, s.duration
    FROM public.services s
    WHERE s.price > 0
      AND (target_pro_id IS NULL OR s.user_id = target_pro_id)
  ),
  time_slots AS (
    SELECT
      r.pro_id              AS ts_pro_id,
      r.id                  AS ts_rule_id,
      r.discount_percent    AS ts_discount,
      r.min_price_floor     AS ts_floor,
      ps.id                 AS ts_service_id,
      ps.name               AS ts_service_name,
      ps.price              AS ts_original_price,
      gs                    AS ts_slot_time
    FROM pro_rules r
    CROSS JOIN pro_services ps
    CROSS JOIN LATERAL generate_series(
      date_trunc('hour', now()) + interval '1 hour',
      now() + (r.hours_before_threshold || ' hours')::interval,
      (COALESCE(ps.duration, 60) || ' minutes')::interval
    ) gs
    WHERE ps.user_id = r.pro_id
      AND EXTRACT(DOW FROM gs) = ANY(r.applicable_days)
      AND gs::time >= r.applicable_hours_start
      AND gs::time <  r.applicable_hours_end
  )
  SELECT
    ts.ts_pro_id,
    ts.ts_rule_id,
    ts.ts_service_id,
    ts.ts_service_name,
    ts.ts_slot_time,
    ts.ts_original_price,
    ts.ts_discount,
    GREATEST(
      ts.ts_floor,
      ROUND(ts.ts_original_price * (1 - ts.ts_discount / 100.0), 2)
    )
  FROM time_slots ts
  WHERE NOT EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.user_id = ts.ts_pro_id
      AND a.date >= ts.ts_slot_time - interval '30 minutes'
      AND a.date <  ts.ts_slot_time + interval '30 minutes'
      AND a.status IN ('pending', 'confirmed')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.pulse_discounted_slots ds
    WHERE ds.pro_id     = ts.ts_pro_id
      AND ds.slot_time  = ts.ts_slot_time
      AND ds.service_id = ts.ts_service_id
      AND ds.expired    = false
  );
END;
$$;

-- ── Expire past discounted slots ────────────────────────────
CREATE OR REPLACE FUNCTION public.pulse_expire_old_slots()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count int;
BEGIN
  UPDATE public.pulse_discounted_slots
  SET expired = true
  WHERE slot_time < now()
    AND expired = false;

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- ── TRIGGERS ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS pulse_settings_updated_at ON public.pulse_settings;
CREATE TRIGGER pulse_settings_updated_at
  BEFORE UPDATE ON public.pulse_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pulse_patterns_updated_at ON public.pulse_client_patterns;
CREATE TRIGGER pulse_patterns_updated_at
  BEFORE UPDATE ON public.pulse_client_patterns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pulse_pricing_rules_updated_at ON public.pulse_pricing_rules;
CREATE TRIGGER pulse_pricing_rules_updated_at
  BEFORE UPDATE ON public.pulse_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── GRANTS ──────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.pulse_analyze_patterns(text)       TO service_role;
GRANT EXECUTE ON FUNCTION public.pulse_get_reminder_candidates(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.pulse_get_briefing_data(text)      TO service_role;
GRANT EXECUTE ON FUNCTION public.pulse_find_empty_slots(text)       TO service_role;
GRANT EXECUTE ON FUNCTION public.pulse_expire_old_slots()           TO service_role;

-- ── pg_cron (uncomment after enabling the extension) ────────
-- SELECT cron.schedule('pulse-analyze-patterns', '0 */6 * * *',
--   $$SELECT public.pulse_analyze_patterns(NULL)$$);
-- SELECT cron.schedule('pulse-expire-slots', '*/15 * * * *',
--   $$SELECT public.pulse_expire_old_slots()$$);

COMMENT ON TABLE public.pulse_settings          IS 'Per-pro Pulse Engine configuration';
COMMENT ON TABLE public.pulse_client_patterns   IS 'ML-computed booking frequency patterns per client-pro pair';
COMMENT ON TABLE public.pulse_pricing_rules     IS 'Dynamic off-peak pricing rules (Elite feature)';
COMMENT ON TABLE public.pulse_discounted_slots  IS 'Currently active discounted time slots';
COMMENT ON TABLE public.pulse_daily_briefings   IS 'Cached AI-generated daily briefings';
COMMENT ON TABLE public.pulse_reminder_log      IS 'Audit trail for smart reminder delivery';
COMMENT ON FUNCTION public.pulse_analyze_patterns  IS 'Recalculates booking frequency patterns — run via cron every 6h';
COMMENT ON FUNCTION public.pulse_get_briefing_data IS 'Returns structured JSON for AI briefing generation';
COMMENT ON FUNCTION public.pulse_find_empty_slots  IS 'Identifies bookable slots within threshold window for dynamic pricing';
