-- Champs supplémentaires remplis lors de l'onboarding pro
-- Ville, catégorie métier, préférences design (vibe, typo, bouton)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS design_vibe text DEFAULT 'minimal';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS font_pair text DEFAULT 'clash-dm';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS btn_style text DEFAULT 'pill';

COMMENT ON COLUMN public.profiles.city IS 'Ville du professionnel (ex: Paris, Lyon)';
COMMENT ON COLUMN public.profiles.category IS 'Métier / catégorie (ex: barbier, coach-sport)';
COMMENT ON COLUMN public.profiles.design_vibe IS 'Thème de la page publique (minimal|barber|studio|organic)';
COMMENT ON COLUMN public.profiles.font_pair IS 'Paire de typographies choisie lors de l''onboarding';
COMMENT ON COLUMN public.profiles.btn_style IS 'Style des boutons CTA (pill|rounded|square)';
