-- ============================================================
-- AUDIT #6 — Edge Case 7: CRÉNEAU PRIS ENTRE SÉLECTION ET PAIEMENT
-- ============================================================
-- Système de "slot hold" - Réservation temporaire avec expiration

-- Table des créneaux temporairement réservés
CREATE TABLE IF NOT EXISTS public.slot_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id text NOT NULL,
  client_id text,
  client_email text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'
);

-- Index unique partiel: un seul hold actif par créneau par pro
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot_hold
  ON public.slot_holds(pro_id, scheduled_at)
  WHERE status = 'active';

-- Index pour nettoyage rapide des holds expirés
CREATE INDEX IF NOT EXISTS idx_slot_holds_expires 
  ON public.slot_holds(expires_at) 
  WHERE status = 'active';

-- Index pour rechercher par session Stripe
CREATE INDEX IF NOT EXISTS idx_slot_holds_session 
  ON public.slot_holds(stripe_session_id) 
  WHERE stripe_session_id IS NOT NULL;

-- Fonction pour créer un hold sur un créneau
CREATE OR REPLACE FUNCTION create_slot_hold(
  p_pro_id text,
  p_client_id text,
  p_client_email text,
  p_scheduled_at timestamptz,
  p_duration_minutes integer DEFAULT 60,
  p_hold_duration_minutes integer DEFAULT 15, -- Durée du hold par défaut
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hold_id uuid;
  v_expires_at timestamptz;
  v_existing_booking_id text;
BEGIN
  -- Vérifier si le créneau est déjà booké (non cancelled)
  SELECT id INTO v_existing_booking_id
  FROM public.bookings
  WHERE pro_id = p_pro_id
    AND scheduled_at = p_scheduled_at
    AND status NOT IN ('cancelled', 'no_show')
  LIMIT 1;
  
  IF v_existing_booking_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SLOT_ALREADY_BOOKED',
      'message', 'Ce créneau est déjà réservé'
    );
  END IF;
  
  -- Calculer l'expiration
  v_expires_at := NOW() + (p_hold_duration_minutes || ' minutes')::interval;
  
  -- Essayer de créer le hold
  BEGIN
    INSERT INTO public.slot_holds (
      pro_id, client_id, client_email, scheduled_at, 
      duration_minutes, expires_at, metadata
    ) VALUES (
      p_pro_id, p_client_id, p_client_email, p_scheduled_at,
      p_duration_minutes, v_expires_at, p_metadata
    )
    RETURNING id INTO v_hold_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'hold_id', v_hold_id,
      'expires_at', v_expires_at,
      'expires_in_seconds', EXTRACT(EPOCH FROM (v_expires_at - NOW()))::integer,
      'message', 'Créneau réservé temporairement'
    );
    
  EXCEPTION WHEN unique_violation THEN
    -- Un autre hold actif existe déjà sur ce créneau
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SLOT_ON_HOLD',
      'message', 'Ce créneau est temporairement réservé par un autre client'
    );
  END;
END;
$$;

-- Fonction pour vérifier si un créneau est disponible (vérifie bookings + holds)
CREATE OR REPLACE FUNCTION is_slot_available(
  p_pro_id text,
  p_scheduled_at timestamptz,
  p_duration_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_existing_booking_id text;
  v_active_hold record;
BEGIN
  -- Vérifier les bookings confirmés
  SELECT id INTO v_existing_booking_id
  FROM public.bookings
  WHERE pro_id = p_pro_id
    AND scheduled_at = p_scheduled_at
    AND status NOT IN ('cancelled', 'no_show')
  LIMIT 1;
  
  IF v_existing_booking_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'BOOKED',
      'booking_id', v_existing_booking_id,
      'message', 'Ce créneau est déjà réservé'
    );
  END IF;
  
  -- Vérifier les holds actifs
  SELECT * INTO v_active_hold
  FROM public.slot_holds
  WHERE pro_id = p_pro_id
    AND scheduled_at = p_scheduled_at
    AND status = 'active'
    AND expires_at > NOW()
  LIMIT 1;
  
  IF v_active_hold.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'ON_HOLD',
      'hold_id', v_active_hold.id,
      'expires_at', v_active_hold.expires_at,
      'expires_in_seconds', GREATEST(0, EXTRACT(EPOCH FROM (v_active_hold.expires_at - NOW()))::integer),
      'message', 'Ce créneau est temporairement réservé'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'available', true,
    'message', 'Créneau disponible'
  );
END;
$$;

-- Fonction pour convertir un hold en booking (appelée par le webhook Stripe)
CREATE OR REPLACE FUNCTION convert_hold_to_booking(
  p_hold_id uuid,
  p_stripe_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hold record;
  v_booking record;
BEGIN
  -- Récupérer le hold
  SELECT * INTO v_hold
  FROM public.slot_holds
  WHERE id = p_hold_id AND status = 'active';
  
  IF v_hold.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'HOLD_NOT_FOUND_OR_EXPIRED',
      'message', 'La réservation temporaire a expiré ou n''existe pas'
    );
  END IF;
  
  -- Vérifier qu'il n'est pas expiré
  IF v_hold.expires_at < NOW() THEN
    -- Marquer comme expiré
    UPDATE public.slot_holds 
    SET status = 'expired' 
    WHERE id = p_hold_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'HOLD_EXPIRED',
      'message', 'La réservation temporaire a expiré'
    );
  END IF;
  
  -- Créer le booking (utilise create_booking_safe qui gère les conflits)
  BEGIN
    SELECT * INTO v_booking
    FROM create_booking_safe(
      v_hold.pro_id,
      COALESCE(v_hold.client_id, v_hold.client_email),
      CASE 
        WHEN v_hold.client_id IS NULL THEN 'email'
        WHEN v_hold.client_id LIKE 'user_%' THEN 'clerk_uid'
        ELSE 'email'
      END,
      'Réservation en ligne', -- service_name sera mis à jour par le webhook
      v_hold.scheduled_at,
      v_hold.duration_minutes,
      NULL, -- price
      NULL, -- deposit_amount
      NULL, -- notes
      'online',
      NULL, -- pro_name
      '', -- pro_username
      'paid',
      p_stripe_session_id
    );
    
    -- Marquer le hold comme complété
    UPDATE public.slot_holds 
    SET 
      status = 'completed',
      stripe_session_id = p_stripe_session_id,
      completed_at = NOW()
    WHERE id = p_hold_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'booking_id', v_booking.id,
      'message', 'Réservation confirmée'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur (conflit, etc), on laisse le hold expirer naturellement
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'message', 'Erreur lors de la création du booking'
    );
  END;
END;
$$;

-- Fonction pour nettoyer les holds expirés (à appeler par un cron toutes les minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS TABLE (expired_count integer, cancelled_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired integer := 0;
  v_cancelled integer := 0;
BEGIN
  -- Marquer comme expirés les holds dépassés
  WITH expired AS (
    UPDATE public.slot_holds
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expired FROM expired;
  
  -- Supprimer les vieux holds (plus de 24h)
  WITH deleted AS (
    DELETE FROM public.slot_holds
    WHERE status IN ('expired', 'cancelled')
      AND updated_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cancelled FROM deleted;
  
  RETURN QUERY SELECT v_expired, v_cancelled;
END;
$$;

-- Vue pour le monitoring des holds actifs
CREATE OR REPLACE VIEW active_slot_holds_monitoring AS
SELECT 
  h.*,
  EXTRACT(EPOCH FROM (h.expires_at - NOW()))::integer as seconds_remaining,
  CASE 
    WHEN h.expires_at < NOW() THEN 'EXPIRED'
    WHEN h.expires_at < NOW() + INTERVAL '2 minutes' THEN 'EXPIRING_SOON'
    ELSE 'ACTIVE'
  END as hold_status
FROM public.slot_holds h
WHERE h.status = 'active';

-- Permissions
GRANT EXECUTE ON FUNCTION create_slot_hold TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION is_slot_available TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION convert_hold_to_booking TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_holds TO service_role;
GRANT SELECT ON active_slot_holds_monitoring TO authenticated, service_role;

-- Comments
COMMENT ON TABLE public.slot_holds IS 'Créneaux temporairement réservés pendant le processus de paiement';
COMMENT ON FUNCTION create_slot_hold IS 'Crée une réservation temporaire d''un créneau (15 min par défaut)';
COMMENT ON FUNCTION is_slot_available IS 'Vérifie si un créneau est disponible (vérifie bookings et holds)';
COMMENT ON FUNCTION convert_hold_to_booking IS 'Convertit un hold en booking confirmé après paiement';
