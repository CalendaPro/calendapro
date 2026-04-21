-- ============================================================
-- CalendaPro — Contrainte d'exclusion + stored procedure atomique
-- ============================================================

-- Extension pour les range types (nécessaire pour EXCLUDE USING gist)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Fonction helper : crée le range temporel d'un booking
CREATE OR REPLACE FUNCTION booking_time_range(
  p_scheduled_at    timestamptz,
  p_duration_minutes integer
)
RETURNS tstzrange
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT tstzrange(
    p_scheduled_at,
    p_scheduled_at + (COALESCE(p_duration_minutes, 60) * interval '1 minute'),
    '[)'  -- inclusif au début, exclusif à la fin
  )
$$;

-- ============================================================
-- ÉTAPE 0 : Cleanup des conflits existants (soft delete des doublons)
-- Certains bookings existants se chevauchent déjà — on garde le plus ancien,
-- on annule (status='cancelled') les autres pour permettre la contrainte.
-- ============================================================

DO $$
DECLARE
  v_conflict record;
  v_kept_id text;
BEGIN
  -- Pour chaque groupe de conflits, garder le plus ancien, annuler les autres
  FOR v_conflict IN
    SELECT b1.id as conflict_id, b1.pro_id, b1.scheduled_at
    FROM public.bookings b1
    JOIN public.bookings b2
      ON b1.pro_id = b2.pro_id
      AND b1.id != b2.id
      AND b1.status NOT IN ('cancelled', 'no_show')
      AND b2.status NOT IN ('cancelled', 'no_show')
      AND booking_time_range(b1.scheduled_at, b1.duration_minutes)
          && booking_time_range(b2.scheduled_at, b2.duration_minutes)
    WHERE b1.created_at > b2.created_at  -- Garder le plus ancien (b2), annuler le plus récent (b1)
  LOOP
    UPDATE public.bookings
    SET status = 'cancelled',
        cancellation_reason = 'Auto-annulé: conflit de créneau détecté lors de la migration',
        updated_at = NOW()
    WHERE id = v_conflict.conflict_id;

    RAISE NOTICE 'Annulation du booking conflit % (pro_id=%, scheduled_at=%)',
      v_conflict.conflict_id, v_conflict.pro_id, v_conflict.scheduled_at;
  END LOOP;
END $$;

-- ============================================================
-- ÉTAPE 1 : Contrainte d'exclusion (empêche les nouveaux conflits)
-- ============================================================

-- NOTE: Si timeout malgré le cleanup, exécuter avec:
-- SET statement_timeout = '5min';
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_time_overlap;

-- Création de l'index GIST d'abord (plus rapide, moins de verrouillage)
CREATE INDEX IF NOT EXISTS idx_bookings_time_gist
  ON public.bookings
  USING gist (pro_id, booking_time_range(scheduled_at, duration_minutes))
  WHERE (status NOT IN ('cancelled', 'no_show'));

-- Puis ajouter la contrainte EXCLUDE (utilise l'index existant)
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_time_overlap
  EXCLUDE USING gist (
    pro_id WITH =,
    booking_time_range(scheduled_at, duration_minutes) WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'))
  DEFERRABLE INITIALLY IMMEDIATE;

-- Stored procedure atomique : vérifie + insère en une seule opération
-- Élimine la race condition entre checkBookingConflict() et l'INSERT
CREATE OR REPLACE FUNCTION create_booking_safe(
  p_pro_id          text,
  p_client_id       text,
  p_client_id_type  text,
  p_service_name    text,
  p_scheduled_at    timestamptz,
  p_duration_mins   integer,
  p_price           numeric      DEFAULT NULL,
  p_deposit_amount  numeric      DEFAULT NULL,
  p_notes           text         DEFAULT NULL,
  p_source_channel  text         DEFAULT 'direct',
  p_pro_name        text         DEFAULT NULL,
  p_pro_username    text         DEFAULT '',
  p_payment_status  text         DEFAULT 'pending',
  p_stripe_session  text         DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  INSERT INTO public.bookings (
    pro_id,
    client_id,
    client_id_type,
    service_name,
    scheduled_at,
    duration_minutes,
    price,
    deposit_amount,
    notes,
    source_channel,
    pro_name,
    pro_username,
    status,
    payment_status,
    stripe_session_id
  )
  VALUES (
    p_pro_id,
    p_client_id,
    p_client_id_type,
    p_service_name,
    p_scheduled_at,
    COALESCE(p_duration_mins, 60),
    p_price,
    p_deposit_amount,
    p_notes,
    p_source_channel,
    p_pro_name,
    p_pro_username,
    'upcoming',
    COALESCE(p_payment_status, 'pending'),
    p_stripe_session
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;

EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'SLOT_CONFLICT'
      USING HINT = 'Ce créneau est déjà occupé par un autre rendez-vous.',
            ERRCODE = 'P0001';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION create_booking_safe TO authenticated, service_role, anon;

-- Accorder les permissions sur la fonction booking_time_range
GRANT EXECUTE ON FUNCTION booking_time_range TO authenticated, service_role, anon;
