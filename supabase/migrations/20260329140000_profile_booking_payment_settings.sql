-- Paramètres paiement / acompte configurables par le professionnel
-- Exécuter dans Supabase SQL Editor si besoin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS online_payment_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deposit_required boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deposit_type text NOT NULL DEFAULT 'percent'
    CHECK (deposit_type IN ('percent', 'fixed'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deposit_value numeric NOT NULL DEFAULT 25;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_full_online_payment boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.online_payment_enabled IS
  'Si false : réservation sans paiement sur CalendaPro (règlement chez le pro).';
COMMENT ON COLUMN public.profiles.deposit_required IS
  'Acompte obligatoire en ligne (si online_payment_enabled).';
COMMENT ON COLUMN public.profiles.deposit_type IS
  'percent : deposit_value = % du montant estimé ; fixed : deposit_value = euros.';
COMMENT ON COLUMN public.profiles.deposit_value IS
  'Pourcentage (1–100) ou montant fixe en euros selon deposit_type.';
COMMENT ON COLUMN public.profiles.allow_full_online_payment IS
  'Propose le paiement intégral en ligne (en plus ou à la place de l’acompte selon les options).';
