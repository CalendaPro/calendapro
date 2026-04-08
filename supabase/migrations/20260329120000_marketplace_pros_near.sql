-- PostGIS: distance utilisateur → chaque profil géolocalisé
-- Exécuter dans Supabase SQL Editor si les migrations ne sont pas appliquées automatiquement.
-- Prérequis: extension postgis activée sur le projet.

DROP FUNCTION IF EXISTS public.marketplace_pros_near(double precision, double precision);

CREATE OR REPLACE FUNCTION public.marketplace_pros_near(
  user_lat double precision,
  user_lng double precision
)
RETURNS TABLE (
  profile_id uuid,
  distance_m double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id AS profile_id,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    )::double precision AS distance_m
  FROM public.profiles p
  WHERE p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.username IS NOT NULL
    AND p.full_name IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.marketplace_pros_near(double precision, double precision) TO anon;
GRANT EXECUTE ON FUNCTION public.marketplace_pros_near(double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_pros_near(double precision, double precision) TO service_role;