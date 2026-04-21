-- Add marketplace_referral_count to profiles
-- Tracks how many bookings were generated via the public marketplace tunnel

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketplace_referral_count integer NOT NULL DEFAULT 0;

-- Index for analytics queries (top marketplace performers)
CREATE INDEX IF NOT EXISTS idx_profiles_marketplace_referral
  ON profiles (marketplace_referral_count DESC);

-- Helper function: increment atomically to avoid race conditions
CREATE OR REPLACE FUNCTION increment_marketplace_referral(pro_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET marketplace_referral_count = marketplace_referral_count + 1
  WHERE id = pro_id;
$$;
