-- ============================================================
-- AUDIT #6 — Edge Case 4: PRO QUI SUPPRIME SON COMPTE
-- ============================================================
-- Soft delete du pro avec gestion automatique des réservations futures

-- Ajout des colonnes de soft delete et statut dans profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' 
    CHECK (account_status IN ('active', 'suspended', 'pending_deletion', 'deleted'));

-- Index pour les requêtes rapides sur les comptes actifs
CREATE INDEX IF NOT EXISTS idx_profiles_active 
  ON public.profiles(id) 
  WHERE deleted_at IS NULL AND account_status = 'active';

-- Index pour la gestion des suppressions programmées
CREATE INDEX IF NOT EXISTS idx_profiles_pending_deletion 
  ON public.profiles(deletion_requested_at) 
  WHERE account_status = 'pending_deletion';

-- Table pour tracer les suppressions de compte
CREATE TABLE IF NOT EXISTS public.account_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id text NOT NULL,
  deleted_at timestamptz DEFAULT NOW(),
  deletion_reason text,
  future_bookings_count integer DEFAULT 0,
  total_refunded_amount integer DEFAULT 0, -- en centimes
  stripe_connect_closed boolean DEFAULT false,
  clients_notified boolean DEFAULT false,
  processed_by text,
  metadata jsonb DEFAULT '{}'
);

-- Table pour les notifications aux clients affectés
CREATE TABLE IF NOT EXISTS public.pro_deletion_client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id text NOT NULL,
  client_id text NOT NULL,
  booking_id text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('email', 'sms', 'push')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT NOW()
);

-- Fonction pour compter les réservations futures d'un pro
CREATE OR REPLACE FUNCTION count_future_paid_bookings(p_pro_id text)
RETURNS TABLE (
  total_count integer,
  paid_count integer,
  total_refund_amount integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_count,
    COUNT(*) FILTER (WHERE b.payment_status = 'paid')::integer as paid_count,
    COALESCE(SUM(b.amount_paid) FILTER (WHERE b.payment_status = 'paid'), 0)::integer as total_refund_amount
  FROM public.bookings b
  WHERE b.pro_id = p_pro_id
    AND b.scheduled_at > NOW()
    AND b.status NOT IN ('cancelled', 'no_show');
END;
$$;

-- Fonction pour demander la suppression de compte (soft delete)
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_pro_id text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats record;
  v_result jsonb;
BEGIN
  -- Vérifier que le pro existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_pro_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil non trouvé');
  END IF;
  
  -- Récupérer les stats des réservations futures
  SELECT * INTO v_stats FROM count_future_paid_bookings(p_pro_id);
  
  -- Marquer le compte comme pending_deletion
  UPDATE public.profiles
  SET 
    account_status = 'pending_deletion',
    deletion_requested_at = NOW(),
    deletion_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_pro_id;
  
  -- Annuler toutes les réservations futures
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    payment_status = CASE 
      WHEN payment_status = 'paid' THEN 'refunded_pending' 
      ELSE payment_status 
    END,
    cancellation_reason = 'Annulation automatique: compte professionnel supprimé',
    notes = COALESCE(notes, '') || E'\n\n[SYSTEM] RDV annulé suite à la suppression du compte pro le ' || NOW(),
    updated_at = NOW()
  WHERE pro_id = p_pro_id
    AND scheduled_at > NOW()
    AND status NOT IN ('cancelled', 'no_show');
  
  -- Désactiver le profil public
  UPDATE public.profiles
  SET is_published = false,
      online_payment_enabled = false
  WHERE id = p_pro_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'future_bookings_cancelled', v_stats.total_count,
    'paid_bookings_to_refund', v_stats.paid_count,
    'total_refund_amount_cents', v_stats.total_refund_amount,
    'deletion_scheduled_at', NOW() + INTERVAL '30 days',
    'message', 'Compte marqué pour suppression. Les clients seront notifiés et remboursés.'
  );
  
  -- Logger
  INSERT INTO public.account_deletion_log (
    pro_id, deletion_reason, future_bookings_count, total_refunded_amount
  ) VALUES (
    p_pro_id, p_reason, v_stats.total_count, v_stats.total_refund_amount
  );
  
  RETURN v_result;
END;
$$;

-- Fonction pour finaliser la suppression (hard delete après 30 jours)
CREATE OR REPLACE FUNCTION finalize_account_deletion(p_pro_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_connect_id text;
BEGIN
  -- Récupérer le stripe_connect_id avant suppression
  SELECT stripe_connect_id INTO v_connect_id
  FROM public.profiles
  WHERE id = p_pro_id;
  
  -- Soft delete: marquer comme deleted
  UPDATE public.profiles
  SET 
    account_status = 'deleted',
    deleted_at = NOW(),
    -- Anonymiser les données personnelles
    full_name = 'Utilisateur supprimé',
    email = NULL,
    phone = NULL,
    username = 'deleted_' || substr(md5(random()::text), 1, 8),
    avatar_url = NULL,
    stripe_connect_id = NULL,
    updated_at = NOW()
  WHERE id = p_pro_id;
  
  -- Note: Le compte Stripe Connect doit être fermé via l'API Stripe
  -- Ce sera fait par un webhook ou une fonction edge
  
  RETURN jsonb_build_object(
    'success', true,
    'pro_id', p_pro_id,
    'stripe_connect_id', v_connect_id,
    'message', 'Compte définitivement supprimé et données anonymisées'
  );
END;
$$;

-- Fonction pour récupérer la liste des clients à notifier
CREATE OR REPLACE FUNCTION get_clients_to_notify_for_deletion(p_pro_id text)
RETURNS TABLE (
  client_id text,
  client_email text,
  client_phone text,
  booking_id text,
  scheduled_at timestamptz,
  amount_paid integer,
  service_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.client_id,
    b.client_email,
    b.client_phone,
    b.id as booking_id,
    b.scheduled_at,
    COALESCE(b.amount_paid, 0)::integer as amount_paid,
    b.service_name
  FROM public.bookings b
  WHERE b.pro_id = p_pro_id
    AND b.scheduled_at > NOW()
    AND b.status = 'cancelled'
    AND b.cancellation_reason ILIKE '%compte professionnel supprimé%';
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION count_future_paid_bookings TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION request_account_deletion TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION finalize_account_deletion TO service_role;
GRANT EXECUTE ON FUNCTION get_clients_to_notify_for_deletion TO service_role;

-- Comments
COMMENT ON COLUMN public.profiles.account_status IS 'Statut du compte: active, suspended, pending_deletion, deleted';
COMMENT ON FUNCTION request_account_deletion IS 'Initie la suppression de compte pro avec annulation auto des RDV futurs';
COMMENT ON FUNCTION finalize_account_deletion IS 'Finalise la suppression après la période de grâce (30 jours)';
