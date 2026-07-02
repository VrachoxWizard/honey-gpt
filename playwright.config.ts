import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'dev',
      use: {
        baseURL: 'http://127.0.0.1:5173',
        headless: true,
      },
    },
    {
      name: 'preview',
      testMatch: /preview\.spec\.ts/,
      use: {
        baseURL: 'http://127.0.0.1:4173',
        headless: true,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_PREVIEW
    ? {
        command: 'npm run preview -- --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
