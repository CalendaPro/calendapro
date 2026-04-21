-- Index critiques pour les performances CalendaPro
-- A executer dans Supabase Dashboard > SQL Editor

-- Index principal pour le calendrier pro
CREATE INDEX IF NOT EXISTS idx_bookings_pro_scheduled
ON bookings(pro_id, scheduled_at)
WHERE status != 'cancelled';

-- Index pour les stats dashboard (filtrage par statut)
CREATE INDEX IF NOT EXISTS idx_bookings_pro_status
ON bookings(pro_id, status, scheduled_at);

-- Index pour le flux client
CREATE INDEX IF NOT EXISTS idx_bookings_client
ON bookings(client_id, scheduled_at);

-- Index pour la table client_profiles
CREATE INDEX IF NOT EXISTS idx_client_profiles_user
ON client_profiles(user_id);

-- Index pour les notifications en attente
CREATE INDEX IF NOT EXISTS idx_notification_queue_status
ON notification_queue(status, created_at)
WHERE status = 'pending';

-- Ces index doivent etre executes manuellement dans Supabase SQL Editor.
-- Ils n'affectent pas le schema, seulement les performances des queries.
