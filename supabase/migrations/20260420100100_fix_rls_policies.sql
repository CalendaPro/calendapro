-- ============================================================
-- CalendaPro — Correction RLS policies bookings
-- ============================================================

-- S'assurer que RLS est activé
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les policies existantes sur bookings
-- pour repartir d'une base propre
DROP POLICY IF EXISTS "client read own bookings" ON public.bookings;
DROP POLICY IF EXISTS "client_read_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "client_read_own_bookings_v2" ON public.bookings;
DROP POLICY IF EXISTS "pro read own bookings" ON public.bookings;
DROP POLICY IF EXISTS "pro_read_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "client insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "client_insert_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "client update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "client_update_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "client_update_own_bookings_v2" ON public.bookings;
DROP POLICY IF EXISTS "pro write own bookings" ON public.bookings;
DROP POLICY IF EXISTS "pro_write_own_bookings" ON public.bookings;
DROP POLICY IF EXISTS "service_role_all" ON public.bookings;

-- ── POLICY 1 : Service role bypass (API routes avec service_role key)
-- Les API routes Next.js utilisent createServerSupabaseClient() avec
-- service_role key → bypass complet du RLS → pas de policy needed
-- Mais on l'ajoute explicitement pour clarté
CREATE POLICY "service_role_bypass"
  ON public.bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── POLICY 2 : Pro lit ses propres bookings
CREATE POLICY "pro_read_own_bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (pro_id = auth.uid()::text);

-- ── POLICY 3 : Pro écrit / modifie ses propres bookings
CREATE POLICY "pro_write_own_bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

-- ── POLICY 4 : Client lit SES bookings (Clerk userId OU email)
CREATE POLICY "client_read_own_bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    -- Client connecté avec son Clerk userId
    client_id = auth.uid()::text
    OR
    -- Client qui avait réservé avec son email (booking anonyme)
    (
      client_id_type = 'email'
      AND client_id = COALESCE(auth.jwt() ->> 'email', 'NOEMAIL')
      AND auth.jwt() ->> 'email' IS NOT NULL
    )
  );

-- ── POLICY 5 : Client peut ANNULER ses bookings (UPDATE limité)
-- Le CHECK s'assure qu'on ne peut modifier que vers 'cancelled'
-- et seulement si le RDV est dans le futur avec délai de 24h
CREATE POLICY "client_cancel_own_bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()::text
    OR (
      client_id_type = 'email'
      AND client_id = COALESCE(auth.jwt() ->> 'email', 'NOEMAIL')
    )
  )
  WITH CHECK (
    status = 'cancelled'
    AND scheduled_at > now() + interval '24 hours'
  );

-- ── POLICY 6 : Client peut créer une réservation
CREATE POLICY "client_insert_bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()::text
    OR client_id_type IN ('email', 'temp')
  );

-- Permettre les inserts anonymes (réservation sans compte)
-- pour les flux marketplace public
CREATE POLICY "anon_insert_bookings"
  ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (client_id_type IN ('email', 'temp'));
