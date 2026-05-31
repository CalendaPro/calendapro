-- FIX 3: Add auto_confirm column to profiles
-- When true (default), bookings are automatically set to confirmed/upcoming status.
-- When false, bookings start as pending and require manual confirmation by the pro.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auto_confirm BOOLEAN NOT NULL DEFAULT true;
