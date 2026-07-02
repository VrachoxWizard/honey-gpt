import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('welcome page passes basic accessibility scan', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast', 'page-has-heading-one'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('welcome page renders correctly with prefers-reduced-motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Mir s tobom, sine/i })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast', 'page-has-heading-one'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('chat view after mocked response passes basic accessibility scan', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    const body =
      'data: {"token":"Mir"}\n\n' +
      'data: {"token":" s tobom."}\n\n' +
      'data: [DONE]\n\n';

    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      body,
    });
  });

  await page.goto('/');
  await page.getByLabel('Upiši molbu').fill('Kako si?');
  await page.getByLabel('Zapečati i pošalji').click();
  await expect(page.getByText('Mir s tobom.')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast', 'page-has-heading-one'])
    .analyze();
  expect(results.violations).toEqual([]);
});
