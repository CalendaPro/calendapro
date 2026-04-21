-- Migration: Table de suivi des remboursements Stripe échoués
-- Créée le: 2026-04-18
-- Contexte: Bug critique double booking - remboursement automatique

CREATE TABLE IF NOT EXISTS failed_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT NOT NULL,
  payment_intent TEXT,
  reason TEXT NOT NULL DEFAULT 'slot_conflict',
  metadata JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par session Stripe
CREATE INDEX IF NOT EXISTS idx_failed_refunds_session ON failed_refunds(stripe_session_id);

-- Index pour les non-traites (file de travail admin)
CREATE INDEX IF NOT EXISTS idx_failed_refunds_unprocessed ON failed_refunds(processed) WHERE processed = FALSE;

-- Commentaire explicatif
COMMENT ON TABLE failed_refunds IS 'Stocke les remboursements Stripe qui ont échoué (ex: double booking détecté après paiement). A traiter manuellement par l admin.';
