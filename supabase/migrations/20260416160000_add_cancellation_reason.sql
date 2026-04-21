-- Migration: Ajouter le motif d'annulation aux bookings
-- Date: 2026-04-16

-- Ajouter la colonne cancellation_reason
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Ajouter un index pour les requêtes sur les annulations
CREATE INDEX IF NOT EXISTS bookings_cancellation_reason_idx 
  ON bookings(cancellation_reason) 
  WHERE cancellation_reason IS NOT NULL;

COMMENT ON COLUMN bookings.cancellation_reason IS 'Motif de l annulation du rendez-vous (imprévu, client absent, erreur, autre)';
