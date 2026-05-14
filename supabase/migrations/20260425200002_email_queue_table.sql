-- Migration: Email Queue Table for Retry System (Fix #7)
-- Date: 2026-04-25
-- Purpose: Enable queue-based email retry for critical emails

-- Table pour la queue d'emails
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMPTZ,
    last_error TEXT,
    priority INTEGER NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1=haute, 2=normale, 3=basse
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Index pour les requêtes de traitement
CREATE INDEX IF NOT EXISTS idx_email_queue_status_next ON email_queue(status, next_attempt_at) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority, created_at) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_type ON email_queue(email_type);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_queue_updated_at ON email_queue;
CREATE TRIGGER email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_email_queue_updated_at();

-- Comment on table
COMMENT ON TABLE email_queue IS 
'Queue de retry pour les emails. Les emails critiques sont ajoutés ici en cas d''échec pour retry automatique.';

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access email queue
CREATE POLICY email_queue_service_only ON email_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Cleanup function for maintenance
CREATE OR REPLACE FUNCTION cleanup_email_queue(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM email_queue 
    WHERE status IN ('completed', 'failed')
    AND updated_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_email_queue(INTEGER) IS 
'Nettoie les entrées de la queue d''emails vieilles de plus de N jours. À exécuter via cron.';

GRANT EXECUTE ON FUNCTION cleanup_email_queue(INTEGER) TO service_role;
