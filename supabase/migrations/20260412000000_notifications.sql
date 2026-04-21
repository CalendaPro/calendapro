-- ============================================================
-- CalendaPro — Notifications in-app
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,
  type       text        NOT NULL
    CHECK (type IN ('booking_confirmed','booking_cancelled','reminder_24h','review_request','pro_update','system')),
  title      text        NOT NULL,
  message    text,
  read       boolean     NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx    ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user read own notifications" ON public.notifications;
CREATE POLICY "user read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "user update own notifications" ON public.notifications;
CREATE POLICY "user update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "service role insert notifications" ON public.notifications;
CREATE POLICY "service role insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
