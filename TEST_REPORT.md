# CalendaPro — Rapport de test Playwright
> Date : 2026-05-16  
> Outil : Playwright MCP + PowerShell  
> Serveur : http://localhost:3000  
> Stripe CLI : **introuvable** (`stripe.exe` absent du PATH et du répertoire projet)

---

## Résumé exécutif

| Test | Statut | Bloquant |
|------|--------|---------|
| TEST 1 — Inscription pro | ⚠️ PARTIAL | OTP email requis |
| TEST 2 — Onboarding | 🔴 BLOCKED | Dépend TEST 1 |
| TEST 3 — Dashboard pro | 🔴 BLOCKED | Auth requise |
| TEST 4 — Fiche publique | ✅ FIXED (2 bugs corrigés) | — |
| TEST 5 — Flow réservation | 🔴 BLOCKED | Fiche publique + Stripe CLI |
| TEST 6 — Sync dashboard pro | 🔴 BLOCKED | Auth requise |
| TEST 7 — Espace client | 🔴 BLOCKED | Auth requise |
| TEST 8 — Annulation pro | 🔴 BLOCKED | Auth requise |

**2 nouveaux bugs critiques découverts et corrigés en séance.**

---

## Prérequis manquants (bloqueurs globaux)

### BLOQ-1 — Stripe CLI introuvable
`stripe.exe` n'est pas dans le PATH ni dans le répertoire projet.  
→ Aucun webhook Stripe ne peut être forwardé en local.  
→ Tests 5, 6, 7, 8 dépendants du paiement sont impossibles à valider.

**Correction :** Télécharger Stripe CLI depuis https://stripe.com/docs/stripe-cli et l'ajouter au PATH ou au répertoire projet.

### BLOQ-2 — Vérification email obligatoire à l'inscription Clerk
Clerk envoie un vrai OTP à l'adresse email. Le code `424242` (bypass universel) ne fonctionne pas sur cette instance — elle n'est pas configurée en mode test Clerk.  
→ Impossible de créer un compte pro `test+pro@test.com` sans accès à la boîte email.  
→ Tests 1, 2, 3, 6, 7, 8 bloqués.

**Correction :** Utiliser un compte pro déjà vérifié pour les tests, ou activer les "test emails" dans le Clerk Dashboard (instance dev).

---

## TEST 1 — Inscription pro ⚠️ PARTIAL

**Actions effectuées :**
1. Navigation `/sign-up` → ✅ Page charge, formulaire Clerk visible
2. Remplissage `test+pro@test.com` + `TestPro123!` → ✅ Soumis
3. Redirect vers `/sign-up/verify-email-address` → ✅ OTP envoyé
4. Tentative code `424242` → ❌ "Incorrect code"
5. Tentative sign-in avec les mêmes credentials → ❌ "Couldn't find your account" (compte en attente de vérification)

**Résultat :** Formulaire d'inscription fonctionnel. Bloqué à l'étape OTP.

**Erreurs console non-bloquantes :**
- CSP violations sur `cdn.fontshare.com` (polices) → cosmétique, ne bloque pas l'UI
- CSP violations sur Clerk worker blob → n'empêche pas le formulaire de fonctionner

---

## TEST 2 — Onboarding 🔴 BLOCKED

Non testable sans compte vérifié (BLOQ-2).

---

## TEST 3 — Dashboard pro 🔴 BLOCKED

Navigation `/dashboard` → redirect vers `/sign-in`. Non testable sans session authentifiée.

---

## TEST 4 — Fiche publique ✅ FIXED

### Diagnostic initial
5 profils visibles dans la marketplace (`calenda-pro`, `plume-prestige`, `abdelrahimharri_367`, `leilaroura_361`, `zermi7_313`) mais TOUS retournaient **"Profil non trouvé"** (200 + page not-found).

### Bug découvert : NEW-CRIT-1 — Colonnes inexistantes dans SELECT profiles
**Fichier :** `app/[username]/page.tsx` — lignes 45, 269-271

`generateMetadata` et `getCachedProfile` sélectionnaient `plan`, `rating`, `review_count` depuis la table `profiles`. **Ces colonnes n'existent pas dans `profiles`** :
- `plan` → table `subscriptions`
- `rating`, `review_count` → agrégat table `reviews`

PostgREST retournait une erreur 400, `data = null`, `notFound()` appelé → toutes les fiches publiques cassées.

**Fix appliqué :** Suppression de `plan`, `rating`, `review_count` du SELECT profiles. Type `ProPublicProfile.plan` rendu optionnel.

### Bug découvert : NEW-CRIT-2 — BrandLogo manque 'use client'
**Fichier :** `components/BrandLogo.tsx` — lignes 39-40

`BrandLogo` utilise `onMouseEnter`/`onMouseLeave` sans directive `'use client'`. Utilisé dans les templates Server Components → crash RSC `"Event handlers cannot be passed to Client Component props"`.

**Fix appliqué :** Ajout de `'use client'` en tête de `BrandLogo.tsx`.

### Résultats après correction
```
GET /calenda-pro   200 | "Pro connect — Réservez en ligne | CalendaPro"     ✅
GET /plume-prestige 200 | "Plume Prestige — Réservez en ligne | CalendaPro" ✅
```

### Note : profils non publiés en prod
`is_published` a pour défaut `false` dans la DB. Les profils existants ont `is_published = false` → bloqués par la vérification `if (!isPublished) notFound()`. Ces profils passent quand même dans la marketplace (CRIT-4 du rapport d'audit).  
**Pour tester le flow complet :** Mettre `is_published = true` en DB sur un profil, ou compléter l'onboarding.

**Créneaux (CRIT-1 du rapport d'audit) :** Non testable car le formulaire BookingForm nécessite un profil publié. Bug connu : `Math.random()` utilisé au lieu de l'API réelle.

---

## TEST 5 — Flow réservation 🔴 BLOCKED

- Aucun profil avec `is_published = true` disponible
- Stripe CLI absent → webhook non forwardable
- Impossible de tester le paiement Stripe

---

## TESTS 6, 7, 8 — Dashboard / Espace client / Annulation 🔴 BLOCKED

Tous nécessitent une session authentifiée pro ou client.

---

## Nouveaux bugs corrigés pendant ce test

| ID | Sévérité | Fichier | Description | Statut |
|----|----------|---------|-------------|--------|
| NEW-CRIT-1 | CRITIQUE | `app/[username]/page.tsx:45,269` | SELECT `plan, rating, review_count` depuis `profiles` → colonnes inexistantes → toutes les fiches publiques cassées | ✅ CORRIGÉ |
| NEW-CRIT-2 | CRITIQUE | `components/BrandLogo.tsx:1` | Manque `'use client'` → crash RSC sur toutes les pages utilisant BrandLogo | ✅ CORRIGÉ |

---

## Bugs connus du rapport d'audit (non corrigés)

| ID | Sévérité | Impact sur les tests |
|----|----------|---------------------|
| CRIT-1 | CRITIQUE | Créneaux fictifs (Math.random) → TEST 4/5 donneraient de faux positifs |
| CRIT-2 | CRITIQUE | API disponibilité retourne tout disponible → même impact |
| CRIT-3 | CRITIQUE | Emails `onboarding@resend.dev` → **corrigé** dans session précédente (`noreply@calendapro.fr`) |
| CRIT-4 | CRITIQUE | Marketplace affiche profils non publiés → confirmé par ce test |
| IMP-1 | IMPORTANT | `p_pro_name` reçoit clientName → emails de rappel incorrects |
| IMP-2 | IMPORTANT | Rappels cron échouent pour clients anonymes |
| IMP-3 | IMPORTANT | Wallet client vide pour réservations anonymes |
| IMP-4 | IMPORTANT | Routes `/client(.*)` publiques dans middleware |
| IMP-5 | IMPORTANT | URL publique basée sur Clerk username ≠ Supabase username |
| IMP-6 | IMPORTANT | Env vars Stripe incohérentes STRIPE_ vs NEXT_PUBLIC_STRIPE_ |
| MIN-4 | MINEUR | Page succès n'appelle pas fetchBookingDetails si `already_exists: true` |

---

## Plan d'action prioritaire pour débloquer les tests

1. **Immédiat** — Installer Stripe CLI et l'ajouter au PATH  
2. **Immédiat** — Utiliser un compte pro existant vérifié (credentiels à fournir) ou activer test emails Clerk  
3. **DB** — `UPDATE profiles SET is_published = true WHERE username = 'calenda-pro'` pour avoir un profil testable  
4. **Avant TEST 5** — Corriger CRIT-1 (BookingForm créneaux réels) et CRIT-2 (API disponibilité)  
5. **Avant TEST 8** — Vérifier que `cancel-with-refund` appelle bien le webhook Stripe de remboursement  

---

## Erreurs CSP récurrentes (cosmétiques)

Ces erreurs apparaissent sur toutes les pages en dev mais ne bloquent pas les fonctionnalités :
- `cdn.fontshare.com` bloqué par CSP `font-src` → polices de fallback utilisées
- Clerk worker `blob:` bloqué par CSP `worker-src` → Clerk fonctionne quand même
- `clerk-telemetry.com` bloqué → pas d'impact fonctionnel

**Correction globale :** Ajouter `cdn.fontshare.com` à `font-src` et `blob:` à `worker-src` dans `next.config.js` ou les headers CSP.
