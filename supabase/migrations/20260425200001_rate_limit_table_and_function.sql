-- Migration: Persistent Rate Limiting Table and Function
-- Date: 2026-04-25
-- Purpose: Enable distributed rate limiting using Supabase (Fix #12)

-- Table pour stocker les compteurs de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(identifier, window_start)
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_entries(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_entries(window_start);

-- Fonction atomique pour vérifier et incrémenter le rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_max_requests INTEGER,
    p_window_ms INTEGER
)
RETURNS TABLE(allowed BOOLEAN, count INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_reset_at TIMESTAMPTZ;
    v_current_count INTEGER;
    v_allowed BOOLEAN;
BEGIN
    -- Calculer le début de la fenêtre courante
    v_window_start := DATE_TRUNC('minute', NOW());
    v_reset_at := v_window_start + (p_window_ms || ' milliseconds')::INTERVAL;
    
    -- Nettoyer les anciennes entrées (plus de 2 fenêtres en arrière)
    DELETE FROM rate_limit_entries 
    WHERE identifier = p_identifier 
    AND window_start < (NOW() - ((p_window_ms * 2) || ' milliseconds')::INTERVAL);
    
    -- Tenter d'insérer ou mettre à jour l'entrée existante
    INSERT INTO rate_limit_entries (identifier, count, window_start)
    VALUES (p_identifier, 1, v_window_start)
    ON CONFLICT (identifier, window_start) 
    DO UPDATE SET 
        count = rate_limit_entries.count + 1,
        updated_at = NOW()
    RETURNING rate_limit_entries.count INTO v_current_count;
    
    -- Si c'était un INSERT, v_current_count sera NULL, on le met à 1
    IF v_current_count IS NULL THEN
        v_current_count := 1;
    END IF;
    
    -- Déterminer si autorisé
    v_allowed := v_current_count <= p_max_requests;
    
    RETURN QUERY SELECT v_allowed, v_current_count, v_reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on function
COMMENT ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) IS 
'Vérifie et incrémente atomiquement le compteur de rate limiting. 
Retourne allowed (bool), count (int), reset_at (timestamp).
À utiliser pour le rate limiting persistant en serverless.';

-- Grant execute
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated, service_role;

-- Enable RLS
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limit entries
CREATE POLICY rate_limit_service_only ON rate_limit_entries
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Cleanup function for maintenance
CREATE OR REPLACE FUNCTION cleanup_rate_limit_entries()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM rate_limit_entries 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_rate_limit_entries() IS 
'Nettoie les entrées de rate limit vieilles de plus d''1 heure. À exécuter via cron.';

GRANT EXECUTE ON FUNCTION cleanup_rate_limit_entries() TO service_role;
