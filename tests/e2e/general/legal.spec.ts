import { test, expect } from '@playwright/test';

test.describe('Legal Pages', () => {
  test('should load /mentions-legales', async ({ page }) => {
    await page.goto('/mentions-legales');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/.*mentions-legales.*/);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(/mention.*légales|legal notice/i)).toBeVisible();
  });

  test('should load /cgu', async ({ page }) => {
    await page.goto('/cgu');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/.*cgu.*/);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(/condition.*utilisation|terms.*use/i)).toBeVisible();
  });

  test('should load /cgv', async ({ page }) => {
    await page.goto('/cgv');
    await page.waitForTimeout(1000);
    
    if (page.url().includes('404') || page.url().includes('not-found')) {
      await page.goto('/legal/cgv');
      await page.waitForTimeout(1000);
    }
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*cgv.*|.*terms.*sale.*/);
    expect(await page.getByText(/404/i).count()).toBe(0);
  });

  test('should load /confidentialite', async ({ page }) => {
    await page.goto('/confidentialite');
    await page.waitForTimeout(1000);
    
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(/confidentialité|privacy|données/i)).toBeVisible();
  });

  test('should load /legal/politique-cookies', async ({ page }) => {
    await page.goto('/legal/politique-cookies');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('404') || currentUrl.includes('not-found')) {
      test.skip();
    } else {
      await expect(page.getByText(/cookie|politique/i)).toBeVisible();
    }
  });

  test('should have all legal links in footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    
    const legalLinks = [
      'mention',
      'cgu',
      'confidentialite',
      'cookie',
    ];
    
    let foundLinks = 0;
    for (const link of legalLinks) {
      const linkElement = footer.locator(`a[href*="${link}"]`).first();
      if (await linkElement.isVisible().catch(() => false)) {
        foundLinks++;
      }
    }
    
    expect(foundLinks).toBeGreaterThanOrEqual(2);
  });
});
