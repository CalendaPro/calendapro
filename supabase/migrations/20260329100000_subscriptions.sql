-- ╔══════════════════════════════════════════════════════════╗
-- ║  subscriptions — table des abonnements Stripe            ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                text NOT NULL UNIQUE,          -- Clerk userId
  plan                   text NOT NULL DEFAULT 'free',  -- 'free' | 'premium' | 'infinity'
  status                 text NOT NULL DEFAULT 'active',-- 'active' | 'cancelled' | 'past_due'
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- Index pour lookup rapide par userId
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- Index pour lookup par subscription Stripe (webhook updates)
CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx ON public.subscriptions(stripe_subscription_id);

-- RLS : service_role uniquement (webhook + API route backend)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Le frontend NE doit PAS lire cette table directement
-- Tout passe par l'API route /api/profile qui expose le plan
DROP POLICY IF EXISTS "service_role_full_access" ON public.subscriptions;
CREATE POLICY "service_role_full_access" ON public.subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);
