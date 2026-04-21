-- ============================================================
-- CalendaPro — Fix FK cassée + colonnes manquantes
-- ORDRE CRITIQUE : exécuter en une seule transaction
-- ============================================================

BEGIN;

-- 1. Supprimer la FK incompatible avec le dual-type client_id
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_client_profiles_fkey;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_client_fk;

-- 2. Ajouter la colonne discriminante client_id_type
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS client_id_type text
  NOT NULL DEFAULT 'unknown';

-- 3. Ajouter la contrainte CHECK après la colonne créée
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_client_id_type_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_client_id_type_check
  CHECK (client_id_type IN ('clerk_uid', 'email', 'temp', 'unknown'));

-- 4. Backfill : classer les client_id existants
UPDATE public.bookings
SET client_id_type =
  CASE
    WHEN client_id LIKE 'user_%' THEN 'clerk_uid'
    WHEN client_id LIKE '%@%.%'
      AND client_id NOT LIKE 'temp_%'
      AND client_id NOT LIKE 'user_%'
      THEN 'email'
    WHEN client_id LIKE 'temp_%' THEN 'temp'
    ELSE 'unknown'
  END
WHERE client_id IS NOT NULL;

-- 5. Colonnes de paiement manquantes
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deposit_percent numeric(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_session_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason text DEFAULT NULL;

-- 6. Colonne source_channel si absente (certaines migrations l'ajoutent, d'autres non)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source_channel text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_source text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_medium text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_campaign text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referrer_url text DEFAULT NULL;

-- 7. Ajouter 'pending' au CHECK constraint du status si absent
-- D'abord vérifier et recréer le constraint
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('upcoming', 'pending', 'completed', 'cancelled', 'no_show'));

-- 8. Index pour les recherches par type de client_id
CREATE INDEX IF NOT EXISTS idx_bookings_client_email
  ON public.bookings(client_id)
  WHERE client_id_type = 'email';

CREATE INDEX IF NOT EXISTS idx_bookings_client_clerk
  ON public.bookings(client_id)
  WHERE client_id_type = 'clerk_uid';

-- 9. Index pour Stripe
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session
  ON public.bookings(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

COMMIT;
