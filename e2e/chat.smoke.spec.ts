import { test, expect } from '@playwright/test';

test('loads app shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
