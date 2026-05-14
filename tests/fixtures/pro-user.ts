export interface ProUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  category: string;
  city: string;
  bio: string;
}

export const proUsers: Record<string, ProUser> = {
  standard: {
    email: 'test.pro.e2e@calendapro.test',
    password: 'TestPassword123!',
    firstName: 'Jean',
    lastName: 'Testeur',
    businessName: 'Salon de Test E2E',
    category: 'coiffure',
    city: 'Paris',
    bio: 'Salon de coiffure de test pour les tests E2E',
  },
  onboarding: {
    email: 'test.pro.onboarding@calendapro.test',
    password: 'TestPassword123!',
    firstName: 'Marie',
    lastName: 'Nouvelle',
    businessName: 'Institut Marie',
    category: 'esthetique',
    city: 'Lyon',
    bio: 'Institut d\'esthétique de test',
  },
  stripeConnect: {
    email: 'test.pro.stripe@calendapro.test',
    password: 'TestPassword123!',
    firstName: 'Pierre',
    lastName: 'Stripe',
    businessName: 'Studio Pierre',
    category: 'barbier',
    city: 'Marseille',
    bio: 'Barbier de test pour Stripe Connect',
  },
};

export const generateUniqueProUser = (suffix: string): ProUser => ({
  email: `test.pro.${suffix}@calendapro.test`,
  password: 'TestPassword123!',
  firstName: 'Jean',
  lastName: `Test${suffix}`,
  businessName: `Salon Test ${suffix}`,
  category: 'coiffure',
  city: 'Paris',
  bio: `Salon de test ${suffix}`,
});
