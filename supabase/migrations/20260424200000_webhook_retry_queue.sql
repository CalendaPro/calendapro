-- ═══════════════════════════════════════════════════════════════════════════════
-- Webhook Retry Queue — Système de reprise des webhooks échoués
-- ═══════════════════════════════════════════════════════════════════════════════

-- Table pour les événements webhook en attente de retry
CREATE TABLE IF NOT EXISTS webhook_retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMPTZ,
    last_error TEXT,
    error_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    stripe_signature TEXT
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_webhook_retry_status ON webhook_retry_queue(status);
CREATE INDEX IF NOT EXISTS idx_webhook_retry_next_attempt ON webhook_retry_queue(next_attempt_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_retry_event_id ON webhook_retry_queue(stripe_event_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_webhook_retry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_retry_updated_at ON webhook_retry_queue;
CREATE TRIGGER webhook_retry_updated_at
    BEFORE UPDATE ON webhook_retry_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_retry_updated_at();

-- Fonction pour calculer le prochain retry avec backoff exponentiel
CREATE OR REPLACE FUNCTION calculate_retry_delay(attempt_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Backoff exponentiel: 1min, 2min, 4min, 8min, 15min (max)
    RETURN LEAST(2 ^ attempt_count * 60, 900);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour récupérer les webhooks à traiter
CREATE OR REPLACE FUNCTION get_pending_webhooks(batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    stripe_event_id TEXT,
    event_type TEXT,
    event_data JSONB,
    attempt_count INTEGER,
    stripe_signature TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.stripe_event_id,
        w.event_type,
        w.event_data,
        w.attempt_count,
        w.stripe_signature
    FROM webhook_retry_queue w
    WHERE w.status = 'pending'
      AND (w.next_attempt_at IS NULL OR w.next_attempt_at <= NOW())
    ORDER BY w.next_attempt_at ASC NULLS FIRST, w.created_at ASC
    LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE webhook_retry_queue IS 'Queue pour les webhooks Stripe en attente de traitement avec retry automatique';
COMMENT ON COLUMN webhook_retry_queue.status IS 'pending, processing, completed, failed';
COMMENT ON COLUMN webhook_retry_queue.attempt_count IS 'Nombre de tentatives effectuées';
COMMENT ON COLUMN webhook_retry_queue.next_attempt_at IS 'Date de la prochaine tentative (backoff exponentiel)';
