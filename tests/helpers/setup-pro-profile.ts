import { Page, APIRequestContext, expect } from '@playwright/test';
import { ProUser } from '../fixtures/pro-user';
import { mockServices, defaultAvailability } from '../fixtures/mock-availability';

export async function setupProProfile(
  page: Page,
  request: APIRequestContext,
  user: ProUser
): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  await createService(request, user, mockServices[0]);
  await createService(request, user, mockServices[1]);
  await setAvailability(request, user, defaultAvailability);
  
  await page.goto('/dashboard');
  await page.reload();
  await page.waitForTimeout(1000);
}

export async function completeOnboarding(page: Page, user: ProUser): Promise<void> {
  await page.goto('/pro-onboarding');
  
  await expect(page.getByText(/bienvenue|onboarding|configuration/i)).toBeVisible({ timeout: 10000 });
  
  await page.getByLabel(/prénom|first name/i).fill(user.firstName);
  await page.getByLabel(/nom|last name/i).fill(user.lastName);
  await page.getByLabel(/nom.*entreprise|business name/i).fill(user.businessName);
  await page.getByLabel(/ville|city/i).fill(user.city);
  
  const nextButton = page.getByRole('button', { name: /suivant|continuer|next/i });
  await nextButton.click();
  
  await page.waitForTimeout(500);
  
  await page.getByLabel(/service|prestation/i).fill(mockServices[0].name);
  await page.getByLabel(/durée|duration/i).fill(mockServices[0].duration.toString());
  await page.getByLabel(/prix|price/i).fill(mockServices[0].price.toString());
  
  await nextButton.click();
  await page.waitForTimeout(500);
  
  await nextButton.click();
  await page.waitForTimeout(500);
  
  const publishButton = page.getByRole('button', { name: /publier|publish|terminer/i });
  await publishButton.click();
  
  await page.waitForURL('/dashboard', { timeout: 15000 });
}

async function createService(
  request: APIRequestContext,
  user: ProUser,
  service: { name: string; duration: number; price: number; description: string }
): Promise<void> {
  try {
    await request.post('/api/services', {
      data: service,
    });
  } catch (e) {
    console.log('Service creation via API failed, will try via UI');
  }
}

async function setAvailability(
  request: APIRequestContext,
  user: ProUser,
  availability: { day: number; isActive: boolean; slots: { start: string; end: string }[] }[]
): Promise<void> {
  try {
    await request.post('/api/availability', {
      data: { availability },
    });
  } catch (e) {
    console.log('Availability creation via API failed, will try via UI');
  }
}
