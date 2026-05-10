# CalendaPro — Checklist Deploiement Vercel

## Variables d'environnement a configurer sur Vercel

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Clerk
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

### Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_INFINITY_PRICE_ID`
- `STRIPE_PREMIUM_PRICE_ID` (mirror server-side des price IDs)
- `STRIPE_INFINITY_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_SMS_50_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_SMS_200_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_SMS_500_PRICE_ID`

### Twilio
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### Resend
- `RESEND_API_KEY`

### Google Calendar
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### AI (optionnel)
- `ANTHROPIC_API_KEY` (generateur de bio et posts Instagram)

### App
- `NEXT_PUBLIC_APP_URL` (ex: https://calendapro.fr)
- `CRON_SECRET` (chaine aleatoire longue pour securiser les endpoints cron)
- `INTERNAL_API_SECRET` (optionnel, appels internes API-to-API)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (optionnel, Google Search Console)

## Migrations SQL a executer dans Supabase

Executer dans l'ordre chronologique des timestamps :

```
20250412150000_add_layout_and_theme_columns.sql
20250412160000_add_dashboard_layout.sql
20260329100000_subscriptions.sql
20260329120000_marketplace_pros_near.sql
20260329140000_profile_booking_payment_settings.sql
20260406000000_profile_role_onboarding.sql
20260410000000_client_bookings_favorites_reviews.sql
20260411000000_pulse_engine.sql
20260411100000_scarcity_waitlist.sql
20260411100000_services_description.sql
20260411200000_onboarding_design_fields.sql
20260411235000_add_missing_payment_columns.sql
20260412000000_notifications.sql
20260412100000_search_reminders.sql
20260412300000_profiles_site_builder.sql
20260412400000_profiles_complete.sql
20260412500000_profiles_final_complete.sql
20260412600000_profiles_theme_mode.sql
20260412700000_profiles_site_settings.sql
20260412900000_cancellation_policy.sql
20260412950000_dashboard_layouts.sql
20260413000000_client_profiles.sql
20260413140000_onboarding_tracking.sql
20260413150000_marketing_sniper_tracking.sql
20260413160000_appointments_tracking.sql
20260413170000_calendapay_wallet.sql
20260413190000_hybrid_avatar_system.sql
20260413200000_marketplace_referral_count.sql
20260416000000_auto_confirm_notification_queue.sql
20260416140000_add_bookings_client_fk.sql
20260416160000_add_cancellation_reason.sql
20260416170000_add_name_to_client_profiles.sql
20260416180000_enable_bookings_realtime.sql
20260418000000_failed_refunds_table.sql
20260419_perf_indexes.sql
20260420100000_fix_fk_and_schema.sql
20260420100100_fix_rls_policies.sql
20260420100200_booking_conflict_atomic.sql
20260420100300_notification_queue_retry.sql
20260420100400_neutralize_dead_appointments.sql
20260423000000_calendar_sync_availability.sql
20260423100000_stripe_connect.sql
20260423200000_stripe_connect_complete.sql
20260424200000_webhook_retry_queue.sql
20260424300000_rls_audit.sql
20260425000000_edge_case_audit_timezone.sql
20260425000100_edge_case_audit_pro_deletion.sql
20260425000200_edge_case_audit_plan_limits.sql
20260425000300_edge_case_audit_slot_hold.sql
20260425100000_performance_indexes.sql
20260425100001_get_pro_photos_rpc.sql
20260425200000_advisory_lock_functions.sql
20260425200001_rate_limit_table_and_function.sql
20260425200002_email_queue_table.sql
20260425200003_wallet_atomic_balance.sql
20260425200004_webhook_failed_bookings.sql
20260426000000_add_notification_preferences.sql
20260426000100_favorites_table.sql
```

## Webhooks a configurer

### Stripe
- URL : `https://calendapro.fr/api/stripe/webhook`
- Events :
  - `checkout.session.completed`
  - `charge.refunded`
  - `payment_intent.payment_failed`

### Clerk
- URL : `https://calendapro.fr/api/clerk/webhook`
- Events :
  - `user.created`
  - `user.updated`

## Crons Vercel (automatiques via vercel.json)

- `/api/cron/notifications` — toutes les 5 minutes
- `/api/reminders/check` — toutes les heures

## Verification post-deploiement

- [ ] Page d'accueil charge en < 3 secondes
- [ ] Inscription pro fonctionne (Clerk sign-up → onboarding → dashboard)
- [ ] Page publique pro accessible (`/username`)
- [ ] Reservation client fonctionne (marketplace → pro → booking → Stripe)
- [ ] Paiement Stripe fonctionne (checkout → webhook → booking cree)
- [ ] Email de confirmation recu (Resend)
- [ ] Dashboard pro affiche les donnees (stats, bookings, clients)
- [ ] Widget embeddable fonctionne en iframe
- [ ] Crons s'executent (verifier logs Vercel)
- [ ] SMS de rappel envoyes (si Twilio configure)

> Remplace chaque variable par la vraie valeur dans les settings Vercel — jamais dans le code.
