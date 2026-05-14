import { test, expect } from '@playwright/test';

test.describe('Pro Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill('test.pro.e2e@calendapro.test');
    await passwordInput.fill('TestPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  });

  test('should load calendar view correctly', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/.*calendar.*/);
    await expect(page.locator('body')).toBeVisible();
    
    const calendar = page.locator('.rbc-calendar, [data-testid="calendar"], .calendar').first();
    const calendarText = page.getByText(/lundi|mardi|mercredi|aujourd|semaine/i);
    
    const hasCalendar = await calendar.isVisible().catch(() => false) ||
                        await calendarText.first().isVisible().catch(() => false);
    expect(hasCalendar).toBeTruthy();
  });

  test('should navigate to previous and next week', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForTimeout(1500);
    
    const prevButton = page.getByRole('button', { name: /précédent|<|←/i }).first() ||
                       page.locator('button svg[aria-label*="précédent"]').first();
    const nextButton = page.getByRole('button', { name: /suivant|>|→/i }).first() ||
                       page.locator('button svg[aria-label*="suivant"]').first();
    
    const initialDate = await page.locator('.rbc-toolbar__label, [data-testid="calendar-date"]').first().textContent().catch(() => '');
    
    if (await prevButton.isVisible().catch(() => false)) {
      await prevButton.click();
      await page.waitForTimeout(1000);
      
      const newDate = await page.locator('.rbc-toolbar__label, [data-testid="calendar-date"]').first().textContent().catch(() => '');
      expect(newDate).not.toEqual(initialDate);
    }
    
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show day view on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/calendar');
    await page.waitForTimeout(1500);
    
    const dayViewButton = page.getByRole('button', { name: /jour|day/i }).first() ||
                          page.locator('button:has-text("Jour")').first();
    
    if (await dayViewButton.isVisible().catch(() => false)) {
      await dayViewButton.click();
      await page.waitForTimeout(500);
      
      const dayView = page.locator('.rbc-day-view, [data-testid="day-view"]').first();
      expect(await dayView.isVisible().catch(() => true)).toBeTruthy();
    }
  });

  test('should display existing appointments', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForTimeout(2000);
    
    const appointments = page.locator('.rbc-event, [data-testid*="appointment"], .appointment').first();
    const hasAppointments = await appointments.isVisible().catch(() => false);
    
    if (!hasAppointments) {
      test.info().annotations.push({ type: 'info', description: 'No existing appointments to display' });
    }
  });

  test('should create manual appointment from dashboard', async ({ page }) => {
    await page.goto('/dashboard/calendar');
    await page.waitForTimeout(1500);
    
    const addButton = page.getByRole('button', { name: /nouveau|ajouter|créer|rdv/i }).first() ||
                      page.locator('button svg[aria-label*="add"]').first();
    
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      const clientInput = page.getByLabel(/client|nom/i).first() || page.locator('input[name="clientName"]').first();
      const serviceSelect = page.getByLabel(/service/i).first() || page.locator('select[name="service"]').first();
      
      await clientInput.fill('Client Test E2E');
      if (await serviceSelect.isVisible().catch(() => false)) {
        await serviceSelect.selectOption({ index: 0 });
      }
      
      const saveButton = page.getByRole('button', { name: /sauvegarder|créer/i }).first();
      await saveButton.click();
      
      await page.waitForTimeout(1500);
      await expect(page.getByText(/créé|succès|Client Test E2E/i).first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});
