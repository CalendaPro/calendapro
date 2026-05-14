-- ═══════════════════════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES - Audit #7 CalendaPro
-- Cibles: Marketplace <2s, Dashboard <1.5s, Fiche pro <1s, API <200ms
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ACTIVATION DES EXTENSIONS POSTGRES REQUISES                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Extensions nécessaires pour les index géospatiaux (cube et earthdistance)
-- Ces extensions sont déjà incluses dans Supabase mais doivent être activées
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 1. BOOKINGS - Index composite optimisé                                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index principal pour le calendrier pro (déjà existant mais amélioré)
CREATE INDEX IF NOT EXISTS idx_bookings_pro_scheduled_status
ON bookings(pro_id, scheduled_at, status)
WHERE status != 'cancelled';

-- Index pour les requêtes par statut et date (dashboard stats)
CREATE INDEX IF NOT EXISTS idx_bookings_pro_status_scheduled
ON bookings(pro_id, status, scheduled_at DESC);

-- Index pour les requêtes client (espace client)
CREATE INDEX IF NOT EXISTS idx_bookings_client_scheduled
ON bookings(client_id, scheduled_at DESC)
WHERE client_id IS NOT NULL;

-- Index pour les filtres par date (dashboard appointments)
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_pro
ON bookings(scheduled_at DESC, pro_id)
WHERE status != 'cancelled';

-- Index pour les requêtes de conflits de créneaux
CREATE INDEX IF NOT EXISTS idx_bookings_conflict_check
ON bookings(pro_id, scheduled_at, duration_minutes, status)
WHERE status NOT IN ('cancelled', 'no_show');

-- Index pour les analytics (source_channel, created_at)
CREATE INDEX IF NOT EXISTS idx_bookings_pro_created_source
ON bookings(pro_id, created_at DESC, source_channel)
WHERE source_channel IS NOT NULL;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 2. PROFILES - Index pour marketplace et recherches                           │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index unique pour la recherche par username (marketplace + fiche pro)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
ON profiles(username)
WHERE username IS NOT NULL;

-- Index pour la recherche par clerk_user_id (auth)
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id
ON profiles(id);

-- Index pour les filtres marketplace (catégorie + ville)
CREATE INDEX IF NOT EXISTS idx_profiles_category_city
ON profiles(category, city)
WHERE username IS NOT NULL AND full_name IS NOT NULL;

-- Index pour la recherche textuelle (full_name, bio)
CREATE INDEX IF NOT EXISTS idx_profiles_fulltext
ON profiles USING gin(to_tsvector('french', coalesce(full_name, '') || ' ' || coalesce(bio, '')));

-- Index géospatial pour les recherches par proximité (PostGIS)
-- Nécessite les extensions cube et earthdistance (activées ci-dessus)
DO $$
BEGIN
  -- Vérifier si les extensions sont disponibles
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname IN ('cube', 'earthdistance')) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_location
    ON profiles USING gist(ll_to_earth(latitude::float, longitude::float))
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    
    RAISE NOTICE 'Index géospatial idx_profiles_location créé avec succès.';
  ELSE
    RAISE WARNING 'Extensions cube/earthdistance non disponibles. Index géospatial ignoré.';
  END IF;
END $$;

-- Note: la colonne 'plan' est dans la table 'subscriptions', pas 'profiles'
-- Index sur subscriptions pour récupérer le plan actif d'un pro (déjà présent plus bas)

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 3. SERVICES - Index pour les requêtes par pro                                │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour récupérer les services d'un pro
CREATE INDEX IF NOT EXISTS idx_services_user_id
ON services(user_id);

-- Index pour les prix (marketplace min price calculation)
CREATE INDEX IF NOT EXISTS idx_services_user_price
ON services(user_id, price);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 4. SLOT_HOLDS - Index pour expiration et nettoyage                           │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour la récupération des holds actifs par pro (sans NOW() - non immutable)
CREATE INDEX IF NOT EXISTS idx_slot_holds_pro_expires
ON slot_holds(pro_id, expires_at);

-- Index pour le nettoyage des holds expirés (cron job) - sans NOW()
CREATE INDEX IF NOT EXISTS idx_slot_holds_expired
ON slot_holds(expires_at);

-- Index pour la vérification des conflits (vérifie si un créneau est déjà holdé)
CREATE INDEX IF NOT EXISTS idx_slot_holds_pro_scheduled
ON slot_holds(pro_id, scheduled_at)
WHERE status = 'active';

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 5. NOTIFICATION_QUEUE - Index pour le cron et retry                          │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour le cron de notifications (pending + retry)
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
ON notification_queue(status, next_retry_at, created_at)
WHERE status IN ('pending', 'failed');

-- Index pour les stats par booking
CREATE INDEX IF NOT EXISTS idx_notification_queue_booking
ON notification_queue(booking_id, status);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 6. WEBHOOK_EVENTS_LOG - Index pour idempotence et debug                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour la vérification d'idempotence (Stripe webhook) - déjà UNIQUE dans table
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events_log(stripe_event_id); -- Déjà couvert par contrainte UNIQUE

-- Index pour les requêtes par statut traitement (processed = boolean, pas status)
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed
ON webhook_events_log(processed, created_at DESC);

-- Index pour les recherches par type d'événement
CREATE INDEX IF NOT EXISTS idx_webhook_events_type
ON webhook_events_log(event_type, created_at DESC);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 7. SUBSCRIPTIONS - Index pour les requêtes par user et status                │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour la récupération de l'abonnement actif
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status, plan)
WHERE status = 'active';

-- Index pour les requêtes de plan par user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_plan
ON subscriptions(user_id, plan, current_period_end);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 8. REVIEWS - Index pour les aggrégations (marketplace ratings)               │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour le calcul des notes moyennes par pro
CREATE INDEX IF NOT EXISTS idx_reviews_pro_rating
ON reviews(pro_id, rating);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 9. CLIENT_PROFILES - Index pour les recherches rapides                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour la recherche par user_id (la colonne email n'existe pas dans cette table)
CREATE INDEX IF NOT EXISTS idx_client_profiles_user
ON client_profiles(user_id);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 10. CONNECT_TRANSACTIONS - Index pour le wallet dashboard                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour les transactions par pro
CREATE INDEX IF NOT EXISTS idx_connect_transactions_pro
ON connect_transactions(pro_id, created_at DESC);

-- Index pour les transactions par statut
CREATE INDEX IF NOT EXISTS idx_connect_transactions_status
ON connect_transactions(pro_id, status, created_at DESC);

-- Index pour les recherches par Stripe payment intent
CREATE INDEX IF NOT EXISTS idx_connect_transactions_pi
ON connect_transactions(stripe_payment_id)
WHERE stripe_payment_id IS NOT NULL;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 11. PULSE TABLES - Index pour l'engine Pulse                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Index pour les patterns client
CREATE INDEX IF NOT EXISTS idx_pulse_client_patterns
ON pulse_client_patterns(pro_id, client_id);

-- Index pour les règles de pricing dynamique (enabled = boolean, pas status)
CREATE INDEX IF NOT EXISTS idx_pulse_pricing_rules
ON pulse_pricing_rules(pro_id, enabled)
WHERE enabled = true;

-- Index pour les slots discountés (booked/expired = booleans, pas status)
CREATE INDEX IF NOT EXISTS idx_pulse_discounted_slots
ON pulse_discounted_slots(pro_id, slot_time)
WHERE booked = false AND expired = false;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 12. FAVORITES - Index pour les requêtes client                                │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- Note: la table favorites n'a pas de colonne status (juste client_id, pro_id, created_at)

-- Index pour les favoris par client
CREATE INDEX IF NOT EXISTS idx_favorites_client
ON favorites(client_id, created_at DESC);

-- Index pour vérifier si un pro est favori (PK composite déjà index, mais redondant pour clarté)
-- CREATE INDEX IF NOT EXISTS idx_favorites_pro_client ON favorites(pro_id, client_id); -- Déjà couvert par PK

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ MAINTENANCE - Fonction de nettoyage des index fragmentés                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Commentaire pour le suivi
COMMENT ON INDEX idx_bookings_pro_scheduled_status IS 'Index critique pour le calendrier pro - Audit #7';
COMMENT ON INDEX idx_profiles_username IS 'Index unique pour la recherche marketplace - Audit #7';
COMMENT ON INDEX idx_slot_holds_pro_expires IS 'Index pour la gestion des holds de créneaux - Audit #7';
COMMENT ON INDEX idx_webhook_events_processed IS 'Index pour le suivi des webhooks traités - Audit #7';
