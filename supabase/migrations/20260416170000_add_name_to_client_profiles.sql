-- Migration: Add name column to client_profiles
-- Date: 2026-04-16

-- Add name column (computed from first_name + last_name)
ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS name text;

-- Update existing records with concatenated name
UPDATE client_profiles
SET name = COALESCE(first_name, '') || 
           CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN ' ' ELSE '' END ||
           COALESCE(last_name, '')
WHERE name IS NULL;

-- Create function to auto-update name
CREATE OR REPLACE FUNCTION update_client_profile_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = COALESCE(NEW.first_name, '') || 
             CASE WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN ' ' ELSE '' END ||
             COALESCE(NEW.last_name, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update name on insert/update
DROP TRIGGER IF EXISTS client_profiles_auto_name ON client_profiles;
CREATE TRIGGER client_profiles_auto_name
  BEFORE INSERT OR UPDATE ON client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_client_profile_name();

-- Add comment
COMMENT ON COLUMN client_profiles.name IS 'Full name (auto-generated from first_name + last_name)';
