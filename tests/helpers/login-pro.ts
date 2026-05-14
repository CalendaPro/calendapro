import { Page, expect } from '@playwright/test';
import { ProUser } from '../fixtures/pro-user';

export async function loginPro(page: Page, user: ProUser): Promise<void> {
  await page.goto('/sign-in');
  
  await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible({ timeout: 10000 });
  
  const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  
  const submitButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first();
  await submitButton.click();
  
  await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  await expect(page).toHaveURL(/.*dashboard.*/);
}

export async function logoutPro(page: Page): Promise<void> {
  const profileButton = page.locator('[data-testid="user-button"], button:has-text("Profil"), .cl-userButtonTrigger').first();
  if (await profileButton.isVisible().catch(() => false)) {
    await profileButton.click();
    
    const signOutButton = page.getByText(/déconnexion|se déconnecter|logout/i).first();
    if (await signOutButton.isVisible().catch(() => false)) {
      await signOutButton.click();
      await page.waitForURL('/');
    }
  }
}
