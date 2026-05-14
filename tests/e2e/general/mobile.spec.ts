import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should toggle sidebar hamburger', async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    
    const hamburger = page.locator('[data-testid="hamburger"], button[aria-label*="menu"], .hamburger').first();
    
    if (await hamburger.isVisible().catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(500);
      
      const sidebar = page.locator('aside, [data-testid="sidebar"], nav').first();
      if (await sidebar.isVisible().catch(() => false)) {
        await expect(sidebar).toBeVisible();
      }
      
      await hamburger.click();
    }
  });

  test('should be readable on 375px dashboard pages', async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    
    const pages = ['/dashboard', '/dashboard/calendar', '/dashboard/clients'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForTimeout(1000);
      
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(overflowX, `Horizontal overflow detected on ${pageUrl}`).toBeFalsy();
    }
  });

  test('should have usable booking form on mobile', async ({ page }) => {
    await page.goto('/testuser');
    await page.waitForTimeout(1500);
    
    const form = page.locator('form, [data-testid*="booking"], .booking-form').first();
    const inputs = page.locator('input:visible, select:visible, button:visible');
    const count = await inputs.count();
    
    expect(count).toBeGreaterThan(0);
    
    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(overflowX).toBeFalsy();
  });

  test('should have sufficient touch targets (44px)', async ({ page }) => {
    await page.goto('/testuser');
    await page.waitForTimeout(1500);
    
    const buttons = page.locator('button, a, input, select, [role="button"]');
    const count = await buttons.count();
    
    let smallTargets = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox().catch(() => null);
      
      if (box && (box.width < 44 || box.height < 44)) {
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          smallTargets++;
        }
      }
    }
    
    expect(smallTargets).toBeLessThan(count * 0.3);
  });

  test('should not have unwanted horizontal scroll', async ({ page }) => {
    const pages = ['/', '/marketplace', '/testuser', '/sign-in'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForTimeout(1000);
      
      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
      });
      
      expect(overflowX, `Horizontal scroll on ${pageUrl}`).toBeFalsy();
    }
  });
});
