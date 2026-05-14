import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('marketplace should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('dashboard should load in under 2 seconds', async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('pro profile should load in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/testuser');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('should have no console errors on main pages', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(1500);
    
    await page.goto('/marketplace');
    await page.waitForTimeout(1500);
    
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') && 
      !e.includes('Failed to load resource')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
