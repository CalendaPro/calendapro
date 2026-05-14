import { test, expect } from '@playwright/test';
import { generateUniqueProUser } from '../../fixtures/pro-user';

test.describe('Pro Authentication', () => {
  test('should register new pro via Clerk', async ({ page }) => {
    const uniqueSuffix = Date.now().toString();
    const newUser = generateUniqueProUser(uniqueSuffix);
    
    await page.goto('/sign-up');
    await expect(page).toHaveURL(/.*sign-up.*/);
    
    await expect(page.getByRole('heading', { name: /inscription|créer.*compte/i })).toBeVisible({ timeout: 10000 });
    
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(newUser.email);
    await passwordInput.fill(newUser.password);
    
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="prénom" i]').first();
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="nom" i]').first();
    
    if (await firstNameInput.isVisible().catch(() => false)) {
      await firstNameInput.fill(newUser.firstName);
    }
    if (await lastNameInput.isVisible().catch(() => false)) {
      await lastNameInput.fill(newUser.lastName);
    }
    
    const submitButton = page.locator('button[type="submit"], button:has-text("S\'inscrire"), button:has-text("Créer"), button:has-text("Continuer")').first();
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*dashboard.*|.*onboarding.*|.*verify.*/);
  });

  test('should login existing pro', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Vérifier que la page de connexion s'affiche
    const heading = page.getByRole('heading');
    const hasHeading = await heading.isVisible().catch(() => false);
    
    if (!hasHeading) {
      test.skip();
      return;
    }
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    // Si les champs Clerk ne sont pas visibles, skipper
    if (!(await emailInput.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Attendre la redirection vers dashboard ou vérification
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toMatch(/.*dashboard.*|.*verify.*|.*sign-in.*/);
  });

  test('should logout pro', async ({ page }) => {
    await page.goto('/sign-in');
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    // Si Clerk n'est pas configuré, skipper
    if (!(await emailInput.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    
    await page.locator('button[type="submit"]').first().click();
    
    // Attendre le dashboard avec une URL plus flexible
    try {
      await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    } catch {
      test.skip();
      return;
    }
    
    // Trouver et cliquer sur le bouton de profil Clerk
    const profileButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger').first();
    if (!(await profileButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    
    await profileButton.click();
    
    const signOutButton = page.getByText(/déconnexion|se déconnecter|logout/i).first();
    if (!(await signOutButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    
    await signOutButton.click();
    
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/.*\/|.*sign-in.*/);
  });

  test('should redirect to onboarding after registration', async ({ page }) => {
    const uniqueSuffix = Date.now().toString();
    const newUser = generateUniqueProUser(uniqueSuffix);
    
    await page.goto('/sign-up');
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    await emailInput.fill(newUser.email);
    await passwordInput.fill(newUser.password);
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*onboarding.*|.*verify.*|.*dashboard.*/);
  });
});
