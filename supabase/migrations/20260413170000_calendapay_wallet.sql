-- ╔══════════════════════════════════════════════════════════╗
-- ║  CalendaPay — Système de Wallet et Remboursements          ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── AJOUT COLONNE DEPOSIT A BOOKINGS ─────────────────────
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL CHECK (payment_method IN ('stripe', 'wallet', NULL));

COMMENT ON COLUMN public.bookings.deposit_amount IS 'Montant de l''acompte paye (si applicable)';
COMMENT ON COLUMN public.bookings.payment_method IS 'Méthode de paiement: stripe ou wallet';

-- ── FONCTION: Calculer les revenus réels (avec acomptes) ───
CREATE OR REPLACE FUNCTION calculate_pro_revenue(
    p_pro_id text,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_total_revenue numeric;
    v_deposit_revenue numeric;
    v_full_payments numeric;
    v_wallet_payments numeric;
    v_stripe_payments numeric;
    v_refunded_amount numeric;
    v_result jsonb;
BEGIN
    -- Revenus totaux (prix des RDV confirmés/completed)
    SELECT COALESCE(SUM(price), 0)
    INTO v_total_revenue
    FROM public.bookings
    WHERE pro_id = p_pro_id
      AND status IN ('upcoming', 'completed')
      AND ($2 IS NULL OR scheduled_at >= $2)
      AND ($3 IS NULL OR scheduled_at < $3);

    -- Acomptes reçus (payment_status = paid)
    SELECT COALESCE(SUM(deposit_amount), 0)
    INTO v_deposit_revenue
    FROM public.bookings
    WHERE pro_id = p_pro_id
      AND payment_status = 'paid'
      AND deposit_amount > 0
      AND ($2 IS NULL OR scheduled_at >= $2)
      AND ($3 IS NULL OR scheduled_at < $3);

    -- Paiements complets (pas d'acompte mais price > 0 et paid)
    SELECT COALESCE(SUM(price), 0)
    INTO v_full_payments
    FROM public.bookings
    WHERE pro_id = p_pro_id
      AND payment_status = 'paid'
      AND (deposit_amount IS NULL OR deposit_amount = 0)
      AND ($2 IS NULL OR scheduled_at >= $2)
      AND ($3 IS NULL OR scheduled_at < $3);

    -- Par méthode de paiement
    SELECT COALESCE(SUM(CASE WHEN payment_method = 'wallet' THEN deposit_amount ELSE 0 END), 0)
    INTO v_wallet_payments
    FROM public.bookings
    WHERE pro_id = p_pro_id
      AND payment_status = 'paid'
      AND ($2 IS NULL OR scheduled_at >= $2)
      AND ($3 IS NULL OR scheduled_at < $3);

    SELECT COALESCE(SUM(CASE WHEN payment_method = 'stripe' OR payment_method IS NULL THEN deposit_amount ELSE 0 END), 0)
    INTO v_stripe_payments
    FROM public.bookings
    WHERE pro_id = p_pro_id
      AND payment_status = 'paid'
      AND ($2 IS NULL OR scheduled_at >= $2)
      AND ($3 IS NULL OR scheduled_at < $3);

    -- Remboursements
    SELECT COALESCE(SUM(deposit_amount), 0)
    INTO v_refunded_amount
    FROM public.bookings
    WHERE pro_id = p_pro_id
      AND payment_status = 'refunded'
      AND ($2 IS NULL OR scheduled_at >= $2)
      AND ($3 IS NULL OR scheduled_at < $3);

    v_result := jsonb_build_object(
        'total_revenue', v_total_revenue,
        'deposit_revenue', v_deposit_revenue,
        'full_payments', v_full_payments,
        'wallet_payments', v_wallet_payments,
        'stripe_payments', v_stripe_payments,
        'refunded_amount', v_refunded_amount,
        'net_revenue', v_total_revenue - v_refunded_amount
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_pro_revenue IS 'Calcule les revenus reels d''un pro avec acomptes et remboursements';

-- ── WALLETS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            text        NOT NULL UNIQUE,          -- Clerk userId (client ou pro)
  balance            numeric(12,2) NOT NULL DEFAULT 0,    -- Solde en euros
  currency           text        NOT NULL DEFAULT 'EUR',
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets(user_id);

COMMENT ON TABLE public.wallets IS 'Porte-monnaie interne CalendaPay pour les remboursements et paiements';
COMMENT ON COLUMN public.wallets.balance IS 'Solde disponible en euros, crédité lors des remboursements';

-- ── WALLET_TRANSACTIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id          uuid        NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id            text        NOT NULL,                   -- Redondant pour facilité RLS
  booking_id         uuid        REFERENCES public.bookings(id) ON DELETE SET NULL,
  type               text        NOT NULL CHECK (type IN ('credit_refund', 'debit_payment', 'deposit', 'withdrawal')),
  amount             numeric(12,2) NOT NULL,                 -- Montant positif
  currency           text        NOT NULL DEFAULT 'EUR',
  description        text,
  metadata           jsonb,                                -- Preuve d'annulation, etc.
  status             text        NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  created_at         timestamptz DEFAULT now(),
  processed_at       timestamptz                           -- Date de traitement effectif
);

CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_idx ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_booking_id_idx ON public.wallet_transactions(booking_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_type_idx ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS wallet_transactions_created_at_idx ON public.wallet_transactions(created_at DESC);

COMMENT ON TABLE public.wallet_transactions IS 'Historique des transactions du wallet (circuit fermé)';
COMMENT ON COLUMN public.wallet_transactions.booking_id IS 'Preuve de lien avec un RDV - obligatoire pour les crédits';
COMMENT ON COLUMN public.wallet_transactions.metadata IS 'JSON contenant la preuve d''annulation et détails';

-- ── RLS WALLETS ──────────────────────────────────────────
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_owner_select" ON public.wallets;
CREATE POLICY "wallet_owner_select"
  ON public.wallets FOR SELECT
  USING (user_id = auth.uid()::text);

-- Service role uniquement pour les modifications (circuit fermé)
DROP POLICY IF EXISTS "wallet_service_only" ON public.wallets;
CREATE POLICY "wallet_service_only"
  ON public.wallets FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── RLS WALLET_TRANSACTIONS ────────────────────────────
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transaction_owner_select" ON public.wallet_transactions;
CREATE POLICY "transaction_owner_select"
  ON public.wallet_transactions FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "transaction_service_only" ON public.wallet_transactions;
CREATE POLICY "transaction_service_only"
  ON public.wallet_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── FONCTION: Créditer le wallet avec vérification circuit fermé ──
CREATE OR REPLACE FUNCTION credit_wallet_from_cancellation(
    p_user_id text,
    p_booking_id uuid,
    p_amount numeric,
    p_description text,
    p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
    v_wallet_id uuid;
    v_transaction_id uuid;
    v_booking_status text;
    v_existing_credit uuid;
BEGIN
    -- 🔒 VÉRIFICATION CIRCUIT FERMÉ: Le booking doit être annulé
    SELECT status INTO v_booking_status
    FROM public.bookings
    WHERE id = p_booking_id;
    
    IF v_booking_status IS NULL THEN
        RAISE EXCEPTION 'Booking non trouvé: %', p_booking_id;
    END IF;
    
    IF v_booking_status != 'cancelled' THEN
        RAISE EXCEPTION 'Circuit fermé: Impossible de créditer sans annulation. Statut actuel: %', v_booking_status;
    END IF;
    
    -- Vérifier qu'un crédit n'existe pas déjà pour ce booking
    SELECT wt.id INTO v_existing_credit
    FROM public.wallet_transactions wt
    JOIN public.wallets w ON wt.wallet_id = w.id
    WHERE w.user_id = p_user_id 
      AND wt.booking_id = p_booking_id 
      AND wt.type = 'credit_refund'
      AND wt.status = 'completed'
    LIMIT 1;
    
    IF v_existing_credit IS NOT NULL THEN
        RAISE EXCEPTION 'Remboursement déjà effectué pour ce booking: %', p_booking_id;
    END IF;
    
    -- Récupérer ou créer le wallet
    SELECT id INTO v_wallet_id
    FROM public.wallets
    WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO public.wallets (user_id, balance)
        VALUES (p_user_id, 0)
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Créer la transaction
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, booking_id, type, amount, 
        description, metadata, status, processed_at
    ) VALUES (
        v_wallet_id, p_user_id, p_booking_id, 'credit_refund', p_amount,
        p_description, p_metadata, 'completed', now()
    )
    RETURNING id INTO v_transaction_id;
    
    -- Mettre à jour le solde
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FONCTION: Débiter le wallet pour paiement ──
CREATE OR REPLACE FUNCTION debit_wallet_for_payment(
    p_user_id text,
    p_booking_id uuid,
    p_amount numeric,
    p_description text
) RETURNS uuid AS $$
DECLARE
    v_wallet_id uuid;
    v_current_balance numeric;
    v_transaction_id uuid;
BEGIN
    -- Vérifier le solde
    SELECT id, balance INTO v_wallet_id, v_current_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;  -- Lock pour éviter race condition
    
    IF v_wallet_id IS NULL OR v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Solde insuffisant. Disponible: %, Requis: %', 
            COALESCE(v_current_balance, 0), p_amount;
    END IF;
    
    -- Créer la transaction
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, booking_id, type, amount,
        description, status, processed_at
    ) VALUES (
        v_wallet_id, p_user_id, p_booking_id, 'debit_payment', p_amount,
        p_description, 'completed', now()
    )
    RETURNING id INTO v_transaction_id;
    
    -- Mettre à jour le solde
    UPDATE public.wallets
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = v_wallet_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FONCTION: Annulation complète avec wallet ──
CREATE OR REPLACE FUNCTION cancel_booking_with_wallet_credit(
    p_booking_id uuid,
    p_cancelled_by text,  -- 'pro' ou 'client'
    p_canceller_id text,
    p_reason text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_booking record;
    v_deposit_amount numeric;
    v_transaction_id uuid;
    v_result jsonb;
BEGIN
    -- Récupérer le booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;
    
    IF v_booking IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Booking non trouvé'
        );
    END IF;
    
    IF v_booking.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Booking déjà annulé'
        );
    END IF;
    
    -- Calculer le montant à rembourser (acompte ou paiement complet)
    v_deposit_amount := COALESCE(v_booking.price, 0);
    
    -- Si c'est un acompte uniquement (à déterminer selon votre logique)
    -- Par défaut on rembourse tout le montant payé
    
    -- Mettre à jour le statut
    UPDATE public.bookings
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = p_booking_id;
    
    -- Si un paiement a été effectué, créditer le wallet
    IF v_booking.payment_status = 'paid' AND v_deposit_amount > 0 THEN
        v_transaction_id := credit_wallet_from_cancellation(
            v_booking.client_id,
            p_booking_id,
            v_deposit_amount,
            'Remboursement suite à annulation',
            jsonb_build_object(
                'cancelled_by', p_cancelled_by,
                'canceller_id', p_canceller_id,
                'reason', p_reason,
                'original_price', v_booking.price,
                'original_payment_status', v_booking.payment_status
            )
        );
        
        -- Mettre à jour le statut de paiement
        UPDATE public.bookings
        SET payment_status = 'refunded'
        WHERE id = p_booking_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'refund_amount', CASE WHEN v_transaction_id IS NOT NULL THEN v_deposit_amount ELSE 0 END,
        'transaction_id', v_transaction_id,
        'wallet_credited', v_transaction_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FONCTION: Vérifier si un client peut annuler (24h) ──
CREATE OR REPLACE FUNCTION can_client_cancel_booking(
    p_booking_id uuid,
    p_client_id text
) RETURNS jsonb AS $$
DECLARE
    v_booking record;
    v_hours_until_appointment numeric;
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id AND client_id = p_client_id;
    
    IF v_booking IS NULL THEN
        RETURN jsonb_build_object('can_cancel', false, 'reason', 'Booking non trouvé');
    END IF;
    
    IF v_booking.status = 'cancelled' THEN
        RETURN jsonb_build_object('can_cancel', false, 'reason', 'Déjà annulé');
    END IF;
    
    IF v_booking.status = 'completed' THEN
        RETURN jsonb_build_object('can_cancel', false, 'reason', 'Rendez-vous déjà passé');
    END IF;
    
    -- Calculer le temps restant
    v_hours_until_appointment := EXTRACT(EPOCH FROM (v_booking.scheduled_at - now())) / 3600;
    
    IF v_hours_until_appointment < 24 THEN
        RETURN jsonb_build_object(
            'can_cancel', false, 
            'reason', 'Annulation impossible à moins de 24h du rendez-vous',
            'hours_remaining', v_hours_until_appointment
        );
    END IF;
    
    RETURN jsonb_build_object(
        'can_cancel', true,
        'hours_remaining', v_hours_until_appointment,
        'refund_eligible', v_booking.payment_status = 'paid'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── TRIGGER: updated_at pour wallets ──
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wallets_updated_at ON public.wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── FONCTION RPC: Incrémenter le solde du wallet ──
CREATE OR REPLACE FUNCTION increment_wallet_balance(
    p_wallet_id uuid,
    p_amount numeric
) RETURNS void AS $$
BEGIN
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_wallet_balance IS 'Fonction RPC pour incrementer atomiquement le solde d''un wallet';
