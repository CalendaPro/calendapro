-- ============================================================
-- CalendaPro — Enrichir notification_queue pour le retry
-- ============================================================

-- Colonnes de retry (si notification_queue existe déjà)
ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS retry_count  integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries  integer     DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_error   text        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sent_at      timestamptz DEFAULT NULL;

-- Constraint : retry_count ne dépasse pas max_retries
ALTER TABLE public.notification_queue
  DROP CONSTRAINT IF EXISTS notif_retry_count_check;
ALTER TABLE public.notification_queue
  ADD CONSTRAINT notif_retry_count_check
  CHECK (retry_count >= 0 AND retry_count <= max_retries);

-- Index pour le cron : notifs éligibles au traitement
CREATE INDEX IF NOT EXISTS idx_notification_cron
  ON public.notification_queue(status, next_retry_at, retry_count)
  WHERE status IN ('pending', 'failed');

-- Index par booking_id (pour les updates après envoi)
CREATE INDEX IF NOT EXISTS idx_notification_booking
  ON public.notification_queue(booking_id);
