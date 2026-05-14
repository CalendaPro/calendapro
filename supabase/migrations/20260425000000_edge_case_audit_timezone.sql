-- ============================================================
-- AUDIT #6 — Edge Case 2: FUSEAUX HORAIRES
-- ============================================================
-- Gestion complète des fuseaux horaires pour pros et clients
-- Toutes les dates stockées en UTC, affichage converti selon le fuseau

-- Ajout du fuseau horaire du pro dans la table profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS time_zone text DEFAULT 'Europe/Paris';

-- Table pour les conversions de fuseau horaire des clients
CREATE TABLE IF NOT EXISTS public.client_timezones (
  client_id text PRIMARY KEY,
  time_zone text NOT NULL DEFAULT 'Europe/Paris',
  detected_from_ip text,
  updated_at timestamptz DEFAULT NOW()
);

-- Fonction pour convertir une date UTC vers le fuseau du pro
CREATE OR REPLACE FUNCTION convert_to_pro_timezone(
  p_utc_time timestamptz,
  p_pro_id text
)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_tz text;
BEGIN
  SELECT time_zone INTO v_tz
  FROM public.profiles
  WHERE id = p_pro_id;
  
  IF v_tz IS NULL THEN
    v_tz := 'Europe/Paris';
  END IF;
  
  RETURN p_utc_time AT TIME ZONE 'UTC' AT TIME ZONE v_tz;
END;
$$;

-- Fonction pour convertir une date du fuseau du pro vers UTC
CREATE OR REPLACE FUNCTION convert_from_pro_timezone(
  p_local_time timestamp,
  p_pro_id text
)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_tz text;
BEGIN
  SELECT time_zone INTO v_tz
  FROM public.profiles
  WHERE id = p_pro_id;
  
  IF v_tz IS NULL THEN
    v_tz := 'Europe/Paris';
  END IF;
  
  RETURN p_local_time AT TIME ZONE v_tz AT TIME ZONE 'UTC';
END;
$$;

-- Fonction pour formater une date dans le fuseau du pro
CREATE OR REPLACE FUNCTION format_in_pro_timezone(
  p_utc_time timestamptz,
  p_pro_id text,
  p_format text DEFAULT 'YYYY-MM-DD HH24:MI'
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_tz text;
  v_result text;
BEGIN
  SELECT time_zone INTO v_tz
  FROM public.profiles
  WHERE id = p_pro_id;
  
  IF v_tz IS NULL THEN
    v_tz := 'Europe/Paris';
  END IF;
  
  EXECUTE format('SELECT TO_CHAR($1 AT TIME ZONE ''UTC'' AT TIME ZONE %L, %L)', v_tz, p_format)
  INTO v_result
  USING p_utc_time;
  
  RETURN v_result;
END;
$$;

-- Vue pour les bookings avec conversion automatique des fuseaux
CREATE OR REPLACE VIEW bookings_with_timezone AS
SELECT 
  b.*,
  p.time_zone as pro_time_zone,
  convert_to_pro_timezone(b.scheduled_at, b.pro_id) as scheduled_at_pro_tz,
  TO_CHAR(convert_to_pro_timezone(b.scheduled_at, b.pro_id), 'YYYY-MM-DD HH24:MI') as formatted_pro_time
FROM public.bookings b
JOIN public.profiles p ON b.pro_id = p.id;

-- Index pour optimiser les requêtes par fuseau horaire
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON public.profiles(time_zone) 
WHERE time_zone IS NOT NULL;

-- Permissions
GRANT EXECUTE ON FUNCTION convert_to_pro_timezone TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION convert_from_pro_timezone TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION format_in_pro_timezone TO authenticated, service_role, anon;
GRANT SELECT ON bookings_with_timezone TO authenticated, service_role, anon;

-- Commentaires
COMMENT ON COLUMN public.profiles.time_zone IS 'Fuseau horaire IANA du pro (ex: Europe/Paris, America/New_York)';
COMMENT ON FUNCTION convert_to_pro_timezone IS 'Convertit une date UTC vers le fuseau horaire du pro';
COMMENT ON FUNCTION convert_from_pro_timezone IS 'Convertit une date locale du pro vers UTC';
