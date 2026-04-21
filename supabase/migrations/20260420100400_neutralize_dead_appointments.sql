-- ============================================================
-- CalendaPro — Neutraliser les références à la table appointments
-- La table appointments est MORTE. Les fonctions et triggers
-- qui la référencent doivent être supprimés.
-- ============================================================

-- CORRECTION: Le trigger est sur bookings, pas appointments!
-- Supprimer d'abord le trigger qui dépend de la fonction
DROP TRIGGER IF EXISTS trg_update_acquisition_metrics ON bookings;

-- Puis supprimer le trigger sur appointments si existe (table morte)
DROP TRIGGER IF EXISTS trg_update_acquisition_metrics ON appointments;

-- Supprimer TOUTES les variantes existantes (anciennes UUID et nouvelles text)
-- Anciennes signatures (table appointments avec UUID)
DROP FUNCTION IF EXISTS calculate_ltv_by_source(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_acquisition_trends(UUID, INTEGER);

-- Nouvelles signatures existantes (créées précédemment avec mauvais type retour)
DROP FUNCTION IF EXISTS calculate_ltv_by_source(text, integer);
DROP FUNCTION IF EXISTS get_acquisition_trends(text, integer);

-- CASCADE pour forcer la suppression malgré les dépendances restantes
DROP FUNCTION IF EXISTS update_acquisition_metrics() CASCADE;

-- Recréer calculate_ltv_by_source sur bookings
CREATE OR REPLACE FUNCTION calculate_ltv_by_source(
  p_pro_id text,
  p_days   integer DEFAULT 90
)
RETURNS TABLE (
  source_channel  text,
  client_count    bigint,
  booking_count   bigint,
  total_revenue   numeric,
  average_basket  numeric,
  retention_rate  integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(b.source_channel, 'direct') AS source_channel,
    COUNT(DISTINCT b.client_id)           AS client_count,
    COUNT(*)                              AS booking_count,
    COALESCE(SUM(
      CASE
        WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0)
        ELSE COALESCE(b.deposit_amount, 0)
      END
    ), 0)                                 AS total_revenue,
    COALESCE(AVG(
      CASE
        WHEN b.payment_status = 'paid' THEN b.price
        ELSE b.deposit_amount
      END
    ), 0)                                 AS average_basket,
    0                                     AS retention_rate
  FROM public.bookings b
  WHERE b.pro_id = p_pro_id
    AND b.created_at >= NOW() - (p_days * INTERVAL '1 day')
    AND b.status NOT IN ('cancelled', 'no_show')
  GROUP BY COALESCE(b.source_channel, 'direct')
  ORDER BY total_revenue DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_ltv_by_source TO authenticated, service_role;

-- Recréer get_acquisition_trends sur bookings
CREATE OR REPLACE FUNCTION get_acquisition_trends(
  p_pro_id text,
  p_days   integer DEFAULT 30
)
RETURNS TABLE (
  date           date,
  source_channel text,
  client_count   bigint,
  revenue        numeric,
  new_clients    bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(b.created_at)                    AS date,
    COALESCE(b.source_channel, 'direct')  AS source_channel,
    COUNT(DISTINCT b.client_id)           AS client_count,
    COALESCE(SUM(
      CASE
        WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0)
        ELSE COALESCE(b.deposit_amount, 0)
      END
    ), 0)                                 AS revenue,
    COUNT(DISTINCT b.client_id)           AS new_clients
  FROM public.bookings b
  WHERE b.pro_id = p_pro_id
    AND b.created_at >= NOW() - (p_days * INTERVAL '1 day')
    AND b.status NOT IN ('cancelled', 'no_show')
  GROUP BY DATE(b.created_at), COALESCE(b.source_channel, 'direct')
  ORDER BY date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_acquisition_trends TO authenticated, service_role;
