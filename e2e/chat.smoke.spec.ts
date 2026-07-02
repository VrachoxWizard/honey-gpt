import { test, expect } from '@playwright/test';

test('loads app shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('shows welcome and at least one session after bootstrap', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByText(/Mir s tobom, sine/i)).toBeVisible();
  await expect(page.getByText('Novi razgovor')).toBeVisible();
});

test('sends a message through mocked chat API', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    const body =
      'data: {"token":"Mir"}\n\n' +
      'data: {"token":" s tobom."}\n\n' +
      'data: {"model":"google/gemini-2.5-flash"}\n\n' +
      'data: [DONE]\n\n';

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Request-Id': 'test-request-id',
      },
      body,
    });
  });

  await page.goto('/');
  const input = page.getByLabel('Upiši molbu');
  await input.fill('Kako si?');
  await page.getByLabel('Zapečati i pošalji').click();
  await expect(page.getByText('Mir s tobom.')).toBeVisible();
});

test('creates a new chat from sidebar action', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: /Novi zapis/i }).click();
  await expect(page.getByText('Novi razgovor')).toHaveCount(2);
});

test('opens shared read-only view from URL', async ({ page }) => {
  const payload = {
    version: 1,
    title: 'Dijeljeni zapis',
    exportedAt: Date.now(),
    messages: [
      {
        id: 'u1',
        role: 'user',
        content: 'Pozdrav iz dijeljenog linka',
        timestamp: Date.now(),
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Mir s tobom, sine moj!',
        timestamp: Date.now(),
      },
    ],
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  await page.goto(`/?share=${encoded}`);
  await expect(page.getByText(/Samo za čitanje/i)).toBeVisible();
  await expect(page.getByText('Pozdrav iz dijeljenog linka')).toBeVisible();
  await expect(page.getByPlaceholder(/Upiši svoju molbu/i)).toHaveCount(0);
});

test('renders voice buttons (TTS and STT)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as any).webkitSpeechRecognition = function () {};
    (window as any).speechSynthesis = {
      speak: () => {},
      cancel: () => {},
      getVoices: () => [{ lang: 'hr-HR' }],
    };
  });

  await page.goto('/');
  await expect(page.getByLabel('Govori')).toBeVisible();
});

test('renders download as image button in sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByLabel('Preuzmi kao sliku')).toBeVisible();
});

test('navigating to /share?share=... and closing it redirects back to /', async ({ page }) => {
  const payload = {
    version: 1,
    title: 'Podijeljeni chat',
    exportedAt: Date.now(),
    messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');

  await page.goto(`/share?share=${encoded}`);
  await expect(page.getByText(/Samo za čitanje/i)).toBeVisible();

  await page.getByRole('button', { name: 'Zatvori' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
});
