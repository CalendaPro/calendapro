-- Migration: Ajouter la clé étrangère bookings -> client_profiles
-- Date: 2026-04-16
-- Nécessaire pour la jointure Supabase dans l'API appointments

-- Supprimer la contrainte si elle existe déjà
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS bookings_client_profiles_fkey;

-- Ajouter la clé étrangère
-- bookings.client_id (Clerk user_id) -> client_profiles.user_id
ALTER TABLE bookings
  ADD CONSTRAINT bookings_client_profiles_fkey
  FOREIGN KEY (client_id) REFERENCES client_profiles(user_id)
  ON DELETE SET NULL;
