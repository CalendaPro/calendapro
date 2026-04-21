-- Site builder extended columns (used by /api/pro/site-settings)
-- All use IF NOT EXISTS for full idempotency

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_name         TEXT DEFAULT 'minimalist',
  ADD COLUMN IF NOT EXISTS font_family        TEXT DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS hero_image_url     TEXT,
  ADD COLUMN IF NOT EXISTS logo_url           TEXT,
  ADD COLUMN IF NOT EXISTS sections_visible   JSONB DEFAULT '{"about":true,"services":true,"reviews":true,"schedule":true,"gallery":false,"cta":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_order      JSONB DEFAULT '["about","services","reviews","schedule","gallery","cta"]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule           JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule_exceptions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_schedule      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_address   TEXT,
  ADD COLUMN IF NOT EXISTS location_lat       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS gallery_images     JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_gallery       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_button_text    TEXT DEFAULT 'Reserver maintenant',
  ADD COLUMN IF NOT EXISTS cta_button_style   TEXT DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS cta_button_action  TEXT DEFAULT 'modal',
  ADD COLUMN IF NOT EXISTS cta_custom_url     TEXT,
  ADD COLUMN IF NOT EXISTS show_reviews       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS dark_mode          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS font_size          TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS color_palette      TEXT DEFAULT 'purple',
  ADD COLUMN IF NOT EXISTS button_rounded     INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS email_contact      TEXT,
  ADD COLUMN IF NOT EXISTS bio_generated      TEXT;

COMMENT ON COLUMN public.profiles.theme_name IS 'Predefined vibe/theme name';
COMMENT ON COLUMN public.profiles.font_family IS 'Primary font family for the public page';
COMMENT ON COLUMN public.profiles.hero_image_url IS 'Hero section background image URL';
COMMENT ON COLUMN public.profiles.logo_url IS 'Logo image URL (Premium+)';
COMMENT ON COLUMN public.profiles.sections_visible IS 'Map of section key to boolean visibility';
COMMENT ON COLUMN public.profiles.section_order IS 'Ordered array of section keys';
COMMENT ON COLUMN public.profiles.social_links IS 'Map of network name to URL';
COMMENT ON COLUMN public.profiles.schedule IS 'Weekly schedule as WeekSchedule JSON';
COMMENT ON COLUMN public.profiles.schedule_exceptions IS 'Array of ScheduleException objects';
COMMENT ON COLUMN public.profiles.gallery_images IS 'Array of image URLs for the gallery';
COMMENT ON COLUMN public.profiles.cta_button_text IS 'CTA button label text';
COMMENT ON COLUMN public.profiles.cta_button_style IS 'CTA button style: gradient | solid | outline | glassmorphic';
COMMENT ON COLUMN public.profiles.cta_button_action IS 'CTA button action: modal | scroll | whatsapp | custom';
COMMENT ON COLUMN public.profiles.phone IS 'Public contact phone number';
COMMENT ON COLUMN public.profiles.email_contact IS 'Public contact email address';
