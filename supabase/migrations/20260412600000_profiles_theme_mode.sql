-- Visual mode preference per user
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'auto'
    CHECK (theme_mode IN ('light', 'dark', 'auto'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accent_color_override TEXT;

COMMENT ON COLUMN public.profiles.theme_mode IS 'User UI preference: light | dark | auto (follows system)';
COMMENT ON COLUMN public.profiles.accent_color_override IS 'Optional accent color override for the dashboard UI';
