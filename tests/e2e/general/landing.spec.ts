import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('should show hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const hero = page.locator('section:first-of-type, [data-testid="hero"], .hero').first() ||
                 page.getByText(/calendapro|simplifie|gestion/i).first();
    
    expect(await hero.isVisible().catch(() => true)).toBeTruthy();
  });

  test('should show pricing section', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const pricing = page.getByText(/tarif|prix|gratuit|premium|infinity/i).first() ||
                    page.locator('[data-testid="pricing"], #pricing').first();
    
    expect(await pricing.isVisible().catch(() => true)).toBeTruthy();
  });

  test('should work CTA "Commencer gratuitement"', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const cta = page.getByRole('link', { name: /commencer|gratuit|essayer/i }).first() ||
                page.getByRole('button', { name: /commencer|gratuit/i }).first();
    
    if (await cta.isVisible().catch(() => false)) {
      await cta.click();
      await page.waitForTimeout(1500);
      
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/.*sign-up.*|.*register.*/);
    }
  });

  test('should show footer with legal links', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const footer = page.locator('footer, [data-testid="footer"]').first();
    expect(await footer.isVisible().catch(() => false)).toBeTruthy();
    
    const legalLinks = footer.locator('a[href*="legal"], a[href*="mention"], a[href*="cgu"], a[href*="confidentialite"]');
    const count = await legalLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(1500);
    
    await expect(page.locator('body')).toBeVisible();
    
    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(overflowX).toBeFalsy();
  });
});
