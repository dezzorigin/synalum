import { defineConfig, devices } from '@playwright/test'

// E2E melawan build demo (VITE_DEMO_MODE=true): tanpa API, tanpa jaringan.
// Build dibuat job CI sebelum `npx playwright test`; webServer hanya
// menyajikan hasil build lewat `vite preview`.
// Runner di-pin ubuntu-24.04 (pola #53): Playwright 1.55 tidak mendukung
// ubuntu 26.04 ("Playwright does not support chromium on ubuntu26.04-x64").
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
