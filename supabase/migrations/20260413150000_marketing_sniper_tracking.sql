-- Migration: Marketing Sniper Intelligence System
-- Created: 2026-04-13

-- 1. Ajouter tracking aux bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS source_channel VARCHAR(50) DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255),
ADD COLUMN IF NOT EXISTS referrer_url TEXT;

COMMENT ON COLUMN bookings.source_channel IS 'Canal d acquisition: instagram, tiktok, facebook, google, email, wom, direct, other';
COMMENT ON COLUMN bookings.utm_source IS 'UTM source parameter';
COMMENT ON COLUMN bookings.utm_medium IS 'UTM medium parameter';
COMMENT ON COLUMN bookings.utm_campaign IS 'UTM campaign parameter';
COMMENT ON COLUMN bookings.referrer_url IS 'URL referer complet';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_bookings_source_channel ON bookings(source_channel);
CREATE INDEX IF NOT EXISTS idx_bookings_pro_source ON bookings(pro_id, source_channel);
CREATE INDEX IF NOT EXISTS idx_bookings_created_source ON bookings(created_at, source_channel);

-- 2. Ajouter colonnes aux profiles pour tracking config
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS referral_program_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_bonus_amount DECIMAL(10,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS custom_tracking_url VARCHAR(255);

COMMENT ON COLUMN profiles.tracking_enabled IS 'Pro peut disable tracking pour privacy';
COMMENT ON COLUMN profiles.referral_program_enabled IS 'Programme de parrainage activé';
COMMENT ON COLUMN profiles.referral_bonus_amount IS 'Montant du bonus par parrainage';
COMMENT ON COLUMN profiles.custom_tracking_url IS 'URL personnalisée pour tracking';

-- 3. Table de tracking des parrainages
CREATE TABLE IF NOT EXISTS referral_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referrer_client_id UUID REFERENCES client_profiles(id) ON DELETE SET NULL,
    referred_client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    referred_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    bonus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid', 'cancelled')),
    
    -- Métadonnées
    source_channel VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Contrainte unique: un client ne peut être parrainé qu'une fois
    CONSTRAINT unique_referred UNIQUE (referred_client_id)
);

COMMENT ON TABLE referral_tracking IS 'Tracking des parrainages clients pour le Pro';

CREATE INDEX IF NOT EXISTS idx_referral_tracking_pro ON referral_tracking(pro_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_client_id);

-- 4. Table de métriques d'acquisition (agrégation par jour)
CREATE TABLE IF NOT EXISTS acquisition_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source_channel VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    
    -- Métriques
    client_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    new_clients INTEGER DEFAULT 0,
    returning_clients INTEGER DEFAULT 0,
    
    -- Calculated metrics
    average_basket DECIMAL(10,2),
    conversion_rate DECIMAL(5,2), -- pourcentage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Contrainte unique: une métrique par source par jour
    CONSTRAINT unique_pro_source_date UNIQUE (pro_id, source_channel, date)
);

COMMENT ON TABLE acquisition_metrics IS 'Métriques d acquisition agrégées par jour pour analytics rapides';

CREATE INDEX IF NOT EXISTS idx_acquisition_metrics_pro_date ON acquisition_metrics(pro_id, date);
CREATE INDEX IF NOT EXISTS idx_acquisition_metrics_source ON acquisition_metrics(source_channel);

-- 5. Table pour les conseils marketing générés par l'IA
CREATE TABLE IF NOT EXISTS marketing_advice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Contenu du conseil
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    icon VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action TEXT NOT NULL,
    content_suggestion TEXT,
    
    -- Métriques associées
    related_source VARCHAR(50),
    estimated_revenue_impact DECIMAL(10,2),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_actioned BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE -- Conseils expirent après 7 jours par défaut
);

COMMENT ON TABLE marketing_advice IS 'Conseils marketing générés par l IA pour le Pro';

CREATE INDEX IF NOT EXISTS idx_marketing_advice_pro ON marketing_advice(pro_id);
CREATE INDEX IF NOT EXISTS idx_marketing_advice_priority ON marketing_advice(priority, is_read);
CREATE INDEX IF NOT EXISTS idx_marketing_advice_created ON marketing_advice(created_at);

-- 6. Fonction pour calculer LTV par source
DROP FUNCTION IF EXISTS calculate_ltv_by_source(UUID, INTEGER);
DROP FUNCTION IF EXISTS calculate_ltv_by_source(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION calculate_ltv_by_source(
    p_pro_id TEXT,
    p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    source_channel VARCHAR(50),
    client_count BIGINT,
    total_revenue DECIMAL,
    average_basket DECIMAL,
    retention_rate DECIMAL,
    booking_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.source_channel,
        COUNT(DISTINCT b.client_id) as client_count,
        COALESCE(SUM(b.amount), 0) as total_revenue,
        COALESCE(AVG(b.amount), 0) as average_basket,
        -- Taux de rétention: clients avec 2+ bookings / total clients
        CASE 
            WHEN COUNT(DISTINCT b.client_id) > 0 THEN
                ROUND(
                    (COUNT(DISTINCT CASE WHEN client_bookings.count > 1 THEN b.client_id END)::DECIMAL 
                     / COUNT(DISTINCT b.client_id) * 100), 
                    2
                )
            ELSE 0
        END as retention_rate,
        COUNT(*) as booking_count
    FROM bookings b
    LEFT JOIN (
        SELECT client_id, COUNT(*) as count
        FROM bookings
        WHERE pro_id = p_pro_id
            AND created_at >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY client_id
    ) client_bookings ON b.client_id = client_bookings.client_id
    WHERE b.pro_id = p_pro_id
        AND b.created_at >= NOW() - INTERVAL '1 day' * p_days
        AND b.status IN ('confirmed', 'completed', 'paid')
    GROUP BY b.source_channel
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_ltv_by_source IS 'Calcule les métriques LTV par canal d acquisition';

-- 7. Fonction pour obtenir les tendances d'acquisition
DROP FUNCTION IF EXISTS get_acquisition_trends(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_acquisition_trends(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION get_acquisition_trends(
    p_pro_id TEXT,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    source_channel VARCHAR(50),
    client_count BIGINT,
    revenue DECIMAL,
    new_clients BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(b.created_at) as date,
        b.source_channel,
        COUNT(DISTINCT b.client_id) as client_count,
        COALESCE(SUM(b.amount), 0) as revenue,
        COUNT(DISTINCT CASE WHEN cb.created_at >= NOW() - INTERVAL '1 day' * p_days 
                           THEN b.client_id END) as new_clients
    FROM bookings b
    LEFT JOIN client_profiles cb ON b.client_id = cb.id
    WHERE b.pro_id = p_pro_id
        AND b.created_at >= NOW() - INTERVAL '1 day' * p_days
        AND b.status IN ('confirmed', 'completed', 'paid')
    GROUP BY DATE(b.created_at), b.source_channel
    ORDER BY date DESC, revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_acquisition_trends IS 'Retourne les tendances d acquisition par jour';

-- 8. Fonction pour générer des conseils marketing
DROP FUNCTION IF EXISTS generate_marketing_advice(UUID);
DROP FUNCTION IF EXISTS generate_marketing_advice(TEXT);
CREATE OR REPLACE FUNCTION generate_marketing_advice(
    p_pro_id TEXT
)
RETURNS TABLE (
    priority VARCHAR(20),
    icon VARCHAR(10),
    title TEXT,
    description TEXT,
    action TEXT,
    content_suggestion TEXT,
    estimated_revenue_impact DECIMAL
) AS $$
DECLARE
    v_top_source RECORD;
    v_second_source RECORD;
    v_worst_source RECORD;
    v_wom_metrics RECORD;
    v_total_revenue DECIMAL;
BEGIN
    -- Récupérer les métriques LTV
    SELECT * INTO v_top_source FROM calculate_ltv_by_source(p_pro_id, 90) LIMIT 1;
    SELECT * INTO v_second_source FROM calculate_ltv_by_source(p_pro_id, 90) OFFSET 1 LIMIT 1;
    SELECT * INTO v_worst_source FROM calculate_ltv_by_source(p_pro_id, 90) 
    ORDER BY total_revenue ASC LIMIT 1;
    
    -- Récupérer métriques WOM
    SELECT * INTO v_wom_metrics FROM calculate_ltv_by_source(p_pro_id, 90) 
    WHERE source_channel = 'wom' LIMIT 1;
    
    SELECT COALESCE(SUM(total_revenue), 0) INTO v_total_revenue 
    FROM calculate_ltv_by_source(p_pro_id, 90);
    
    -- Conseil 1: Dominer la meilleure source
    IF v_top_source.source_channel IS NOT NULL THEN
        priority := 'high';
        icon := '🎯';
        title := v_top_source.source_channel || ' est TON canal golden';
        description := v_top_source.client_count || ' clients, €' || ROUND(v_top_source.total_revenue, 2) || ' générés, panier moyen €' || ROUND(v_top_source.average_basket, 2);
        action := 'Double down sur ' || v_top_source.source_channel || ' maintenant';
        content_suggestion := 'Poste Avant/Après transformation à l heure optimale';
        estimated_revenue_impact := ROUND(v_top_source.total_revenue * 0.3, 2);
        RETURN NEXT;
    END IF;
    
    -- Conseil 2: Booster la deuxième source
    IF v_second_source.source_channel IS NOT NULL AND 
       v_second_source.client_count < v_top_source.client_count * 0.5 THEN
        priority := 'medium';
        icon := '📈';
        title := v_second_source.source_channel || ' a du potentiel non exploité';
        description := 'Seulement ' || v_second_source.client_count || ' clients vs ' || v_top_source.client_count || ' sur ' || v_top_source.source_channel;
        action := 'Poste 3x par semaine sur ' || v_second_source.source_channel;
        content_suggestion := 'Utilise les trending sounds + transformation';
        estimated_revenue_impact := ROUND(v_second_source.total_revenue * 0.5, 2);
        RETURN NEXT;
    END IF;
    
    -- Conseil 3: Programme de parrainage
    IF v_wom_metrics.retention_rate > 85 OR v_wom_metrics.retention_rate IS NULL THEN
        priority := 'high';
        icon := '👂';
        title := 'Crée un programme de parrainage';
        description := COALESCE(
            'Bouche-à-oreille = ' || v_wom_metrics.retention_rate || '% de fidélité',
            'Le bouche-à-oreille a le meilleur taux de rétention'
        );
        action := 'Offre €10 à chaque client qui ramène un ami';
        content_suggestion := 'Envoie message personnalisé aux 5 meilleurs clients';
        estimated_revenue_impact := ROUND(v_total_revenue * 0.15, 2);
        RETURN NEXT;
    END IF;
    
    -- Conseil 4: Améliorer la source faible
    IF v_worst_source.source_channel IS NOT NULL AND 
       v_worst_source.source_channel != v_top_source.source_channel THEN
        priority := 'low';
        icon := '🔧';
        title := 'Optimise ton ' || v_worst_source.source_channel;
        description := 'Panier moyen de €' || ROUND(v_worst_source.average_basket, 2) || ' vs €' || ROUND(v_top_source.average_basket, 2) || ' sur ' || v_top_source.source_channel;
        action := 'Teste un nouveau format de contenu sur ' || v_worst_source.source_channel;
        content_suggestion := 'Analyse ce qui marche sur ' || v_top_source.source_channel || ' et adapte';
        estimated_revenue_impact := ROUND(v_worst_source.total_revenue * 0.2, 2);
        RETURN NEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_marketing_advice IS 'Génère des conseils marketing basés sur les données LTV';

-- 9. Trigger pour mettre à jour acquisition_metrics automatiquement
CREATE OR REPLACE FUNCTION update_acquisition_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Upsert les métriques pour ce jour
    INSERT INTO acquisition_metrics (
        pro_id, source_channel, date, client_count, booking_count, revenue, new_clients
    )
    SELECT 
        NEW.pro_id,
        NEW.source_channel,
        DATE(NEW.created_at),
        COUNT(DISTINCT client_id),
        COUNT(*),
        SUM(amount),
        COUNT(DISTINCT client_id) -- Simplifié, à améliorer
    FROM bookings
    WHERE pro_id = NEW.pro_id 
        AND source_channel = NEW.source_channel
        AND DATE(created_at) = DATE(NEW.created_at)
        AND status IN ('confirmed', 'completed', 'paid')
    GROUP BY pro_id, source_channel, DATE(created_at)
    ON CONFLICT (pro_id, source_channel, date) 
    DO UPDATE SET
        client_count = EXCLUDED.client_count,
        booking_count = EXCLUDED.booking_count,
        revenue = EXCLUDED.revenue,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur bookings
DROP TRIGGER IF EXISTS trg_update_acquisition_metrics ON bookings;
CREATE TRIGGER trg_update_acquisition_metrics
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status IN ('confirmed', 'completed', 'paid'))
    EXECUTE FUNCTION update_acquisition_metrics();

-- 10. RLS Policies

-- Referral tracking
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pro can view own referrals" ON referral_tracking;
CREATE POLICY "Pro can view own referrals"
    ON referral_tracking FOR SELECT
    USING (pro_id = auth.uid()::text);

DROP POLICY IF EXISTS "Pro can insert own referrals" ON referral_tracking;
CREATE POLICY "Pro can insert own referrals"
    ON referral_tracking FOR INSERT
    WITH CHECK (pro_id = auth.uid()::text);

-- Acquisition metrics
ALTER TABLE acquisition_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pro can view own metrics" ON acquisition_metrics;
CREATE POLICY "Pro can view own metrics"
    ON acquisition_metrics FOR SELECT
    USING (pro_id = auth.uid()::text);

-- Marketing advice
ALTER TABLE marketing_advice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pro can view own advice" ON marketing_advice;
CREATE POLICY "Pro can view own advice"
    ON marketing_advice FOR SELECT
    USING (pro_id = auth.uid()::text);

DROP POLICY IF EXISTS "Pro can update own advice" ON marketing_advice;
CREATE POLICY "Pro can update own advice"
    ON marketing_advice FOR UPDATE
    USING (pro_id = auth.uid()::text);

DROP POLICY IF EXISTS "Pro can dismiss own advice" ON marketing_advice;
CREATE POLICY "Pro can dismiss own advice"
    ON marketing_advice FOR DELETE
    USING (pro_id = auth.uid()::text);

-- 11. Vue pour le dashboard - résumé acquisition
CREATE OR REPLACE VIEW acquisition_summary AS
SELECT 
    am.pro_id,
    am.source_channel,
    SUM(am.client_count) as total_clients,
    SUM(am.revenue) as total_revenue,
    AVG(am.average_basket) as avg_basket,
    SUM(am.booking_count) as total_bookings,
    MAX(am.date) as last_activity
FROM acquisition_metrics am
WHERE am.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY am.pro_id, am.source_channel;

COMMENT ON VIEW acquisition_summary IS 'Vue résumée des métriques d acquisition pour le dashboard';

-- 12. Vue top referrers pour le dashboard
DROP VIEW IF EXISTS top_referrers;
CREATE VIEW top_referrers AS
SELECT 
    rt.pro_id,
    cp.user_id::text as referrer_name,
    COUNT(*) as referral_count,
    SUM(rt.bonus_amount) as total_bonus_earned,
    MIN(rt.created_at) as first_referral,
    MAX(rt.created_at) as last_referral
FROM referral_tracking rt
JOIN client_profiles cp ON rt.referrer_client_id = cp.id
WHERE rt.status = 'completed'
GROUP BY rt.pro_id, cp.user_id
ORDER BY referral_count DESC;

COMMENT ON VIEW top_referrers IS 'Classement des meilleurs prescripteurs par Pro';
