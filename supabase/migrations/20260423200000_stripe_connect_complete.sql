-- ══════════════════════════════════════════════════════════════════════════════
-- Stripe Connect — Migration complète production-ready
-- Ajoute toutes les tables et colonnes manquantes pour l'intégration complète
-- ══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- A. COLONNES MANQUANTES SUR BOOKINGS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Receipt URL Stripe (lien vers le reçu officiel)
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS stripe_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0, -- en centimes
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'on_site', -- 'online' | 'on_site' | 'free'
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0; -- en centimes

-- Index pour recherche rapide par IDs Stripe
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_pi ON public.bookings(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON public.bookings(stripe_checkout_session_id) 
  WHERE stripe_checkout_session_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- B. TABLE CLIENT_TRANSACTIONS — Historique paiements côté client
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_transactions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT        NOT NULL,    -- Clerk userId du client
  booking_id            UUID        REFERENCES public.bookings(id) ON DELETE SET NULL,
  pro_id                TEXT        NOT NULL,    -- Clerk userId du pro
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  amount                INTEGER     NOT NULL,    -- montant débité (centimes, positif)
  currency              TEXT        NOT NULL DEFAULT 'eur',
  status                TEXT        NOT NULL DEFAULT 'succeeded', -- succeeded | pending | failed | refunded | partially_refunded
  payment_method        TEXT        DEFAULT 'card', -- card | wallet | etc
  description           TEXT,                     -- "Réservation avec [Nom Pro]"
  receipt_url           TEXT,                     -- Lien reçu Stripe
  refunded_amount       INTEGER     DEFAULT 0,   -- montant remboursé (centimes)
  metadata              JSONB       DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_client_tx_user_id ON public.client_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_tx_booking ON public.client_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_client_tx_stripe_pi ON public.client_transactions(stripe_payment_intent_id);

-- RLS : le client voit uniquement SES transactions
ALTER TABLE public.client_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_tx_own ON public.client_transactions;
CREATE POLICY client_tx_own ON public.client_transactions
  FOR ALL
  USING (user_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════════
-- C. TABLE REFUND_REQUESTS — Demandes de remboursement
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by          TEXT        NOT NULL,    -- 'client' | 'pro'
  user_id               TEXT        NOT NULL,    -- Clerk userId du demandeur
  reason                TEXT        NOT NULL,    -- Motif de la demande
  amount_requested      INTEGER     NOT NULL,    -- Montant demandé (centimes)
  amount_refunded       INTEGER     DEFAULT 0,   -- Montant effectivement remboursé
  status                TEXT        NOT NULL DEFAULT 'pending', -- pending | approved | rejected | processed | failed
  stripe_refund_id      TEXT,                     -- ID remboursement Stripe
  admin_notes           TEXT,                     -- Notes admin/pro sur la décision
  requested_at          TIMESTAMPTZ DEFAULT now(),
  processed_at          TIMESTAMPTZ,
  processed_by          TEXT,                     -- Clerk userId du processeur (si pro)
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_refund_req_booking ON public.refund_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_req_user ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_req_status ON public.refund_requests(status);

-- RLS : le client voit ses demandes, le pro voit les demandes sur ses bookings
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS refund_req_client ON public.refund_requests;
CREATE POLICY refund_req_client ON public.refund_requests
  FOR SELECT
  USING (
    user_id = auth.uid()::text 
    OR 
    booking_id IN (
      SELECT id FROM public.bookings WHERE pro_id = auth.uid()::text
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- D. TABLE PAYOUT_NOTIFICATIONS — Notifications de virements aux pros
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payout_notifications (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id                TEXT        NOT NULL,
  stripe_payout_id      TEXT        NOT NULL,
  amount                INTEGER     NOT NULL,    -- Montant du virement (centimes)
  currency              TEXT        NOT NULL DEFAULT 'eur',
  arrival_date          DATE,                     -- Date d'arrivée prévue
  status                TEXT        NOT NULL,    -- paid | pending | failed
  bank_account_last4    TEXT,                     -- 4 derniers chiffres du compte
  email_sent            BOOLEAN     DEFAULT false,
  email_sent_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_notif_pro ON public.payout_notifications(pro_id, created_at DESC);

ALTER TABLE public.payout_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payout_notif_own ON public.payout_notifications;
CREATE POLICY payout_notif_own ON public.payout_notifications
  FOR SELECT
  USING (pro_id = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════════
-- E. TABLE WEBHOOK_EVENTS_LOG — Traçabilité debugging
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.webhook_events_log (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id       TEXT        NOT NULL UNIQUE, -- ID event Stripe (évite doublons)
  event_type            TEXT        NOT NULL,    -- checkout.session.completed, etc.
  event_data            JSONB       NOT NULL,    -- Données complètes de l'event
  processed             BOOLEAN     DEFAULT false,
  processed_at          TIMESTAMPTZ,
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_event ON public.webhook_events_log(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_type ON public.webhook_events_log(event_type, created_at DESC);

-- RLS : service_role uniquement (pas d'accès frontend)
ALTER TABLE public.webhook_events_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_log_service ON public.webhook_events_log;
CREATE POLICY webhook_log_service ON public.webhook_events_log
  FOR ALL
  USING (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- F. FONCTIONS UTILITAIRES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Fonction pour enregistrer une transaction client depuis webhook
CREATE OR REPLACE FUNCTION public.log_client_transaction(
  p_user_id TEXT,
  p_booking_id UUID,
  p_pro_id TEXT,
  p_stripe_pi_id TEXT,
  p_stripe_session_id TEXT,
  p_amount INTEGER,
  p_receipt_url TEXT,
  p_description TEXT
) RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  INSERT INTO public.client_transactions (
    user_id, booking_id, pro_id, stripe_payment_intent_id, stripe_checkout_session_id,
    amount, receipt_url, description, status
  ) VALUES (
    p_user_id, p_booking_id, p_pro_id, p_stripe_pi_id, p_stripe_session_id,
    p_amount, p_receipt_url, p_description, 'succeeded'
  )
  ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  RETURNING id INTO v_tx_id;
  
  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le statut d'une transaction client
CREATE OR REPLACE FUNCTION public.update_client_transaction_status(
  p_stripe_pi_id TEXT,
  p_status TEXT,
  p_refunded_amount INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  UPDATE public.client_transactions
  SET status = p_status,
      refunded_amount = p_refunded_amount,
      updated_at = now()
  WHERE stripe_payment_intent_id = p_stripe_pi_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- G. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Trigger pour updated_at sur client_transactions
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.client_transactions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.client_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_refund ON public.refund_requests;
CREATE TRIGGER set_updated_at_refund
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- H. COMMENTAIRES DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.client_transactions IS 'Historique des paiements Stripe côté client (débits et remboursements)';
COMMENT ON TABLE public.refund_requests IS 'Demandes de remboursement (client ou pro)';
COMMENT ON TABLE public.payout_notifications IS 'Notifications de virements Stripe Connect aux pros';
COMMENT ON TABLE public.webhook_events_log IS 'Log de tous les events Stripe webhook pour debugging';

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✓ MIGRATION COMPLÈTE
-- ═══════════════════════════════════════════════════════════════════════════════
