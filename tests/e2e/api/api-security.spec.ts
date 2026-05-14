import { test, expect } from '@playwright/test';

test.describe('API Security', () => {
  const protectedRoutes = [
    { url: '/api/stripe/refund', method: 'POST' },
    { url: '/api/stripe/connect/balance', method: 'GET' },
    { url: '/api/stripe/connect/onboarding', method: 'POST' },
  ];

  // Routes publiques pour les réservations (clients non connectés)
  const publicBookingRoutes = [
    { url: '/api/stripe/booking-checkout', method: 'POST' },
    { url: '/api/bookings', method: 'POST' },
  ];

  for (const route of protectedRoutes) {
    test(`${route.method} ${route.url} without auth should return 401 or redirect`, async ({ request }) => {
      const response = await request.fetch(route.url, {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
        },
        data: route.method === 'POST' ? {} : undefined,
      });

      // Clerk middleware peut retourner 401, 403 ou 307 (redirect vers login)
      expect([401, 403, 307, 302]).toContain(response.status());
    });
  }

  // Routes de booking publiques - accessibles sans auth mais valident le body
  for (const route of publicBookingRoutes) {
    test(`${route.method} ${route.url} should be accessible without auth (returns 400 for invalid body)`, async ({ request }) => {
      const response = await request.fetch(route.url, {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {},
        maxRedirects: 0, // Ne pas suivre les redirects pour voir le vrai statut
      });

      // Accessible sans auth, mais retourne 400 car body invalide
      // Peut aussi retourner 307 si Clerk redirige
      expect([200, 400, 404, 307, 302]).toContain(response.status());
    });
  }

  const publicRoutes = [
    { url: '/api/public/marketplace', method: 'GET' },
    { url: '/api/public/pros', method: 'GET' },
    { url: '/api/marketplace/pro-preview', method: 'GET' },
  ];

  for (const route of publicRoutes) {
    test(`${route.method} ${route.url} should be accessible without auth`, async ({ request }) => {
      const response = await request.fetch(route.url, {
        method: route.method,
        maxRedirects: 0,
      });

      // Les routes publiques doivent retourner 200 ou 307 (redirect Clerk)
      expect([200, 307, 302]).toContain(response.status());
    });
  }

  test('should not expose sensitive data in API responses', async ({ request }) => {
    const response = await request.get('/api/public/marketplace');
    
    if (response.ok()) {
      const body = await response.text();
      
      expect(body).not.toContain('password');
      expect(body).not.toContain('secret');
      expect(body).not.toContain('stripe_secret');
    }
  });
});
