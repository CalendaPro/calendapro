-- ============================================================
-- CalendaPro SCARCITY & WAITLIST ENGINE
-- ============================================================

-- ── PROFILE VIEW TRACKING ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id      text        NOT NULL,
  viewer_id   text,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_views_pro_idx
  ON public.profile_views(pro_id, viewed_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can insert views" ON public.profile_views;
CREATE POLICY "anyone can insert views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "pro reads own views" ON public.profile_views;
CREATE POLICY "pro reads own views"
  ON public.profile_views FOR SELECT
  USING (pro_id = auth.uid()::text);

-- ── SMART WAITLIST ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id          text        NOT NULL,
  pro_username    text        NOT NULL,
  client_id       text        NOT NULL,
  client_name     text,
  client_email    text,
  client_phone    text,
  service_name    text,
  preferred_day   int,
  preferred_time  text,
  status          text        NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  notified_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(pro_id, client_id)
);

CREATE INDEX IF NOT EXISTS waitlist_pro_idx    ON public.waitlist(pro_id) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS waitlist_client_idx ON public.waitlist(client_id);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client manage own waitlist" ON public.waitlist;
CREATE POLICY "client manage own waitlist"
  ON public.waitlist FOR ALL
  USING (client_id = auth.uid()::text)
  WITH CHECK (client_id = auth.uid()::text);
DROP POLICY IF EXISTS "pro read own waitlist" ON public.waitlist;
CREATE POLICY "pro read own waitlist"
  ON public.waitlist FOR SELECT
  USING (pro_id = auth.uid()::text);

-- ── SCARCITY STATS MATERIALIZED VIEW ────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS public.pro_scarcity_stats AS
SELECT
  p.id AS pro_id,
  p.username,
  COALESCE(v.view_count_24h, 0) AS views_24h,
  COALESCE(v.view_count_7d, 0) AS views_7d,
  lb.last_booked_at,
  COALESCE(w.waitlist_count, 0) AS waitlist_count,
  COALESCE(bc.booking_total, 0) AS total_bookings
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE pv.viewed_at > now() - interval '24 hours') AS view_count_24h,
    COUNT(*) FILTER (WHERE pv.viewed_at > now() - interval '7 days')   AS view_count_7d
  FROM public.profile_views pv
  WHERE pv.pro_id = p.id::text
) v ON true
LEFT JOIN LATERAL (
  SELECT MAX(b.scheduled_at) AS last_booked_at
  FROM public.bookings b
  WHERE b.pro_id = p.id::text
    AND b.status IN ('upcoming', 'completed')
) lb ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS waitlist_count
  FROM public.waitlist wl
  WHERE wl.pro_id = p.id::text AND wl.status = 'waiting'
) w ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS booking_total
  FROM public.bookings b2
  WHERE b2.pro_id = p.id::text
    AND b2.status = 'completed'
) bc ON true
WHERE p.username IS NOT NULL AND p.full_name IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pro_scarcity_stats_pro_idx
  ON public.pro_scarcity_stats(pro_id);

CREATE OR REPLACE FUNCTION public.refresh_scarcity_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.pro_scarcity_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_scarcity_stats() TO service_role;

-- ── REBOOK PREDICTION FUNCTION ──────────────────────────────
CREATE OR REPLACE FUNCTION public.predict_rebook(
  target_client_id text
)
RETURNS TABLE (
  pro_id        text,
  pro_username  text,
  pro_name      text,
  service_name  text,
  service_id    uuid,
  last_price    numeric,
  last_booked   timestamptz,
  booking_count bigint,
  confidence    numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH client_history AS (
    SELECT
      b.pro_id,
      b.pro_username,
      b.pro_name,
      b.service_name,
      b.service_id,
      b.price,
      b.scheduled_at,
      COUNT(*) OVER (PARTITION BY b.pro_id, b.service_name) AS svc_count,
      ROW_NUMBER() OVER (PARTITION BY b.pro_id, b.service_name ORDER BY b.scheduled_at DESC) AS rn
    FROM public.bookings b
    WHERE b.client_id = target_client_id
      AND b.status IN ('upcoming', 'completed')
  )
  SELECT
    ch.pro_id,
    ch.pro_username,
    ch.pro_name,
    ch.service_name,
    ch.service_id,
    ch.price AS last_price,
    ch.scheduled_at AS last_booked,
    ch.svc_count AS booking_count,
    LEAST(1.0, (ch.svc_count::numeric / 5.0))::numeric(3,2) AS confidence
  FROM client_history ch
  WHERE ch.rn = 1
  ORDER BY ch.svc_count DESC, ch.scheduled_at DESC
  LIMIT 3;
$$;

GRANT EXECUTE ON FUNCTION public.predict_rebook(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.predict_rebook(text) TO service_role;