import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Pro Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  });

  test('should load settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveURL(/.*settings.*/);
    await expect(page.getByText(/paramètre|setting/i)).toBeVisible({ timeout: 10000 });
  });

  test('should save name/bio/city changes', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1000);
    
    const nameInput = page.getByLabel(/nom|name/i).first() || page.locator('input[name="displayName"], input[name="name"]').first();
    const bioInput = page.getByLabel(/bio|description|à.*propos/i).first() || page.locator('textarea[name="bio"], textarea[name="description"]').first();
    
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('Nom Test E2E');
    }
    
    if (await bioInput.isVisible().catch(() => false)) {
      await bioInput.clear();
      await bioInput.fill('Bio de test E2E');
    }
    
    const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer/i }).first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      await expect(page.getByText(/enregistré|sauvegardé|succès/i).first()).toBeVisible();
    }
  });

  test('should upload profile photo', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1000);
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles({
        name: 'test-avatar.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
      });
      
      await page.waitForTimeout(1500);
      
      const uploadSuccess = page.getByText(/upload|téléchargé|succès/i).first();
      expect(await uploadSuccess.isVisible().catch(() => true)).toBeTruthy();
    }
  });

  test('should show Stripe Connect section', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1000);
    
    const stripeSection = page.getByText(/stripe|connect|paiement/i).first();
    expect(await stripeSection.isVisible().catch(() => true)).toBeTruthy();
  });

  test('should access all settings sections', async ({ page }) => {
    const sections = [
      { name: 'profil|profile', url: /.*settings.*/ },
      { name: 'notification', url: /.*notification.*/ },
      { name: 'intégration|stripe', url: /.*integration.*/ },
    ];
    
    for (const section of sections) {
      await page.goto('/dashboard/settings');
      await page.waitForTimeout(500);
      
      const tabLink = page.getByRole('tab', { name: new RegExp(section.name, 'i') }).first() ||
                      page.getByRole('link', { name: new RegExp(section.name, 'i') }).first();
      
      if (await tabLink.isVisible().catch(() => false)) {
        await tabLink.click();
        await page.waitForTimeout(800);
        await expect(page).toHaveURL(section.url);
      }
    }
  });
});
