-- Migration: Publish profiles that completed onboarding
-- Fix: is_published defaults to false, profiles completing onboarding should be published
-- Only publishes profiles that: completed onboarding, not deleted, not suspended

UPDATE public.profiles
SET is_published = true
WHERE onboarding_completed = true
  AND deleted_at IS NULL
  AND (account_status IS NULL OR account_status NOT IN ('deleted', 'pending_deletion', 'suspended'));
