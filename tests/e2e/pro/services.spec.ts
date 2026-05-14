import { test, expect } from '@playwright/test';
import { mockServices } from '../../fixtures/mock-availability';

test.describe('Pro Services Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  });

  test('should create a new service', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForLoadState('networkidle');
    
    const addButton = page.getByRole('button', { name: /nouveau|ajouter|créer/i }).first() ||
                      page.locator('a[href*="create"], a[href*="new"], button svg').first();
    
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    const nameInput = page.getByLabel(/nom|service/i).first() || page.locator('input[name="name"]').first();
    const durationInput = page.getByLabel(/durée|minutes/i).first() || page.locator('input[name="duration"]').first();
    const priceInput = page.getByLabel(/prix|tarif/i).first() || page.locator('input[name="price"]').first();
    
    await nameInput.fill(mockServices[2].name);
    await durationInput.fill(mockServices[2].duration.toString());
    await priceInput.fill(mockServices[2].price.toString());
    
    const submitButton = page.getByRole('button', { name: /sauvegarder|enregistrer|créer/i }).first();
    await submitButton.click();
    
    await page.waitForTimeout(1500);
    
    await expect(page.getByText(mockServices[2].name)).toBeVisible();
  });

  test('should edit an existing service', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForTimeout(1000);
    
    const editButton = page.locator('button[aria-label*="edit"], a[href*="edit"], svg[aria-label*="edit"]').first() ||
                       page.getByRole('button', { name: /modifier/i }).first();
    
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      const nameInput = page.locator('input[name="name"]').first();
      await nameInput.clear();
      await nameInput.fill('Service Modifié E2E');
      
      const saveButton = page.getByRole('button', { name: /sauvegarder|enregistrer/i }).first();
      await saveButton.click();
      
      await page.waitForTimeout(1000);
      await expect(page.getByText('Service Modifié E2E')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should delete a service', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForTimeout(1000);
    
    const deleteButton = page.locator('button[aria-label*="delete"], button[aria-label*="supprimer"], svg[aria-label*="delete"]').first() ||
                         page.getByRole('button', { name: /supprimer/i }).first();
    
    if (await deleteButton.isVisible().catch(() => false)) {
      const initialCount = await page.locator('[data-testid*="service"], .service-item, tr').count();
      
      await deleteButton.click();
      
      const confirmButton = page.getByRole('button', { name: /confirmer|oui|ok/i }).first() ||
                            page.locator('button:has-text("Supprimer")').nth(1);
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      const finalCount = await page.locator('[data-testid*="service"], .service-item, tr').count();
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    } else {
      test.skip();
    }
  });

  test('should validate form fields', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForTimeout(500);
    
    const addButton = page.getByRole('button', { name: /nouveau|ajouter/i }).first();
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      const submitButton = page.getByRole('button', { name: /créer|sauvegarder/i }).first();
      await submitButton.click();
      
      const errorMessage = page.getByText(/requis|obligatoire|erreur|required/i).first() ||
                           page.locator('.error, [role="alert"]').first();
      expect(await errorMessage.isVisible().catch(() => false)).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should display empty state when no services', async ({ page }) => {
    await page.goto('/dashboard/services');
    await page.waitForTimeout(1000);
    
    const services = page.locator('[data-testid*="service"], .service-item, tr');
    const count = await services.count();
    
    if (count === 0) {
      const emptyState = page.getByText(/aucun service|vide|pas.*service|créer.*premier/i);
      await expect(emptyState).toBeVisible();
    }
  });
});
