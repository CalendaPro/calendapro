# CalendaPro E2E Test Suite

Suite de tests Playwright complète pour CalendaPro.

## Structure

```
tests/
├── e2e/
│   ├── pro/                    # Tests Professionnels
│   │   ├── auth.pro.spec.ts    # Inscription, connexion, déconnexion
│   │   ├── onboarding.spec.ts  # Wizard onboarding (4 étapes)
│   │   ├── dashboard.spec.ts   # Dashboard + navigation
│   │   ├── services.spec.ts    # CRUD services
│   │   ├── availability.spec.ts # Configuration disponibilités
│   │   ├── calendar.spec.ts    # Vue calendrier
│   │   ├── clients.spec.ts     # Gestion clients
│   │   ├── wallet.spec.ts      # Portefeuille pro
│   │   ├── settings.spec.ts    # Paramètres
│   │   └── stripe-connect.spec.ts # Stripe Connect
│   │
│   ├── client/                 # Tests Clients
│   │   ├── marketplace.spec.ts # Marketplace public
│   │   ├── fiche-pro.spec.ts   # Fiche pro publique
│   │   ├── booking-flow.spec.ts # Tunnel de réservation (CRITIQUE)
│   │   ├── auth-client.spec.ts # Auth client
│   │   └── client-wallet.spec.ts # Portefeuille client
│   │
│   ├── general/                # Tests Généraux
│   │   ├── landing.spec.ts     # Landing page
│   │   ├── legal.spec.ts       # Pages légales
│   │   ├── seo.spec.ts         # SEO meta tags
│   │   ├── performance.spec.ts # Performance
│   │   └── mobile.spec.ts      # Responsive mobile
│   │
│   └── api/                    # Tests API
│       ├── api-security.spec.ts    # Sécurité API
│       └── api-rate-limiting.spec.ts # Rate limiting
│
├── fixtures/                   # Données de test
│   ├── pro-user.ts
│   ├── client-user.ts
│   ├── stripe-cards.ts
│   └── mock-availability.ts
│
└── helpers/                    # Helpers réutilisables
    ├── login-pro.ts
    ├── login-client.ts
    └── setup-pro-profile.ts
```

## Commandes

```bash
# Tous les tests
npm run test:e2e

# Tests par catégorie
npm run test:e2e:pro     # Tests pro
npm run test:e2e:client  # Tests client
npm run test:e2e:api     # Tests API

# Mode UI (interface visuelle)
npm run test:e2e:ui

# Voir le rapport
npm run test:e2e:report
```

## Configuration

- **Navigateurs**: Chromium + Mobile Chrome (iPhone 12)
- **Base URL**: http://localhost:3000
- **Timeout**: 30s par test
- **Screenshots**: En cas d'échec
- **Vidéo**: Sur les tests qui échouent
- **Retries**: 1 retry en local, 2 en CI

## Prérequis

1. Serveur Next.js en cours d'exécution:
   ```bash
   npm run dev
   ```

2. Variables d'environnement configurées:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Utilisateurs de Test

### Pro
- Email: `test.pro.e2e@calendapro.test`
- Mot de passe: `TestPassword123!`

### Client
- Email: `test.client.e2e@calendapro.test`
- Mot de passe: `TestPassword123!`

## Cartes Stripe Test

- **Succès**: `4242 4242 4242 4242`
- **Refus**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## Architecture

Les tests utilisent le pattern Page Object Model implicite avec:
- **Fixtures**: Données réutilisables
- **Helpers**: Actions communes (login, setup)
- **Selectors robustes**: Labels textuels + data-testid
- **Retry logic**: Assertions avec timeout adaptatif
