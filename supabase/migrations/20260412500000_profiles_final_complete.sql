-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION FINALE COMPLÈTE — profiles
-- Ajoute TOUTES les colonnes référencées dans le code.
-- 100% sécurisé: IF NOT EXISTS sur chaque ALTER.
-- À exécuter une seule fois dans Supabase SQL Editor.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Core columns (may already exist in original schema) ───────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS template          TEXT    DEFAULT 'minimal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_published       BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS published_at       TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accent_color       TEXT    DEFAULT '#7c3aed';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category           TEXT;

-- ── Onboarding design (20260411200000) ────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS design_vibe        TEXT    DEFAULT 'minimal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS font_pair          TEXT    DEFAULT 'clash-dm';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS btn_style          TEXT    DEFAULT 'pill';

-- ── Site-builder v1 (20260412300000) ──────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hero_image_url     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_name         TEXT    DEFAULT 'minimalist';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS font_family        TEXT    DEFAULT 'Inter';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_generated      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sections_visible   JSONB   DEFAULT '{"about":true,"reviews":true,"schedule":true,"gallery":false,"blog":false}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links       JSONB   DEFAULT '{}';

-- ── Site-builder v2 (20260412400000) ──────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS color_palette      TEXT    DEFAULT 'purple';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS button_rounded     INTEGER DEFAULT 12;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone              TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_contact      TEXT;

-- ── Schedule ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT
  '{"lundi":{"start":"09:00","end":"19:00","closed":false},"mardi":{"start":"09:00","end":"19:00","closed":false},"mercredi":{"start":"09:00","end":"19:00","closed":false},"jeudi":{"start":"09:00","end":"19:00","closed":false},"vendredi":{"start":"09:00","end":"19:00","closed":false},"samedi":{"start":"10:00","end":"18:00","closed":false},"dimanche":{"start":"00:00","end":"00:00","closed":true}}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS schedule_exceptions JSONB  DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_schedule      BOOLEAN DEFAULT true;

-- ── Location ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_address   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_lat       DECIMAL(10,8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_lng       DECIMAL(11,8);

-- ── Gallery ───────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gallery_images     JSONB   DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_gallery       BOOLEAN DEFAULT false;

-- ── CTA button ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cta_button_text   TEXT    DEFAULT 'Réserver maintenant';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cta_button_style  TEXT    DEFAULT 'gradient';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cta_button_action TEXT    DEFAULT 'modal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cta_custom_url    TEXT;

-- ── Section order & visibility ────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT
  '["about","services","reviews","schedule","gallery","cta"]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_reviews       BOOLEAN DEFAULT true;

-- ── Appearance ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dark_mode          BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS font_size          TEXT    DEFAULT 'normal';

-- ── pro_photos table (idempotent) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pro_photos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id      TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL,
  order_index INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pro_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'pro_photos'
      AND policyname = 'pro_photos_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY pro_photos_own ON public.pro_photos
        USING  (pro_id = auth.uid()::text)
        WITH CHECK (pro_id = auth.uid()::text)
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'pro_photos'
      AND policyname = 'pro_photos_public_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY pro_photos_public_read ON public.pro_photos
        FOR SELECT USING (true)
    $policy$;
  END IF;
END;
$$;
