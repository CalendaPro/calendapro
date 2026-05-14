-- ============================================================
-- AUDIT #6 — Edge Case 8: LIMITES DU PLAN STARTER (20 RDV/mois)
-- ============================================================
-- Compteur mensuel avec reset automatique

-- Fonction pour compter les bookings du mois en cours (respecte le fuseau du pro)
CREATE OR REPLACE FUNCTION count_monthly_bookings(
  p_pro_id text,
  p_reference_date timestamptz DEFAULT NOW()
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_tz text;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_count integer;
BEGIN
  -- Récupérer le fuseau du pro
  SELECT COALESCE(time_zone, 'Europe/Paris') INTO v_tz
  FROM public.profiles
  WHERE id = p_pro_id;
  
  -- Calculer le début et fin du mois dans le fuseau du pro
  v_month_start := DATE_TRUNC('month', p_reference_date AT TIME ZONE v_tz) AT TIME ZONE v_tz AT TIME ZONE 'UTC';
  v_month_end := (DATE_TRUNC('month', p_reference_date AT TIME ZONE v_tz) + INTERVAL '1 month') AT TIME ZONE v_tz AT TIME ZONE 'UTC';
  
  -- Compter les bookings créés ce mois-ci (pas les RDV programmés, mais les créations)
  SELECT COUNT(*)::integer INTO v_count
  FROM public.bookings
  WHERE pro_id = p_pro_id
    AND created_at >= v_month_start
    AND created_at < v_month_end;
  
  RETURN v_count;
END;
$$;

-- Fonction pour vérifier si le pro peut créer un nouveau booking
CREATE OR REPLACE FUNCTION can_create_booking(
  p_pro_id text,
  p_plan text DEFAULT 'free'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_limit integer;
  v_remaining integer;
  v_reset_date timestamptz;
  v_tz text;
BEGIN
  -- Définir la limite selon le plan
  v_limit := CASE p_plan
    WHEN 'free' THEN 20
    WHEN 'premium' THEN 999999
    WHEN 'infinity' THEN 999999
    ELSE 20
  END;
  
  -- Si plan illimité, retourner succès immédiat
  IF v_limit >= 999999 THEN
    RETURN jsonb_build_object(
      'can_create', true,
      'plan', p_plan,
      'limit', 'unlimited',
      'used', 0,
      'remaining', 999999,
      'reset_at', NULL
    );
  END IF;
  
  -- Compter les bookings du mois
  v_count := count_monthly_bookings(p_pro_id);
  v_remaining := GREATEST(0, v_limit - v_count);
  
  -- Calculer la date de reset (1er du mois prochain)
  SELECT COALESCE(time_zone, 'Europe/Paris') INTO v_tz
  FROM public.profiles
  WHERE id = p_pro_id;
  
  v_reset_date := (DATE_TRUNC('month', NOW() AT TIME ZONE v_tz) + INTERVAL '1 month') AT TIME ZONE v_tz AT TIME ZONE 'UTC';
  
  RETURN jsonb_build_object(
    'can_create', v_count < v_limit,
    'plan', p_plan,
    'limit', v_limit,
    'used', v_count,
    'remaining', v_remaining,
    'reset_at', v_reset_date,
    'message', CASE 
      WHEN v_count >= v_limit THEN format('Limite atteinte: %s/%s RDV ce mois. Prochain reset le %s', v_count, v_limit, TO_CHAR(v_reset_date, 'YYYY-MM-DD'))
      ELSE format('%s/%s RDV ce mois. Il vous reste %s RDV.', v_count, v_limit, v_remaining)
    END
  );
END;
$$;

-- Fonction pour créer un booking avec vérification de limite atomique
CREATE OR REPLACE FUNCTION create_booking_with_limit_check(
  p_pro_id text,
  p_client_id text,
  p_client_id_type text,
  p_service_name text,
  p_scheduled_at timestamptz,
  p_duration_mins integer DEFAULT 60,
  p_price numeric DEFAULT NULL,
  p_deposit_amount numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_source_channel text DEFAULT 'direct',
  p_pro_name text DEFAULT NULL,
  p_pro_username text DEFAULT '',
  p_payment_status text DEFAULT 'pending',
  p_stripe_session text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
  v_limit_check jsonb;
  v_booking record;
BEGIN
  -- Récupérer le plan du pro
  SELECT COALESCE(s.plan, 'free') INTO v_plan
  FROM public.subscriptions s
  WHERE s.user_id = p_pro_id AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;
  
  -- Vérifier la limite
  v_limit_check := can_create_booking(p_pro_id, v_plan);
  
  IF NOT (v_limit_check->>'can_create')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PLAN_LIMIT_EXCEEDED',
      'details', v_limit_check
    );
  END IF;
  
  -- Créer le booking via create_booking_safe
  BEGIN
    SELECT * INTO v_booking
    FROM create_booking_safe(
      p_pro_id, p_client_id, p_client_id_type, p_service_name,
      p_scheduled_at, p_duration_mins, p_price, p_deposit_amount,
      p_notes, p_source_channel, p_pro_name, p_pro_username,
      p_payment_status, p_stripe_session
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'booking', row_to_json(v_booking),
      'limit_info', v_limit_check
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
  END;
END;
$$;

-- Vue pour le dashboard: usage du plan par pro
CREATE OR REPLACE VIEW plan_usage_dashboard AS
SELECT 
  p.id as pro_id,
  p.full_name,
  COALESCE(s.plan, 'free') as current_plan,
  s.status as subscription_status,
  count_monthly_bookings(p.id) as bookings_this_month,
  CASE COALESCE(s.plan, 'free')
    WHEN 'free' THEN 20
    ELSE 999999
  END as monthly_limit,
  GREATEST(0, CASE COALESCE(s.plan, 'free')
    WHEN 'free' THEN 20 - count_monthly_bookings(p.id)
    ELSE 999999
  END) as remaining_bookings,
  (DATE_TRUNC('month', NOW() AT TIME ZONE COALESCE(p.time_zone, 'Europe/Paris')) + INTERVAL '1 month') 
    AT TIME ZONE COALESCE(p.time_zone, 'Europe/Paris') AT TIME ZONE 'UTC' as next_reset_at
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
WHERE p.deleted_at IS NULL;

-- Trigger pour notifier quand la limite est atteinte (80% et 100%)
CREATE OR REPLACE FUNCTION notify_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
  v_count integer;
  v_limit integer;
  v_threshold_80 integer;
BEGIN
  -- Récupérer le plan
  SELECT COALESCE(s.plan, 'free') INTO v_plan
  FROM public.subscriptions s
  WHERE s.user_id = NEW.pro_id AND s.status = 'active'
  LIMIT 1;
  
  IF v_plan = 'free' THEN
    v_limit := 20;
    v_count := count_monthly_bookings(NEW.pro_id);
    v_threshold_80 := (v_limit * 0.8)::integer;
    
    -- TODO: Insérer dans une table de notifications ou appeler une fonction
    -- Pour l'instant, on log seulement
    IF v_count = v_limit THEN
      RAISE NOTICE 'Plan limit 100%% reached for pro %', NEW.pro_id;
    ELSIF v_count = v_threshold_80 THEN
      RAISE NOTICE 'Plan limit 80%% reached for pro %', NEW.pro_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trg_notify_plan_limit ON public.bookings;
CREATE TRIGGER trg_notify_plan_limit
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_plan_limit();

-- Permissions
GRANT EXECUTE ON FUNCTION count_monthly_bookings TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION can_create_booking TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION create_booking_with_limit_check TO authenticated, service_role, anon;
GRANT SELECT ON plan_usage_dashboard TO authenticated, service_role;

-- Comments
COMMENT ON FUNCTION count_monthly_bookings IS 'Compte les bookings créés dans le mois en cours selon le fuseau horaire du pro';
COMMENT ON FUNCTION can_create_booking IS 'Vérifie si le pro peut créer un booking selon les limites de son plan';
COMMENT ON FUNCTION create_booking_with_limit_check IS 'Crée un booking avec vérification atomique des limites de plan';
