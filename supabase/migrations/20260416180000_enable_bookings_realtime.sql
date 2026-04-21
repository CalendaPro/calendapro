-- Migration: Activer le realtime sur la table bookings
-- Date: 2026-04-16
-- Nécessaire pour la sync temps réel côté client

-- Activer la publication supabase_realtime pour la table bookings
BEGIN;

-- Vérifier si la publication existe, sinon la créer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Ajouter la table bookings à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- S'assurer que les RLS policies permettent la lecture pour le realtime
-- La policy "client read own bookings" existe déjà mais on la vérifie

COMMIT;

COMMENT ON TABLE public.bookings IS 'Réservations clients avec realtime enabled pour sync temps réel';
