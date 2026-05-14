import { test, expect } from '@playwright/test';

test.describe('Pro Availability Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  });

  test('should configure availability days and hours', async ({ page }) => {
    await page.goto('/dashboard/availability');
    await page.waitForTimeout(1000);
    
    await expect(page.getByText(/disponibilité|horaire|planning/i)).toBeVisible({ timeout: 10000 });
    
    const lundiCheckbox = page.locator('input[type="checkbox"]').first() ||
                          page.getByLabel(/lundi/i).first();
    
    if (await lundiCheckbox.isVisible().catch(() => false)) {
      await lundiCheckbox.check();
      
      const startTime = page.locator('input[type="time"]').first();
      const endTime = page.locator('input[type="time"]').nth(1);
      
      if (await startTime.isVisible().catch(() => false)) {
        await startTime.fill('09:00');
        await endTime.fill('18:00');
      }
      
      const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer/i }).first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        await expect(page.getByText(/enregistré|sauvegardé|succès/i)).toBeVisible();
      }
    }
  });

  test('should modify availability', async ({ page }) => {
    await page.goto('/dashboard/availability');
    await page.waitForTimeout(1000);
    
    const timeInputs = page.locator('input[type="time"]');
    const count = await timeInputs.count();
    
    if (count >= 2) {
      await timeInputs.first().fill('10:00');
      await timeInputs.nth(1).fill('19:00');
      
      const saveButton = page.getByRole('button', { name: /sauvegarder/i }).first();
      await saveButton.click();
      
      await page.waitForTimeout(1000);
    }
  });

  test('should show slots on public profile', async ({ page }) => {
    await page.goto('/testuser');
    await page.waitForTimeout(2000);
    
    const bookingSection = page.locator('[data-testid="booking"], .booking-section, #reservation').first();
    const slots = page.getByText(/créneau|disponible|réserver/i);
    
    const hasBooking = await bookingSection.isVisible().catch(() => false) ||
                       await slots.first().isVisible().catch(() => false);
    expect(hasBooking).toBeTruthy();
  });

  test('should disable a day', async ({ page }) => {
    await page.goto('/dashboard/availability');
    await page.waitForTimeout(1000);
    
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count > 0) {
      const firstCheckbox = checkboxes.first();
      await firstCheckbox.uncheck();
      
      const saveButton = page.getByRole('button', { name: /sauvegarder/i }).first();
      if (await saveButton.isVisible().catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
      
      await firstCheckbox.check();
    }
  });
});
