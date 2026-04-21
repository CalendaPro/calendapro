-- Migration: Tracking Marketing et Sauvegarde par étape de l'onboarding client
-- Created: 2026-04-13

-- 1. Ajouter le champ referrer_name à client_profiles pour le tracking marketing
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS referrer_name VARCHAR(255);

COMMENT ON COLUMN client_profiles.referrer_name IS 'Nom du recommandeur pour tracking marketing (pas de bonus, juste de la data)';

-- 2. Créer la table pour sauvegarder les réponses de chaque étape de l'onboarding
CREATE TABLE IF NOT EXISTS client_onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Étape concernée (1-4)
    step INTEGER NOT NULL CHECK (step >= 1 AND step <= 4),
    
    -- Données de l'étape (JSONB flexible)
    step_data JSONB NOT NULL DEFAULT '{}',
    
    -- Métadonnées
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Contrainte: une seule réponse par étape et par utilisateur
    CONSTRAINT unique_user_step UNIQUE (user_id, step)
);

COMMENT ON TABLE client_onboarding_responses IS 'Sauvegarde des réponses de chaque étape de l''onboarding client pour éviter la navigation fantôme';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_client_onboarding_responses_user_id 
    ON client_onboarding_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_responses_step 
    ON client_onboarding_responses(step);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_responses_user_step 
    ON client_onboarding_responses(user_id, step);

-- RLS Policies
ALTER TABLE client_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs peuvent voir leurs propres réponses
DROP POLICY IF EXISTS "Users can view own onboarding responses" ON client_onboarding_responses;
CREATE POLICY "Users can view own onboarding responses" 
    ON client_onboarding_responses FOR SELECT 
    USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent créer leurs propres réponses
DROP POLICY IF EXISTS "Users can insert own onboarding responses" ON client_onboarding_responses;
CREATE POLICY "Users can insert own onboarding responses" 
    ON client_onboarding_responses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent mettre à jour leurs propres réponses
DROP POLICY IF EXISTS "Users can update own onboarding responses" ON client_onboarding_responses;
CREATE POLICY "Users can update own onboarding responses" 
    ON client_onboarding_responses FOR UPDATE 
    USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent supprimer leurs propres réponses
DROP POLICY IF EXISTS "Users can delete own onboarding responses" ON client_onboarding_responses;
CREATE POLICY "Users can delete own onboarding responses" 
    ON client_onboarding_responses FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_client_onboarding_responses_updated_at 
    ON client_onboarding_responses;
CREATE TRIGGER update_client_onboarding_responses_updated_at
    BEFORE UPDATE ON client_onboarding_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour sauvegarder une étape de l'onboarding
CREATE OR REPLACE FUNCTION save_onboarding_step(
    p_user_id UUID,
    p_step INTEGER,
    p_step_data JSONB,
    p_is_completed BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO client_onboarding_responses (
        user_id,
        step,
        step_data,
        is_completed,
        completed_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_step,
        p_step_data,
        p_is_completed,
        CASE WHEN p_is_completed THEN now() ELSE null END,
        now()
    )
    ON CONFLICT (user_id, step) 
    DO UPDATE SET
        step_data = EXCLUDED.step_data,
        is_completed = EXCLUDED.is_completed,
        completed_at = CASE 
            WHEN EXCLUDED.is_completed AND NOT client_onboarding_responses.is_completed 
            THEN now() 
            ELSE client_onboarding_responses.completed_at 
        END,
        updated_at = now()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION save_onboarding_step IS 'Sauvegarde ou met à jour les données d''une étape de l''onboarding';

-- Fonction pour récupérer le progrès de l'onboarding d'un utilisateur
CREATE OR REPLACE FUNCTION get_onboarding_progress(p_user_id UUID)
RETURNS TABLE (
    step INTEGER,
    step_data JSONB,
    is_completed BOOLEAN,
    completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cor.step,
        cor.step_data,
        cor.is_completed,
        cor.completed_at
    FROM client_onboarding_responses cor
    WHERE cor.user_id = p_user_id
    ORDER BY cor.step;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_onboarding_progress IS 'Récupère le progrès complet de l''onboarding d''un utilisateur';

-- Vue pour le dashboard Pro: meilleurs prescripteurs
CREATE OR REPLACE VIEW top_referrers AS
SELECT 
    referrer_name,
    COUNT(*) as referral_count,
    MIN(created_at) as first_referral_at,
    MAX(created_at) as last_referral_at
FROM client_profiles
WHERE referrer_name IS NOT NULL 
    AND referrer_name != ''
    AND source = 'recommendation'
GROUP BY referrer_name
ORDER BY referral_count DESC;

COMMENT ON VIEW top_referrers IS 'Vue pour le dashboard Pro: classement des meilleurs prescripteurs pour le tracking marketing';
