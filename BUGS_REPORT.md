# CalendaPro — Rapport d'audit fonctionnel

> Audit complet du code source sur 10 flux fonctionnels.  
> Date : 2026-05-13  
> Scope : Next.js (App Router) + Supabase + Clerk + Stripe

---

## Résumé exécutif

| Priorité | Nombre |
|----------|--------|
| CRITIQUE | 4 |
| IMPORTANT | 8 |
| MINEUR | 5 |
| **Total** | **17** |

---

## CRITIQUE — Bloquants production

---

### [CRIT-1] BookingForm affiche des créneaux fictifs via `Math.random()`

**Fichier :** `app/[username]/BookingForm.tsx` — ligne **24**

```ts
slots.push({ time: `${hour.toString().padStart(2, '0')}:30`, label: `${hour}h30`, available: Math.random() > 0.3 }) // Simulate availability
```

**Description :**  
La fonction `generateTimeSlots()` génère des créneaux de 8h à 20h (par pas de 30 min) et marque aléatoirement 30 % des créneaux comme « indisponibles » via `Math.random() > 0.3`. Ce comportement aléatoire est **recalculé à chaque sélection de date** (via `useEffect`). L'API réelle de disponibilité `/api/public/[username]/availability` n'est **jamais appelée** par ce composant.

**Impact :**
- Un créneau déjà réservé peut apparaître comme disponible → double réservation possible côté UX.
- Un créneau libre peut apparaître comme indisponible → perte de clients.
- L'état des créneaux change à chaque rendu (boutons qui clignotent).

**Correction suggérée :**  
Supprimer `generateTimeSlots()` et appeler `/api/public/[username]/availability?date=YYYY-MM-DD` depuis un `useEffect` déclenché sur `selectedDate`. Gérer l'état `loading` pendant le fetch.

---

### [CRIT-2] API de disponibilité ignore l'agenda du pro et les réservations existantes

**Fichier :** `app/api/public/[username]/availability/route.ts` — lignes **11–13**

```ts
for (let hour = 9; hour < 19; hour++) {
  slots.push({ time: `${hour.toString().padStart(2, '0')}:00`, available: true })
}
```

**Description :**  
L'endpoint retourne systématiquement des créneaux horaires de 9h à 19h avec des intervalles de 60 min, tous marqués `available: true`. Il ne consulte :
- ni les heures de travail paramétrées par le pro dans son profil,
- ni les réservations existantes (`bookings` table),
- ni la durée du service sélectionné.

**Impact :**  
Même si CRIT-1 était corrigé et que le front appelait cette API, les données retournées seraient fausses : tous les créneaux déjà réservés apparaîtraient disponibles.

**Correction suggérée :**  
1. Lire le planning du pro depuis `profiles` (champ `working_hours` ou table dédiée).  
2. Requêter les bookings actifs du jour (`scheduled_at`, `duration_mins`) pour le pro.  
3. Exclure les créneaux en conflit en tenant compte de la durée du service.

---

### [CRIT-3] Tous les emails transactionnels partent de `onboarding@resend.dev` (adresse sandbox)

**Fichier :** `lib/emails.ts` — lignes **33, 108, 197, 412, 457, 493, 543, 596, 659, 707** (10 occurrences)

```ts
from: 'CalendaPro <onboarding@resend.dev>',
```

**Description :**  
`onboarding@resend.dev` est l'adresse sandbox de Resend. En mode sandbox, Resend **n'envoie les emails qu'aux adresses vérifiées** dans le compte. En production, tous les emails transactionnels (confirmations de réservation, rappels, factures, wallet, bienvenue, etc.) seront silencieusement rejetés ou bloqués pour tout destinataire non vérifié.

**Impact :**  
Aucun email ne parvient aux clients ni aux professionnels en production. L'intégralité de la couche email est hors service.

**Correction suggérée :**  
Remplacer `onboarding@resend.dev` par une adresse sur le domaine vérifié dans Resend (ex. `noreply@calendapro.app`). Créer une constante `FROM_EMAIL` centralisée pour éviter les incohérences futures.

---

### [CRIT-4] La marketplace expose les profils non publiés, incomplets et supprimés

**Fichier :** `app/api/marketplace/route.ts` — lignes **46–64**

```ts
let profileQuery = supabase
  .from('profiles')
  .select('id, username, full_name, bio, category, city, avatar_url, latitude, longitude')
  .not('username', 'is', null)
  .not('full_name', 'is', null)
```

**Description :**  
La seule condition de filtrage est `username != null AND full_name != null`. Aucun filtre sur :
- `onboarding_completed` (pro en cours d'inscription),
- `account_status` (compte suspendu ou en suppression),
- `deleted_at` (compte soft-deleted).

Un professionnel dont le compte est supprimé (`deleted_at IS NOT NULL`) ou suspendu (`account_status = 'suspended'`) continue d'apparaître dans le répertoire public.

**Impact :**
- Données personnelles de comptes supprimés exposées publiquement (RGPD).
- Profils incomplets (step 1 d'onboarding) visibles dans le marketplace.
- Professionnels suspendus continuent de recevoir des réservations.

**Correction suggérée :**  
Ajouter au query :
```ts
.eq('onboarding_completed', true)
.is('deleted_at', null)
.not('account_status', 'in', '("deleted","pending_deletion","suspended")')
```

---

## IMPORTANT — Bugs fonctionnels majeurs

---

### [IMP-1] `p_pro_name` reçoit `clientName` au lieu du nom du professionnel

**Fichier :** `lib/booking-pipeline.ts` — ligne **197**

```ts
p_pro_name: clientName || null,   // ← devrait être profile.full_name
```

**Description :**  
Le RPC `create_booking_safe` enregistre `clientName` (le nom du client) dans le champ `pro_name` de la table `bookings`. Ce champ est ensuite utilisé dans les rappels cron comme `professionalName` (voir `app/api/reminders/check/route.ts` ligne 93 : `booking.pro_name ?? booking.pro_username`).

**Impact :**  
Les emails de rappel affichent : *"Votre rendez-vous avec Jean Dupont"* alors que Jean Dupont est le **client** — le nom du pro est inconnu du destinataire. `profile.full_name` est disponible dans la même fonction mais n'est pas utilisé.

**Correction suggérée :**
```ts
p_pro_name: profile.full_name || null,
```

---

### [IMP-2] Rappels cron : `getUser()` appelé avec un email pour les réservations anonymes

**Fichier :** `app/api/reminders/check/route.ts` — lignes **82–86**

```ts
const user = await clerk.users.getUser(booking.client_id)
```

**Description :**  
Pour les réservations sans compte Clerk, `booking.client_id` contient l'adresse email du client (ex. `jean@example.com`). `clerk.users.getUser()` attend un Clerk `userId` (format `user_xxxxxxxx`), pas un email. L'appel lève une exception, le rappel est ignoré en silence (catch vide ligne 85), et `reminder_sent_24h` est quand même marqué `true` (ligne 111) — le rappel ne sera plus jamais retentié.

**Impact :**  
Tous les clients ayant réservé sans créer de compte ne reçoivent aucun rappel de rendez-vous, même si leur email est connu. Le flag est brûlé définitivement.

**Correction suggérée :**  
Vérifier si `client_id` ressemble à un email (`client_id.includes('@')`). Si oui, utiliser directement cet email comme `clientEmail` plutôt qu'appeler Clerk.

---

### [IMP-3] Historique wallet client vide pour les réservations anonymes

**Fichier :** `app/api/stripe/webhook/route.ts` — ligne **199**

```ts
await supabase.from('client_transactions').insert({
  user_id: clientEmail, // Utiliser l'email comme ID temporaire
  ...
})
```

**Fichier :** `app/api/client/transactions/route.ts` — (requête par Clerk `userId`)

**Description :**  
Lors d'un paiement Stripe par un client anonyme, la transaction est enregistrée avec `user_id = clientEmail` (une adresse email). Mais l'endpoint `/api/client/transactions` requête la table par Clerk `userId`. Ces deux valeurs ne correspondent jamais → les transactions des clients anonymes sont invisibles dans l'espace client, même après création de compte.

**Impact :**  
L'historique de paiements (`/client/wallet`) est vide pour tout client ayant réservé sans compte préalable.

**Correction suggérée :**  
Au moment de la création de compte client, migrer les transactions existantes de `user_id = email` vers `user_id = clerkUserId`. Ou stocker les deux champs (`email` et `clerk_user_id`) séparément.

---

### [IMP-4] Routes `/client(.*)` entièrement publiques dans le middleware Clerk

**Fichier :** `middleware.ts` — ligne **13**

```ts
publicRoutes: ['/client(.*)'],
```

**Description :**  
Toutes les routes client (`/client/dashboard`, `/client/wallet`, `/client/bookings`, etc.) sont déclarées comme publiques dans Clerk. L'authentification n'est appliquée que côté client (redirect JS). Les pages Server Components et les API routes `/api/client/...` peuvent être consultées sans session valide si elles ne vérifient pas l'auth elles-mêmes.

**Impact :**  
Un utilisateur non authentifié peut accéder directement aux URLs client et potentiellement voir les données d'un autre client si les pages fetches ne sont pas toutes protégées.

**Correction suggérée :**  
Retirer `/client(.*)` des `publicRoutes`. Ajouter `/client/sign-in` et `/client/sign-up` à la liste des routes publiques uniquement.

---

### [IMP-5] URL publique du pro basée sur Clerk username plutôt que le profil Supabase

**Fichier :** `app/dashboard/page.tsx` — ligne **174**

```ts
const publicUrl = `calendapro.fr/${username}`  // username = Clerk username
```

**Description :**  
`username` provient de `useUser()` (Clerk). Lors de l'onboarding, le pro choisit un username stocké dans `profiles.username` (Supabase). Ces deux valeurs peuvent diverger si le pro modifie son username en cours de route. La page `/[username]` est routée par le username Supabase — si les deux diffèrent, le lien affiché dans le dashboard est mort.

**Impact :**  
Le professionnel copie-colle son URL publique et envoie un lien invalide à ses clients.

**Correction suggérée :**  
Charger `profiles.username` depuis Supabase et l'utiliser pour construire `publicUrl`.

---

### [IMP-6] Incohérence env vars Stripe : `STRIPE_PREMIUM_PRICE_ID` vs `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`

**Fichier A :** `app/api/auth/sync/route.ts` — ligne **65**
```ts
premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
```

**Fichier B :** `app/api/stripe/webhook/route.ts` — ligne **37**, `lib/stripe.ts` — ligne **23**
```ts
if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) return 'premium'
```

**Description :**  
L'URL de checkout Stripe est construite avec `STRIPE_PREMIUM_PRICE_ID` (variable serveur uniquement). La détection du plan côté webhook utilise `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`. Si ces deux variables sont configurées avec des valeurs différentes (erreur opérationnelle courante), un utilisateur paye le plan premium mais le webhook ne le reconnaît pas et assigne le plan `free`.

**Impact :**  
Perte de revenu et expérience utilisateur cassée (paiement sans upgrade).

**Correction suggérée :**  
Unifier en une seule variable `STRIPE_PREMIUM_PRICE_ID` côté serveur. Ne jamais exposer un Price ID en variable `NEXT_PUBLIC_*`.

---

### [IMP-7] Email de crédit wallet non envoyé lors d'annulation via `cancel-with-refund`

**Fichier :** `app/api/bookings/cancel-with-refund/route.ts` — lignes **244–247**

**Description :**  
Lorsque le pro annule une réservation payée via Stripe et que le système crédite le wallet client (au lieu d'un remboursement Stripe direct), aucun email de notification n'est envoyé au client. La route `/api/bookings/cancel` envoie bien cet email, mais `cancel-with-refund` ne le fait pas dans la branche wallet.

**Impact :**  
Le client ne sait pas que son acompte a été crédité sur son wallet. Il peut croire que son remboursement a échoué.

**Correction suggérée :**  
Ajouter un appel `resend.emails.send(...)` dans la branche wallet de `cancel-with-refund`, identique à celui de `cancel/route.ts` lignes 102–126.

---

### [IMP-8] Dashboard : `caEncaisse` surévalue le revenu pour les paiements partiels

**Fichier :** `app/api/dashboard/stats/route.ts` — lignes **66–68**

```ts
const caEncaisse = revenueBookings
  .filter((b) => b.payment_status === 'paid')
  .reduce((sum, b) => sum + (Number(b.price) || 0), 0)
```

**Description :**  
`caEncaisse` est calculé en sommant `b.price` (le tarif total du service) pour toutes les réservations avec `payment_status = 'paid'`. Or une réservation peut avoir `payment_status = 'paid'` après versement d'un simple acompte. Le champ `amount_paid` contient le montant réellement encaissé.

**Impact :**  
Le revenu affiché dans le dashboard est surestimé. Un pro qui a perçu 30 € d'acompte sur un service à 100 € verra 100 € dans sa colonne "encaissé".

**Correction suggérée :**
```ts
.reduce((sum, b) => sum + (Number(b.amount_paid) || Number(b.price) || 0), 0)
```

---

## MINEUR — Défauts non bloquants

---

### [MIN-1] Div de debug visible en production

**Fichier :** `app/onboarding/_components/CityAutocomplete.tsx` — lignes **175–177**

```tsx
<div className="text-xs text-gray-400">
  Suggestions: {suggestions.length} | Show: {showSuggestions ? 'yes' : 'no'} | Loading: {isLoading ? 'yes' : 'no'}
</div>
```

**Description :**  
Un compteur de debug est rendu inconditionnellement dans le formulaire d'onboarding. Il affiche l'état interne du composant à l'utilisateur.

**Correction :** Supprimer ces 3 lignes.

---

### [MIN-2] `sizes` avec un string littéral au lieu d'une expression JSX dans `next/image`

**Fichier :** `app/marketplace/page.tsx` — ligne ~**126**

```tsx
sizes="${size}px"   // ← string littéral, pas un template JSX
```

**Description :**  
L'attribut `sizes` contient la chaîne littérale `"${size}px"` (guillemets JSX) au lieu de `{`${size}px`}`. Le navigateur reçoit donc `"${size}px"` comme valeur de `sizes`, qui est invalide — le composant utilisera le comportement par défaut.

**Correction :**
```tsx
sizes={`${size}px`}
```

---

### [MIN-3] `getUserPlan` utilise `.single()` qui throw si aucune ligne

**Fichier :** `lib/subscription.ts` — ligne **16**

```ts
const { data, error } = await supabase
  .from('subscriptions')
  .select('plan, status')
  .eq('user_id', userId)
  .single()    // ← PGRST116 si 0 ligne
```

**Description :**  
`.single()` produit une erreur Supabase `PGRST116` quand aucune souscription n'existe. Le code retourne `'free'` sur erreur, ce qui est correct fonctionnellement, mais génère des erreurs parasites dans les logs pour chaque nouvel utilisateur.

**Correction :** Remplacer `.single()` par `.maybeSingle()`.

---

### [MIN-4] Page de succès ne charge pas le récapitulatif quand le webhook a déjà agi

**Fichier :** `app/booking/success/page.tsx` — lignes **77–79**

**Description :**  
Lorsque `/api/stripe/verify-booking` retourne `{ already_exists: true }` (le webhook a déjà créé la réservation), `fetchBookingDetails()` n'est pas appelé. La page affiche un message de succès générique sans aucun récapitulatif du rendez-vous.

**Correction :** Appeler `fetchBookingDetails(bookingId)` également dans le cas `already_exists`.

---

### [MIN-5] Tri "Nouveaux" dans la marketplace non implémenté

**Fichier :** `app/api/marketplace/route.ts` — lignes **206–208**

```ts
} else if (sortBy === 'newest') {
  // Use plan/distance as tiebreak for now (created_at not in select)
}
```

**Description :**  
L'option de tri "Nouveaux" est proposée dans l'UI mais la branche de code est vide. `created_at` n'est pas inclus dans le `select()` de la requête profiles. Le tri est silencieusement identique au tri "Pertinence".

**Correction :** Ajouter `created_at` au `select()` et implémenter le tri descendant, ou retirer l'option de l'UI en attendant.

---

## Récapitulatif des fichiers impactés

| Fichier | Bugs |
|---------|------|
| `app/[username]/BookingForm.tsx` | CRIT-1 |
| `app/api/public/[username]/availability/route.ts` | CRIT-2 |
| `lib/emails.ts` | CRIT-3 |
| `app/api/marketplace/route.ts` | CRIT-4, MIN-5 |
| `lib/booking-pipeline.ts` | IMP-1 |
| `app/api/reminders/check/route.ts` | IMP-2 |
| `app/api/stripe/webhook/route.ts` | IMP-3, IMP-6 |
| `middleware.ts` | IMP-4 |
| `app/dashboard/page.tsx` | IMP-5 |
| `app/api/auth/sync/route.ts` | IMP-6 |
| `app/api/bookings/cancel-with-refund/route.ts` | IMP-7 |
| `app/api/dashboard/stats/route.ts` | IMP-8 |
| `app/onboarding/_components/CityAutocomplete.tsx` | MIN-1 |
| `app/marketplace/page.tsx` | MIN-2 |
| `lib/subscription.ts` | MIN-3 |
| `app/booking/success/page.tsx` | MIN-4 |

---

## Ordre de correction recommandé

1. **CRIT-3** — Emails (`onboarding@resend.dev`) : correctif en 5 min, impact maximal.
2. **CRIT-4** — Marketplace : ajouter 3 filtres SQL, déployable immédiatement.
3. **IMP-6** — Env vars Stripe : vérifier la config en prod, unifier les noms.
4. **CRIT-1 + CRIT-2** — Créneaux de dispo : nécessite une refonte de l'API et du composant.
5. **IMP-1** — `p_pro_name` : correctif 1 ligne.
6. **IMP-2** — Rappels anonymes : correctif conditionnel sur `client_id.includes('@')`.
7. **IMP-3** — Wallet client : migration de données + logique de lookup.
8. **IMP-4** — Middleware : retirer `/client(.*)` des routes publiques.
9. Reste des bugs **IMPORTANT** puis **MINEUR**.
