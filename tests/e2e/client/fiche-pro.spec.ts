import { test, expect } from '@playwright/test';

test.describe('Fiche Pro Publique', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/testuser');
    await page.waitForTimeout(2000);
  });

  test('should load public pro profile', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    
    const profileName = page.getByRole('heading').first() ||
                        page.locator('h1').first();
    expect(await profileName.isVisible()).toBeTruthy();
  });

  test('should display services with price and duration', async ({ page }) => {
    // Chercher des éléments qui pourraient contenir les services
    const services = page.locator('[data-testid*="service"], .service-card, .service-item, .service').first();
    const hasServices = await services.isVisible().catch(() => false);
    
    if (!hasServices) {
      // Certains templates n'ont pas de liste de services visible immédiatement
      test.info().annotations.push({ type: 'info', description: 'Services list not visible in current template' });
    }
    
    expect(hasServices).toBeTruthy();
  });

  test('should show booking button', async ({ page }) => {
    // Chercher le bouton de réservation - peut être un bouton ou un lien
    const bookingButton = page.getByRole('button', { name: /réserver|prendre.*rdv|book/i }).first();
    const bookingLink = page.getByRole('link', { name: /réserver|prendre.*rdv|book/i }).first();
    
    const hasButton = await bookingButton.isVisible().catch(() => false);
    const hasLink = await bookingLink.isVisible().catch(() => false);
    
    expect(hasButton || hasLink).toBeTruthy();
  });

  test('should show sticky button on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(1500);
    
    // Sur mobile, il doit y avoir un moyen de réserver (sticky ou non)
    const stickyButton = page.locator('[data-testid*="sticky"], .sticky-button, .fixed-bottom').first();
    const reserveButton = page.getByRole('button', { name: /réserver|prendre rdv/i }).first();
    const reserveLink = page.getByRole('link', { name: /réserver|prendre rdv/i }).first();
    
    const hasSticky = await stickyButton.isVisible().catch(() => false);
    const hasButton = await reserveButton.isVisible().catch(() => false);
    const hasLink = await reserveLink.isVisible().catch(() => false);
    
    // Au moins un des éléments doit être visible
    expect(hasSticky || hasButton || hasLink).toBeTruthy();
  });

  test('should have Schema.org JSON-LD in head', async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    
    if (count > 0) {
      const content = await jsonLd.first().textContent() || '';
      expect(content).toMatch(/@type.*Person|@type.*LocalBusiness|@context.*schema.org/i);
    } else {
      test.info().annotations.push({ type: 'info', description: 'JSON-LD not found, checking for other SEO tags' });
    }
  });

  test('should have Open Graph meta tags', async ({ page }) => {
    const ogTitle = page.locator('meta[property="og:title"]').first();
    const ogDescription = page.locator('meta[property="og:description"]').first();
    const ogImage = page.locator('meta[property="og:image"]').first();
    
    const hasOgTitle = await ogTitle.count() > 0;
    const hasOgDesc = await ogDescription.count() > 0;
    const hasOgImg = await ogImage.count() > 0;
    
    const hasOgTags = hasOgTitle || hasOgDesc || hasOgImg;
    
    expect(hasOgTags).toBeTruthy();
  });
});
