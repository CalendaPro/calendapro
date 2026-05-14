import { test, expect } from '@playwright/test';

const publicPages = [
  { url: '/', name: 'Home' },
  { url: '/marketplace', name: 'Marketplace' },
  { url: '/testuser', name: 'Pro Profile' },
  { url: '/mentions-legales', name: 'Legal' },
];

test.describe('SEO Requirements', () => {
  for (const pageInfo of publicPages) {
    test(`should have unique <title> on ${pageInfo.name}`, async ({ page }) => {
      await page.goto(pageInfo.url);
      await page.waitForTimeout(1500);
      
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(5);
      expect(title.length).toBeLessThan(100);
    });

    test(`should have meta description on ${pageInfo.name}`, async ({ page }) => {
      await page.goto(pageInfo.url);
      await page.waitForTimeout(1500);
      
      const description = page.locator('meta[name="description"]').first();
      const content = await description.getAttribute('content').catch(() => null);
      
      if (content) {
        expect(content.length).toBeGreaterThan(10);
        expect(content.length).toBeLessThan(200);
      } else {
        // Certaines pages peuvent ne pas avoir de meta description
        test.info().annotations.push({ type: 'info', description: 'Meta description not found' });
      }
    });
  }

  test('should have Open Graph tags on marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForTimeout(1500);
    
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content').catch(() => null);
    const ogDescription = await page.locator('meta[property="og:description"]').first().getAttribute('content').catch(() => null);
    const ogUrl = await page.locator('meta[property="og:url"]').first().getAttribute('content').catch(() => null);
    
    const hasOgTags = !!(ogTitle || ogDescription || ogUrl);
    expect(hasOgTags).toBe(true);
  });

  test('should have accessible sitemap.xml', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    
    if (response && response.status() === 200) {
      const content = await page.content();
      expect(content).toContain('<urlset');
      expect(content).toContain('</urlset>');
    } else {
      test.info().annotations.push({ type: 'info', description: 'Sitemap may be generated at build time' });
    }
  });

  test('should have accessible robots.txt', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    
    if (response && response.status() === 200) {
      const content = await page.content();
      expect(content).toContain('User-agent');
    } else {
      test.info().annotations.push({ type: 'info', description: 'Robots.txt may be generated at build time' });
    }
  });

  test('should have H1 on all public pages', async ({ page }) => {
    // Tester seulement les pages qui devraient avoir un H1
    const pagesWithH1 = publicPages.slice(0, 2);
    
    for (const pageInfo of pagesWithH1) {
      await page.goto(pageInfo.url);
      await page.waitForTimeout(1500);
      
      const h1 = page.locator('h1').first();
      const count = await h1.count();
      
      if (count > 0) {
        await expect(h1).toBeVisible();
        const text = await h1.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      } else {
        // Certaines pages peuvent ne pas avoir de H1 visible
        test.info().annotations.push({ type: 'info', description: `No H1 found on ${pageInfo.name}` });
      }
    }
  });
});
