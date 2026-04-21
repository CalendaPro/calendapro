-- Migration: Table client_profiles pour l'onboarding client
-- Created: 2026-04-13

-- Supprime les dépendances existantes d'abord
DROP VIEW IF EXISTS top_referrers;

-- Supprime les contraintes FK sur referral_tracking si elles existent
ALTER TABLE IF EXISTS referral_tracking 
  DROP CONSTRAINT IF EXISTS referral_tracking_referrer_client_id_fkey;

ALTER TABLE IF EXISTS referral_tracking 
  DROP CONSTRAINT IF EXISTS referral_tracking_referred_client_id_fkey;

-- Supprime la table avec CASCADE pour forcer la suppression
DROP TABLE IF EXISTS client_profiles CASCADE;

-- Table des profils clients
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Clerk user_id (ex: user_xxx)
    
    -- Étape 1: Source de découverte
    source VARCHAR(50), -- 'google', 'recommendation', 'social', 'advertising', 'other'
    source_other TEXT, -- Précision si "Autre"
    
    -- Étape 2: Centres d'intérêt
    interests TEXT[], -- Tableau des catégories sélectionnées
    
    -- Étape 3: Localisation et disponibilités
    city VARCHAR(100),
    search_radius INTEGER DEFAULT 10, -- en km: 5, 10, 20, 50
    include_online BOOLEAN DEFAULT false,
    available_times TEXT[], -- 'morning', 'afternoon', 'evening'
    
    -- Étape 4: Informations de profil
    phone VARCHAR(20),
    avatar_url TEXT,
    sms_reminders BOOLEAN DEFAULT false,
    
    -- État de l'onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_onboarding_completed ON client_profiles(onboarding_completed);

-- Contrainte unique sur user_id pour permettre les upserts
ALTER TABLE client_profiles DROP CONSTRAINT IF EXISTS client_profiles_user_id_unique;
ALTER TABLE client_profiles ADD CONSTRAINT client_profiles_user_id_unique UNIQUE (user_id);

-- RLS Policies
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs peuvent voir leur propre profil
DROP POLICY IF EXISTS "Users can view own client profile" ON client_profiles;
CREATE POLICY "Users can view own client profile" 
    ON client_profiles FOR SELECT 
    USING (auth.uid()::text = user_id);

-- Politique: permettre insert pour tous (sécurité gérée côté Clerk dans l'app)
-- NOTE: auth.uid() ne fonctionne pas avec Clerk
DROP POLICY IF EXISTS "Users can insert own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON client_profiles;
CREATE POLICY "Enable insert for all" 
    ON client_profiles FOR INSERT 
    WITH CHECK (true);

-- Politique: permettre update pour tous (sécurité gérée côté Clerk dans l'app)
DROP POLICY IF EXISTS "Users can update own client profile" ON client_profiles;
CREATE POLICY "Enable update for all" 
    ON client_profiles FOR UPDATE 
    USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON client_profiles;
CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour marquer l'onboarding comme complété
CREATE OR REPLACE FUNCTION complete_client_onboarding(profile_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE client_profiles 
    SET onboarding_completed = true,
        onboarding_completed_at = now()
    WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE client_profiles IS 'Profils des clients avec données d''onboarding';