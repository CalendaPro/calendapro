-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration #32 - Table des favoris pour clients
-- ═══════════════════════════════════════════════════════════════════════════════

-- Créer la table favorites si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  pro_id TEXT NOT NULL,
  pro_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contrainte unique: un client ne peut pas avoir deux fois le même pro en favori
  CONSTRAINT favorites_client_pro_unique UNIQUE (client_id, pro_id)
);

-- Index pour les recherches courantes
CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON public.favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_pro_id ON public.favorites(pro_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at);

-- Commentaires
COMMENT ON TABLE public.favorites IS 'Favoris des clients (pros préférés)';
COMMENT ON COLUMN public.favorites.client_id IS 'ID Clerk du client';
COMMENT ON COLUMN public.favorites.pro_id IS 'ID du professionnel';
COMMENT ON COLUMN public.favorites.pro_username IS 'Username du professionnel pour affichage rapide';

-- RLS Policies
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent (pour éviter les doublons)
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;

-- Les utilisateurs peuvent voir leurs propres favoris
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (client_id = auth.uid()::text);

-- Les utilisateurs peuvent créer leurs propres favoris
CREATE POLICY "Users can create own favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid()::text);

-- Les utilisateurs peuvent supprimer leurs propres favoris
CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (client_id = auth.uid()::text);
