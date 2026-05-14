-- Migration: Webhook Failed Bookings Log (Fix #4)
-- Date: 2026-04-25
-- Purpose: Log failed booking creations from webhooks for manual investigation

CREATE TABLE IF NOT EXISTS webhook_failed_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id TEXT NOT NULL,
    payment_intent_id TEXT,
    error TEXT NOT NULL,
    metadata JSONB,
    retryable BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_webhook_failed_bookings_session ON webhook_failed_bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_failed_bookings_created ON webhook_failed_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_failed_bookings_resolved ON webhook_failed_bookings(resolved) WHERE resolved = false;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_webhook_failed_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_failed_bookings_updated_at ON webhook_failed_bookings;
CREATE TRIGGER webhook_failed_bookings_updated_at
    BEFORE UPDATE ON webhook_failed_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_failed_bookings_updated_at();

-- Comment on table
COMMENT ON TABLE webhook_failed_bookings IS 
'Log des échecs de création de booking depuis les webhooks Stripe.
Permet d''identifier et résoudre manuellement les cas où un paiement a été effectué mais le booking n''a pas été créé.';

-- Enable RLS
ALTER TABLE webhook_failed_bookings ENABLE ROW LEVEL SECURITY;

-- Only service role can write
CREATE POLICY webhook_failed_bookings_service_write ON webhook_failed_bookings
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Admins can read and update
CREATE POLICY webhook_failed_bookings_admin_read ON webhook_failed_bookings
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY webhook_failed_bookings_admin_update ON webhook_failed_bookings
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
