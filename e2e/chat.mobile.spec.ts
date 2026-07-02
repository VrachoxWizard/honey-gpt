import { test, expect } from '@playwright/test';

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens mobile sidebar and starts a new chat', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Otvori bočnu traku' }).click();
    await expect(page.getByRole('dialog', { name: 'Bočna traka razgovora' })).toBeVisible();
    await page
      .getByRole('dialog', { name: 'Bočna traka razgovora' })
      .getByRole('button', { name: /Novi zapis/i })
      .click();
    await expect(page.getByRole('dialog', { name: 'Bočna traka razgovora' })).toBeHidden();
    await page.getByRole('button', { name: 'Otvori bočnu traku' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Bočna traka razgovora' }).getByRole('button', {
        name: 'Novi razgovor',
      })
    ).toHaveCount(2);
  });

  test('shows composer on mobile welcome screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Upiši molbu')).toBeVisible();
    await expect(page.getByLabel('Zapečati i pošalji')).toBeVisible();
  });

  test('shows a status chip with active rite and model, which opens the sidebar', async ({
    page,
  }) => {
    await page.goto('/');
    const chip = page.getByRole('button', { name: /Aktivni obred:.*Model:/i });
    await expect(chip).toBeVisible();

    await chip.click();
    await expect(page.getByRole('dialog', { name: 'Bočna traka razgovora' })).toBeVisible();
  });

  test('welcome screen hints at shortcuts without a separate onboarding flow', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText(/za kratice/i)).toBeVisible();
    await expect(page.getByText(/za pretragu/i)).toBeVisible();
  });
});
