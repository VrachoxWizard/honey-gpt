import { test, expect } from '@playwright/test';

test('loads production preview build shell', async ({ page, baseURL }) => {
  test.skip(!process.env.PLAYWRIGHT_PREVIEW, 'Preview build test runs only with PLAYWRIGHT_PREVIEW=1');

  await page.goto(baseURL ?? '/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByText(/Mir s tobom/i)).toBeVisible();
});
