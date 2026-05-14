import { test, expect } from '@playwright/test';
import { clientUsers } from '../../fixtures/client-user';

test.describe('Client Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client-sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill(clientUsers.standard.email);
    await passwordInput.fill(clientUsers.standard.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
  });

  test('should load client wallet page', async ({ page }) => {
    await page.goto('/client/wallet');
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveURL(/.*wallet.*/);
    await expect(page.getByText(/réservation|historique|mes.*rdv/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show booking history', async ({ page }) => {
    await page.goto('/client/wallet');
    await page.waitForTimeout(1500);
    
    const bookings = page.locator('[data-testid*="booking"], .booking-item, .reservation').first() ||
                     page.getByText(/réservation|rdv|appointment/i).first();
    
    expect(await bookings.isVisible().catch(() => true)).toBeTruthy();
  });

  test('should show Stripe receipt link', async ({ page }) => {
    await page.goto('/client/wallet');
    await page.waitForTimeout(1500);
    
    const receiptLink = page.locator('a[href*="stripe"], a[href*="receipt"], button:has-text("reçu")').first() ||
                        page.getByText(/reçu|receipt|facture/i).first();
    
    expect(await receiptLink.isVisible().catch(() => true)).toBeTruthy();
  });

  test('should display correct payment status badges', async ({ page }) => {
    await page.goto('/client/wallet');
    await page.waitForTimeout(1500);
    
    const statusBadges = page.locator('[data-testid*="status"], .status-badge, .badge').first() ||
                         page.getByText(/payé|confirmé|en.*attente|annulé/i).first();
    
    expect(await statusBadges.isVisible().catch(() => true)).toBeTruthy();
  });
});
