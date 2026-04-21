-- Migration: Hybrid Avatar System for PRO + CLIENT
-- Created: 2026-04-13
-- Adds avatar columns to both profiles and client_profiles tables

-- ============================================
-- PRO Profiles - Avatar columns
-- ============================================

-- Add profile photo URL column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add avatar style preference
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(50) DEFAULT 'initials';

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_photo_url IS 'URL of uploaded profile photo - takes precedence over generated avatar';
COMMENT ON COLUMN profiles.avatar_style IS 'Avatar style: initials, gradient, or custom';

-- ============================================
-- Client Profiles - Avatar columns
-- ============================================

-- Add avatar photo URL column
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add avatar style preference
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(50) DEFAULT 'initials';

-- Add accent color for avatar (can be different from pro's accent)
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7);

-- Add first_name and last_name for avatar generation
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add comments
COMMENT ON COLUMN client_profiles.avatar_url IS 'URL of uploaded avatar photo';
COMMENT ON COLUMN client_profiles.avatar_style IS 'Avatar style: initials, gradient, or custom';
COMMENT ON COLUMN client_profiles.accent_color IS 'Custom accent color for avatar generation';
COMMENT ON COLUMN client_profiles.first_name IS 'First name for avatar initials';
COMMENT ON COLUMN client_profiles.last_name IS 'Last name for avatar initials';

-- ============================================
-- Storage Bucket for Avatars (if not exists)
-- ============================================

-- Note: Storage buckets are typically managed via Supabase dashboard or seed scripts
-- This migration assumes the 'avatars' bucket will be created separately

-- ============================================
-- Update existing profiles with default avatar style
-- ============================================

UPDATE profiles 
SET avatar_style = 'initials' 
WHERE avatar_style IS NULL;

UPDATE client_profiles 
SET avatar_style = 'initials' 
WHERE avatar_style IS NULL;

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_profile_photo_url ON profiles(profile_photo_url) 
WHERE profile_photo_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_profiles_avatar_url ON client_profiles(avatar_url) 
WHERE avatar_url IS NOT NULL;
