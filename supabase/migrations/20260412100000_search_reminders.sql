-- ============================================================
-- CalendaPro — Search history + Reminder settings
-- ============================================================

-- ── SEARCH HISTORY ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.search_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    text        NOT NULL,
  query        text        NOT NULL,
  results_count int,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_history_client_id_idx ON public.search_history(client_id);
CREATE INDEX IF NOT EXISTS search_history_created_idx   ON public.search_history(client_id, created_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client manage own search history" ON public.search_history;
CREATE POLICY "client manage own search history"
  ON public.search_history FOR ALL
  USING (client_id = auth.uid()::text)
  WITH CHECK (client_id = auth.uid()::text);

-- ── REMINDER SETTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  client_id         text    PRIMARY KEY,
  email_24h         boolean NOT NULL DEFAULT true,
  email_1h          boolean NOT NULL DEFAULT false,
  sms_24h           boolean NOT NULL DEFAULT false,
  sms_1h            boolean NOT NULL DEFAULT false,
  sms_phone         text,
  push_notifications boolean NOT NULL DEFAULT true,
  email_frequency   text    NOT NULL DEFAULT 'immediate'
    CHECK (email_frequency IN ('immediate','daily','off')),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client manage own reminder settings" ON public.reminder_settings;
CREATE POLICY "client manage own reminder settings"
  ON public.reminder_settings FOR ALL
  USING (client_id = auth.uid()::text)
  WITH CHECK (client_id = auth.uid()::text);

-- ── BOOKINGS: add reminder flags ──────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_sent_24h  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_sent_1h   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_sent  boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS bookings_reminder_24h_idx ON public.bookings(scheduled_at, reminder_sent_24h)
  WHERE status = 'upcoming';
