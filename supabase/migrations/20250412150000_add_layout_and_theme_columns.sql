-- Migration: Add layout and theme pack columns to profiles table
-- Created: 2025-04-12

-- Add pro_layout column with default value
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pro_layout TEXT DEFAULT 'modern';

-- Add client_layout column with default value
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS client_layout TEXT DEFAULT 'modern';

-- Add theme_pack_id column with default value
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_pack_id TEXT DEFAULT 'violet-prestige';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.pro_layout IS 'Selected pro dashboard layout (modern, pro, minimalist, compact, dark-pro)';
COMMENT ON COLUMN public.profiles.client_layout IS 'Selected client dashboard layout (modern, pro, minimalist, compact, dark)';
COMMENT ON COLUMN public.profiles.theme_pack_id IS 'Selected visual theme pack ID (violet-prestige, gray-minimalist, etc.)';
