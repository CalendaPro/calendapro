-- Migration: Add tracking columns to appointments table
-- For Marketing Sniper Intelligence System

-- Add source_channel column to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS source_channel TEXT,
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255),
ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN appointments.source_channel IS 'Canal d acquisition (instagram, tiktok, facebook, google, direct, etc.)';

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_appointments_source_channel ON appointments(source_channel) 
WHERE source_channel IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_source_date ON appointments(source_channel, date) 
WHERE source_channel IS NOT NULL;

-- Function to calculate LTV by source using appointments table
CREATE OR REPLACE FUNCTION calculate_ltv_by_source(
    p_pro_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    source_channel VARCHAR(50),
    client_count BIGINT,
    booking_count BIGINT,
    total_revenue DECIMAL,
    average_basket DECIMAL,
    retention_rate INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(a.source_channel, 'direct')::VARCHAR(50) as source_channel,
        COUNT(DISTINCT a.client_id) as client_count,
        COUNT(*) as booking_count,
        0::DECIMAL as total_revenue, -- Appointments don't have price directly
        0::DECIMAL as average_basket,
        0::INTEGER as retention_rate
    FROM appointments a
    WHERE a.user_id = p_pro_id
        AND a.created_at >= NOW() - INTERVAL '1 day' * p_days
        AND a.status IN ('pending', 'confirmed', 'completed')
    GROUP BY a.source_channel
    ORDER BY client_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get acquisition trends using appointments
CREATE OR REPLACE FUNCTION get_acquisition_trends(
    p_pro_id UUID,
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
        DATE(a.created_at) as date,
        COALESCE(a.source_channel, 'direct')::VARCHAR(50) as source_channel,
        COUNT(DISTINCT a.client_id) as client_count,
        0::DECIMAL as revenue,
        COUNT(DISTINCT CASE WHEN a.created_at >= NOW() - INTERVAL '1 day' * p_days 
                           THEN a.client_id END) as new_clients
    FROM appointments a
    WHERE a.user_id = p_pro_id
        AND a.created_at >= NOW() - INTERVAL '1 day' * p_days
        AND a.status IN ('pending', 'confirmed', 'completed')
    GROUP BY DATE(a.created_at), a.source_channel
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update acquisition_metrics function to use appointments table
CREATE OR REPLACE FUNCTION update_acquisition_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update metrics for the booking date
    INSERT INTO acquisition_metrics (
        pro_id,
        source_channel,
        date,
        client_count,
        revenue,
        created_at
    )
    VALUES (
        NEW.user_id,
        COALESCE(NEW.source_channel, 'direct'),
        DATE(NEW.date),
        1,
        0, -- Appointments don't have price directly, would need to join with services
        NOW()
    )
    ON CONFLICT (pro_id, source_channel, date)
    DO UPDATE SET
        client_count = acquisition_metrics.client_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_update_acquisition_metrics ON appointments;

CREATE TRIGGER trg_update_acquisition_metrics
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_acquisition_metrics();
