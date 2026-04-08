import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export const PLANS = {
  free: {
    name: 'Starter',
    price: 0,
    priceId: null,
    features: [
      '20 rendez-vous / mois',
      'Page publique de base',
      'Rappels email',
      '1 service',
    ],
    limit: 20,
  },
  premium: {
    name: 'Premium',
    price: 19,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Rendez-vous illimités',
      'Page publique premium',
      'Rappels SMS & WhatsApp',
      'Services illimités',
      'Statistiques avancées',
      'Marketplace CalendaPro',
    ],
    limit: null,
  },
  infinity: {
    name: 'Infinity ✦',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_INFINITY_PRICE_ID,
    features: [
      'Tout le plan Premium',
      'Assistant IA intégré',
      'Automatisations avancées',
      "Score d'activité gamifié",
      'Priorité marketplace',
      'Support prioritaire',
    ],
    limit: null,
  },
}