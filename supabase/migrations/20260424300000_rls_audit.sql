-- ══════════════════════════════════════════════════════════════════════════════
-- Audit #3 Sécurité — RLS Audit & Corrections
-- Vérifie et corrige les politiques Row Level Security sur toutes les tables
-- ══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE: profiles (déjà protégée mais on vérifie)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique: utilisateur voit uniquement son profil
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Politique: public peut voir les profils publiés (marketplace)
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Politique: service_role bypass
DROP POLICY IF EXISTS "profiles_service" ON public.profiles;
CREATE POLICY "profiles_service"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABLE: services (nouvelle protection)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Politique: pro gère ses propres services
DROP POLICY IF EXISTS "services_own" ON public.services;
CREATE POLICY "services_own"
  ON public.services
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Politique: public peut voir les services des pros publiés
DROP POLICY IF EXISTS "services_public_read" ON public.services;
CREATE POLICY "services_public_read"
  ON public.services
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = services.user_id
      AND profiles.is_published = true
    )
  );

-- Politique: service_role bypass
DROP POLICY IF EXISTS "services_service" ON public.services;
CREATE POLICY "services_service"
  ON public.services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TABLE: subscriptions (protection critique)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique: utilisateur voit uniquement son abonnement
DROP POLICY IF EXISTS "subscriptions_own" ON public.subscriptions;
CREATE POLICY "subscriptions_own"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Politique: service_role uniquement pour modifications
DROP POLICY IF EXISTS "subscriptions_service" ON public.subscriptions;
CREATE POLICY "subscriptions_service"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TABLE: notification_queue (protection renforcée)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- NOTE: La table notification_queue a une colonne `recipient` (email/téléphone)
-- et non `recipient_id`. Elle est déjà protégée par une policy "Service role only".
-- On garde uniquement le service_role bypass pour les API routes.

DROP POLICY IF EXISTS "notifications_service" ON public.notification_queue;
CREATE POLICY "notifications_service"
  ON public.notification_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. TABLE: client_profiles (protection RGPD)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Politique: client voit son propre profil
DROP POLICY IF EXISTS "client_profiles_own" ON public.client_profiles;
CREATE POLICY "client_profiles_own"
  ON public.client_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Politique: pro voit les profils de SES clients
DROP POLICY IF EXISTS "client_profiles_pro_read" ON public.client_profiles;
CREATE POLICY "client_profiles_pro_read"
  ON public.client_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.client_id = client_profiles.user_id
      AND bookings.pro_id = auth.uid()::text
    )
  );

-- Politique: service_role bypass
DROP POLICY IF EXISTS "client_profiles_service" ON public.client_profiles;
CREATE POLICY "client_profiles_service"
  ON public.client_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. TABLE: reviews (protection anti-manipulation)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politique: client modifie SES reviews
DROP POLICY IF EXISTS "reviews_own" ON public.reviews;
CREATE POLICY "reviews_own"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid()::text)
  WITH CHECK (client_id = auth.uid()::text);

-- Politique: pro voit les reviews sur son profil
DROP POLICY IF EXISTS "reviews_pro_read" ON public.reviews;
CREATE POLICY "reviews_pro_read"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (pro_id = auth.uid()::text);

-- Politique: public lecture
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read"
  ON public.reviews
  FOR SELECT
  TO anon
  USING (true);

-- Politique: service_role bypass
DROP POLICY IF EXISTS "reviews_service" ON public.reviews;
CREATE POLICY "reviews_service"
  ON public.reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. TABLE: favorites (protection)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Politique: client gère SES favoris
DROP POLICY IF EXISTS "favorites_own" ON public.favorites;
CREATE POLICY "favorites_own"
  ON public.favorites
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid()::text)
  WITH CHECK (client_id = auth.uid()::text);

-- Politique: service_role bypass
DROP POLICY IF EXISTS "favorites_service" ON public.favorites;
CREATE POLICY "favorites_service"
  ON public.favorites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. TABLE: search_history (protection RGPD)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Politique: utilisateur voit SON historique
-- NOTE: search_history a une colonne `client_id` pas `user_id`
DROP POLICY IF EXISTS "search_history_own" ON public.search_history;
CREATE POLICY "search_history_own"
  ON public.search_history
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid()::text)
  WITH CHECK (client_id = auth.uid()::text);

-- Politique: service_role bypass
DROP POLICY IF EXISTS "search_history_service" ON public.search_history;
CREATE POLICY "search_history_service"
  ON public.search_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. TABLE: pulse_settings (protection données sensibles)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pulse_settings ENABLE ROW LEVEL SECURITY;

-- Politique: pro gère SES settings
DROP POLICY IF EXISTS "pulse_settings_own" ON public.pulse_settings;
CREATE POLICY "pulse_settings_own"
  ON public.pulse_settings
  FOR ALL
  TO authenticated
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

-- Politique: service_role bypass
DROP POLICY IF EXISTS "pulse_settings_service" ON public.pulse_settings;
CREATE POLICY "pulse_settings_service"
  ON public.pulse_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. TABLE: pulse_pricing_rules (protection données sensibles)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pulse_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Politique: pro gère SES règles
DROP POLICY IF EXISTS "pulse_pricing_own" ON public.pulse_pricing_rules;
CREATE POLICY "pulse_pricing_own"
  ON public.pulse_pricing_rules
  FOR ALL
  TO authenticated
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

-- Politique: service_role bypass
DROP POLICY IF EXISTS "pulse_pricing_service" ON public.pulse_pricing_rules;
CREATE POLICY "pulse_pricing_service"
  ON public.pulse_pricing_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. TABLE: waitlist (protection)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Politique: admin uniquement (table sensible)
DROP POLICY IF EXISTS "waitlist_service" ON public.waitlist;
CREATE POLICY "waitlist_service"
  ON public.waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

--- ═══════════════════════════════════════════════════════════════════════════════
-- 12. TABLE: pulse_reminder_log (déjà protégée dans pulse_engine.sql)
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: La table s'appelle `pulse_reminder_log` pas `reminder_logs`
-- Elle a déjà des RLS policies dans 20260411000000_pulse_engine.sql
-- SKIP: Déjà protégée

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. TABLE: webhook_retry_queue (SKIP: créée dans 20260424200000_webhook_retry_queue.sql)
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Cette table est créée dans une migration séparée.
-- Les RLS policies doivent être ajoutées après création de la table.
-- SKIP pour éviter l'erreur "relation does not exist".

-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. TABLE: failed_refunds (SKIP: table n'existe pas encore)
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Table à créer dans une future migration si besoin
-- SKIP pour éviter l'erreur "relation does not exist".

--- ═══════════════════════════════════════════════════════════════════════════════
-- 15. TABLE: avatar_generations (protection) — SKIP: table n'existe pas encore
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Cette table sera créée dans une future migration
-- Pour l'instant, on skip cette section

--- ═══════════════════════════════════════════════════════════════════════════════
-- 16. TABLE: client_onboarding_responses (protection données onboarding)
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: La table s'appelle client_onboarding_responses pas onboarding_tracking
-- Elle a déjà des RLS policies définies dans sa migration d'origine
-- On ajoute juste le service_role bypass ici

ALTER TABLE public.client_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Politique: service_role bypass (en plus des policies existantes)
DROP POLICY IF EXISTS "onboarding_service" ON public.client_onboarding_responses;
CREATE POLICY "onboarding_service"
  ON public.client_onboarding_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FONCTIONS AUXILIAIRES DE SÉCURITÉ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Fonction pour vérifier si un utilisateur est admin (à personnaliser)
CREATE OR REPLACE FUNCTION public.is_admin(user_id text)
RETURNS boolean AS $$
BEGIN
  -- À personnaliser selon votre logique admin
  -- Exemple: vérifier une liste d'emails admins dans une table admin_users
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE — Log des tables protégées
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '═══ RLS AUDIT #3 — Tables avec RLS activé ═══';
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'services', 'bookings', 'subscriptions', 'client_profiles',
      'reviews', 'favorites', 'search_history', 'notification_queue',
      'pulse_settings', 'pulse_pricing_rules', 'pulse_reminder_log', 'waitlist',
      'client_onboarding_responses', 'client_transactions', 'refund_requests',
      'payout_notifications', 'webhook_events_log', 'calendar_connections',
      'sync_logs', 'blocked_slots', 'connect_transactions'
    )
    AND EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = tablename
      AND c.relrowsecurity = true
    )
  LOOP
    RAISE NOTICE '✅ RLS activé: %', r.tablename;
  END LOOP;
END $$;
