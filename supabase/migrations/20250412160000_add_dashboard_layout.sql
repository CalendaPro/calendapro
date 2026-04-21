-- Migration: Add dashboard_layout column to profiles table
-- Created: 2025-04-12

-- Add dashboard_layout column to profiles
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS dashboard_layout TEXT DEFAULT 'modern';

-- Set default for existing rows
UPDATE profiles 
SET dashboard_layout = 'modern' 
WHERE dashboard_layout IS NULL;

-- Add constraint for valid values
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS valid_dashboard_layout;

-- Note: In Supabase, CHECK constraints work differently
-- We'll validate in the application layer instead for flexibility

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_dashboard_layout 
ON profiles(dashboard_layout);

-- Comment
COMMENT ON COLUMN profiles.dashboard_layout IS 'User preferred dashboard layout theme: modern, pro, minimalist, compact, dark-pro';
