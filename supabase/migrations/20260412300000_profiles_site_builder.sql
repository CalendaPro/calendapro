-- ── Site Builder columns for profiles ──────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hero_image_url  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url        TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_name      VARCHAR DEFAULT 'minimalist';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS font_family     VARCHAR DEFAULT 'inter';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accent_color    VARCHAR DEFAULT '#7c3aed';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_generated   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sections_visible JSONB DEFAULT '{"about":true,"reviews":true,"schedule":true,"gallery":false,"blog":false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links    JSONB DEFAULT '{}';

-- ── Saved themes table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_themes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       VARCHAR(255),
  config     JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_themes_own" ON saved_themes;
CREATE POLICY "saved_themes_own" ON saved_themes
  USING (pro_id = auth.uid()::text)
  WITH CHECK (pro_id = auth.uid()::text);
