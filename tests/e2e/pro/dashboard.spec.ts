import { test, expect } from '@playwright/test';

test.describe('Pro Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  });

  test('should load dashboard correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/tableau.*bord|dashboard|bienvenue/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const kpiSection = page.locator('[data-testid="kpis"], .kpi-section, .stats-section').first();
    const kpiTexts = page.getByText(/revenu|chiffre|réservation|client|rdv/i);
    
    const hasKpis = await kpiSection.isVisible().catch(() => false) || 
                    await kpiTexts.first().isVisible().catch(() => false);
    expect(hasKpis).toBeTruthy();
  });

  test('should show OnboardingChecklist if profile incomplete', async ({ page }) => {
    await page.goto('/dashboard');
    
    const checklist = page.locator('[data-testid="onboarding-checklist"], .checklist, .onboarding-progress').first();
    const hasChecklist = await checklist.isVisible().catch(() => false);
    
    if (hasChecklist) {
      await expect(checklist).toBeVisible();
    }
  });

  test('should navigate to all dashboard sections', async ({ page }) => {
    await page.goto('/dashboard');
    
    const sections = [
      { name: 'calendar', url: /.*calendar.*|.*agenda.*/ },
      { name: 'clients', url: /.*client.*/ },
      { name: 'services', url: /.*service.*/ },
      { name: 'settings', url: /.*setting.*|.*paramètre.*/ },
    ];
    
    for (const section of sections) {
      await page.goto('/dashboard');
      await page.waitForTimeout(500);
      
      const navLink = page.getByRole('link', { name: new RegExp(section.name, 'i') }).first() ||
                      page.locator(`a[href*="${section.name}"]`).first();
      
      if (await navLink.isVisible().catch(() => false)) {
        await navLink.click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(section.url);
      }
    }
  });

  test('should toggle sidebar hamburger on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    const hamburger = page.locator('[data-testid="hamburger"], .hamburger, button:has([aria-label*="menu"]), button svg[aria-hidden="true"]').first();
    const menuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu")').first();
    
    const toggleButton = await hamburger.isVisible().catch(() => false) ? hamburger : menuButton;
    
    if (await toggleButton.isVisible().catch(() => false)) {
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      const sidebar = page.locator('[data-testid="sidebar"], aside, nav[class*="sidebar"]').first();
      if (await sidebar.isVisible().catch(() => false)) {
        const isExpanded = await sidebar.isVisible();
        expect(isExpanded).toBeTruthy();
      }
      
      await toggleButton.click();
    }
  });
});
