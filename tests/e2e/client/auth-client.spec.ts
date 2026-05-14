import { test, expect } from '@playwright/test';
import { clientUsers, generateUniqueClientUser } from '../../fixtures/client-user';

test.describe('Client Authentication Flow', () => {
  test('should show auth-choice page before booking', async ({ page }) => {
    await page.goto('/auth-choice?pro=testuser');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveURL(/.*auth-choice.*/);
    await expect(page.getByText(/choix|connexion|inscription|j\'ai.*déjà/i)).toBeVisible({ timeout: 10000 });
  });

  test('should register new client', async ({ page }) => {
    const uniqueClient = generateUniqueClientUser('new' + Date.now());
    
    await page.goto('/client-sign-up');
    await page.waitForTimeout(1500);
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(uniqueClient.email);
    await passwordInput.fill(uniqueClient.password);
    
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="prénom" i]').first();
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="nom" i]').first();
    
    if (await firstNameInput.isVisible().catch(() => false)) {
      await firstNameInput.fill(uniqueClient.firstName);
    }
    if (await lastNameInput.isVisible().catch(() => false)) {
      await lastNameInput.fill(uniqueClient.lastName);
    }
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*onboarding.*|.*verify.*|.*dashboard.*/);
  });

  test('should login existing client', async ({ page }) => {
    await page.goto('/client-sign-in');
    await page.waitForTimeout(1500);
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(clientUsers.standard.email);
    await passwordInput.fill(clientUsers.standard.password);
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('sign-in');
  });

  test('should preserve booking data after auth', async ({ page }) => {
    await page.goto('/testuser');
    await page.waitForTimeout(1500);
    
    const timeSlot = page.locator('[data-testid*="slot"], .time-slot').first();
    if (await timeSlot.isVisible().catch(() => false)) {
      await timeSlot.click();
    }
    
    await page.goto('/auth-choice?pro=testuser&service=coupe');
    await page.waitForTimeout(1000);
    
    await page.goto('/client-sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(clientUsers.standard.email);
    await passwordInput.fill(clientUsers.standard.password);
    await page.locator('button[type="submit"]').first().click();
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*testuser.*|.*booking.*/);
  });

  test('should redirect correctly to booking after auth', async ({ page }) => {
    await page.goto('/client-sign-in?redirect_url=/testuser');
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(clientUsers.standard.email);
    await passwordInput.fill(clientUsers.standard.password);
    await page.locator('button[type="submit"]').first().click();
    
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/.*testuser.*/);
  });
});
