-- ══════════════════════════════════════════════════════════════════════════════
-- Stripe Connect — columns & tables
-- Each pro gets their own Stripe Connect account for direct payouts
-- CalendaPro takes a 5% platform commission via application_fee_amount
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Connect columns on profiles ──────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_id           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarding   BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_charges      BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_payouts      BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_created_at   TIMESTAMPTZ;

-- Index for fast lookup when resolving Connect account from pro_id
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_connect_id
  ON public.profiles (stripe_connect_id)
  WHERE stripe_connect_id IS NOT NULL;

-- ── Platform transactions log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.connect_transactions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id            TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_id TEXT        NOT NULL,
  stripe_transfer_id TEXT,
  amount            INTEGER     NOT NULL,          -- total in cents
  platform_fee      INTEGER     NOT NULL DEFAULT 0, -- CalendaPro commission in cents
  net_amount        INTEGER     NOT NULL DEFAULT 0, -- amount credited to pro in cents
  currency          TEXT        NOT NULL DEFAULT 'eur',
  status            TEXT        NOT NULL DEFAULT 'pending', -- pending | succeeded | refunded
  client_name       TEXT,
  client_email      TEXT,
  booking_id        UUID,
  payment_type      TEXT        DEFAULT 'booking', -- booking | deposit | full
  plan              TEXT        DEFAULT 'free',    -- plan at time of transaction: free | premium | infinity
  metadata          JSONB       DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.connect_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'connect_transactions' AND policyname = 'connect_tx_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY connect_tx_own ON public.connect_transactions
        FOR SELECT USING (pro_id = auth.uid()::text)
    $policy$;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_connect_tx_pro_id ON public.connect_transactions (pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connect_tx_stripe_pid ON public.connect_transactions (stripe_payment_id);
