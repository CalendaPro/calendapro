import { test, expect } from '@playwright/test';
import { generateUniqueProUser } from '../../fixtures/pro-user';

test.describe('Pro Onboarding Wizard', () => {
  const uniqueUser = generateUniqueProUser('onboarding' + Date.now());

  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill(uniqueUser.email);
    await passwordInput.fill(uniqueUser.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*|.*onboarding.*/, { timeout: 15000 });
  });

  test('should complete wizard step 1 - Identity', async ({ page }) => {
    await page.goto('/pro-onboarding');
    await expect(page.getByText(/identité|qui.*êtes/i)).toBeVisible({ timeout: 10000 });
    
    await page.getByLabel(/prénom/i).fill(uniqueUser.firstName);
    await page.getByLabel(/nom/i).fill(uniqueUser.lastName);
    await page.getByLabel(/nom.*entreprise|business/i).fill(uniqueUser.businessName);
    
    await page.getByRole('button', { name: /suivant|continuer/i }).click();
    
    await expect(page.getByText(/service|prestation|activité/i)).toBeVisible();
  });

  test('should complete wizard step 2 - Service', async ({ page }) => {
    await page.goto('/pro-onboarding');
    
    await page.getByLabel(/prénom/i).fill(uniqueUser.firstName);
    await page.getByLabel(/nom/i).fill(uniqueUser.lastName);
    await page.getByLabel(/nom.*entreprise|business/i).fill(uniqueUser.businessName);
    await page.getByRole('button', { name: /suivant/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByLabel(/service|nom.*prestation/i).fill('Coupe Homme');
    await page.getByLabel(/durée|temps/i).fill('30');
    await page.getByLabel(/prix|tarif/i).fill('25');
    
    await page.getByRole('button', { name: /suivant/i }).click();
    await expect(page.getByText(/disponibilité|horaire|planning/i)).toBeVisible();
  });

  test('should complete wizard step 3 - Design/Availability', async ({ page }) => {
    await page.goto('/pro-onboarding');
    
    await page.getByLabel(/prénom/i).fill(uniqueUser.firstName);
    await page.getByLabel(/nom/i).fill(uniqueUser.lastName);
    await page.getByLabel(/nom.*entreprise/i).fill(uniqueUser.businessName);
    await page.getByRole('button', { name: /suivant/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByLabel(/service/i).fill('Coupe Homme');
    await page.getByLabel(/durée/i).fill('30');
    await page.getByLabel(/prix/i).fill('25');
    await page.getByRole('button', { name: /suivant/i }).click();
    await page.waitForTimeout(500);
    
    await expect(page.getByText(/disponibilité|créneau|horaire/i)).toBeVisible();
    
    const lundiCheckbox = page.locator('input[type="checkbox"], [data-testid*="lundi"]').first();
    if (await lundiCheckbox.isVisible().catch(() => false)) {
      await lundiCheckbox.check();
    }
    
    await page.getByRole('button', { name: /suivant|continuer|design/i }).click();
    await expect(page.getByText(/publication|publier|terminer/i)).toBeVisible();
  });

  test('should complete wizard step 4 - Publication', async ({ page }) => {
    await page.goto('/pro-onboarding');
    
    await page.getByLabel(/prénom/i).fill(uniqueUser.firstName);
    await page.getByLabel(/nom/i).fill(uniqueUser.lastName);
    await page.getByLabel(/nom.*entreprise/i).fill(uniqueUser.businessName);
    await page.getByRole('button', { name: /suivant/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByLabel(/service/i).fill('Coupe Homme');
    await page.getByLabel(/durée/i).fill('30');
    await page.getByLabel(/prix/i).fill('25');
    await page.getByRole('button', { name: /suivant/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /suivant/i }).click();
    await page.waitForTimeout(500);
    
    await expect(page.getByText(/publication|publier|félicitation/i)).toBeVisible();
    
    await page.getByRole('button', { name: /publier|terminer|finaliser/i }).click();
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect to dashboard after completion', async ({ page }) => {
    await page.goto('/pro-onboarding');
    
    for (let step = 0; step < 4; step++) {
      const inputs = page.locator('input:visible');
      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');
        if (type === 'text' || type === 'email' || !type) {
          await input.fill('Test Value ' + i);
        } else if (type === 'number') {
          await input.fill('30');
        }
      }
      
      const nextButton = page.getByRole('button', { name: /suivant|continuer|publier|terminer/i }).first();
      if (await nextButton.isEnabled().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(800);
      }
    }
    
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  });

  test('should allow "Complete later" button to work', async ({ page }) => {
    await page.goto('/pro-onboarding');
    await expect(page.getByText(/bienvenue|onboarding/i)).toBeVisible({ timeout: 10000 });
    
    const laterButton = page.getByRole('button', { name: /plus tard|skip|ignorer/i });
    if (await laterButton.isVisible().catch(() => false)) {
      await laterButton.click();
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/.*dashboard.*/);
    } else {
      test.skip();
    }
  });
});
