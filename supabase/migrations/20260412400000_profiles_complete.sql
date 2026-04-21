-- ── CRITICAL: design_vibe + all site-builder columns ─────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS design_vibe       VARCHAR DEFAULT 'modern';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS color_palette     VARCHAR DEFAULT 'purple';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS button_rounded    INTEGER DEFAULT 12;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone             VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_contact     VARCHAR;

-- ── Schedule ──────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT
  '{"lundi":{"start":"09:00","end":"19:00","closed":false},"mardi":{"start":"09:00","end":"19:00","closed":false},"mercredi":{"start":"09:00","end":"19:00","closed":false},"jeudi":{"start":"09:00","end":"19:00","closed":false},"vendredi":{"start":"09:00","end":"19:00","closed":false},"samedi":{"start":"10:00","end":"18:00","closed":false},"dimanche":{"start":"00:00","end":"00:00","closed":true}}';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS schedule_exceptions JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_schedule     BOOLEAN DEFAULT true;

-- ── Location ──────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_address  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lat      DECIMAL(10,8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lng      DECIMAL(11,8);

-- ── Gallery ───────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery_images    JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_gallery      BOOLEAN DEFAULT false;

-- ── CTA ───────────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cta_button_text   VARCHAR DEFAULT 'Réserver maintenant';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cta_button_style  VARCHAR DEFAULT 'gradient';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cta_button_action VARCHAR DEFAULT 'modal';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cta_custom_url    TEXT;

-- ── Section order / visibility ────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT
  '["about","services","reviews","schedule","gallery","cta"]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_reviews      BOOLEAN DEFAULT true;

-- ── Appearance ────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dark_mode         BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS font_size         VARCHAR DEFAULT 'normal';

-- ── Pro photos table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pro_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id      TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  order_index INT  DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pro_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro_photos_own" ON pro_photos;
CREATE POLICY "pro_photos_own" ON pro_photos
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);

DROP POLICY IF EXISTS "pro_photos_public_read" ON pro_photos;
CREATE POLICY "pro_photos_public_read" ON pro_photos
  FOR SELECT USING (true);
