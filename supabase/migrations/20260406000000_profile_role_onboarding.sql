-- Ajout du rôle utilisateur et du flag onboarding_completed sur les profils
-- Exécuter dans Supabase SQL Editor si les migrations ne sont pas appliquées automatiquement.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'pro'
    CHECK (role IN ('pro', 'client'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.role IS
  'Rôle de l''utilisateur : pro (professionnel) ou client (consommateur).';
COMMENT ON COLUMN public.profiles.onboarding_completed IS
  'true si le professionnel a terminé l''onboarding (publication de sa page).';
