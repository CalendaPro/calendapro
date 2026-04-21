-- Migration: auto_confirm_bookings + notification_queue
-- Date: 2026-04-16

-- 1. Ajouter la colonne auto_confirm_bookings sur les profils
--    true = RDV confirmés automatiquement (upcoming)
--    false = RDV en attente de validation manuelle (pending)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auto_confirm_bookings boolean NOT NULL DEFAULT true;

-- 2. Table de queue des notifications (non-bloquante)
--    Les emails/SMS sont insérés ici et traités par un cron séparé,
--    jamais en ligne lors de la création du RDV.
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('pro_email', 'client_email', 'client_sms')),
  recipient text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempts int NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour le cron : récupérer rapidement les notifications en attente
CREATE INDEX IF NOT EXISTS notification_queue_pending_idx
  ON notification_queue (status, created_at)
  WHERE status = 'pending';

-- 3. RLS sur notification_queue (accès service role uniquement)
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON notification_queue
  USING (false);
