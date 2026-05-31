# Stripe CLI — Configuration locale

## Prérequis

Stripe CLI est nécessaire pour forwarder les webhooks en développement local.

## Installation

1. Télécharger `stripe.exe` depuis :  
   https://github.com/stripe/stripe-cli/releases/latest

2. Placer `stripe.exe` à la racine du projet CalendaPro :
   ```
   c:\Users\cousc\Projects\calendapro\stripe.exe
   ```

3. S'authentifier (une seule fois) :
   ```powershell
   .\stripe.exe login
   ```

## Lancer le webhook listener

```powershell
.\stripe.exe listen --forward-to localhost:3000/api/stripe/webhook
```

Le CLI affichera un webhook signing secret au démarrage :
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

4. Copier ce secret dans `.env.local` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

## Cartes de test Stripe

| Carte | Numéro | Expire | CVC |
|-------|--------|--------|-----|
| Succès | 4242 4242 4242 4242 | 12/34 | 123 |
| Refus | 4000 0000 0000 0002 | 12/34 | 123 |
| Auth 3DS | 4000 0027 6000 3184 | 12/34 | 123 |

## Variables d'environnement Stripe

Dans `.env.local` :
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...         # du CLI stripe listen
STRIPE_PREMIUM_PRICE_ID=price_...       # server-side uniquement
STRIPE_INFINITY_PRICE_ID=price_...      # server-side uniquement
```

> ⚠️ Ne jamais mettre les Price IDs d'abonnement dans des variables `NEXT_PUBLIC_*`
