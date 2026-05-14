import { Page, expect } from '@playwright/test';
import { ClientUser } from '../fixtures/client-user';

export async function loginClient(page: Page, user: ClientUser): Promise<void> {
  await page.goto('/client-sign-in');
  
  await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible({ timeout: 10000 });
  
  const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  
  const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first();
  await submitButton.click();
  
  await page.waitForTimeout(2000);
}

export async function logoutClient(page: Page): Promise<void> {
  const menuButton = page.locator('button:has-text("Menu"), [data-testid="menu-button"], .hamburger').first();
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
  
  const signOutButton = page.getByText(/déconnexion|se déconnecter|logout/i).first();
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await page.waitForTimeout(1000);
  }
}
