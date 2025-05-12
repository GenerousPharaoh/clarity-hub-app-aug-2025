import { defineConfig, devices } from '@playwright/test';

// Resolve port dynamically from environment variables
// Fallback chain: VITE_TEST_PORT -> VITE_DEV_PORT -> 'auto' (meaning use any available port)
const port = process.env.VITE_TEST_PORT || process.env.VITE_DEV_PORT || 'auto';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 5000 },
  use: {
    // Allow overriding via APP_URL env var, fallback to localhost with dynamic port
    baseURL: process.env.APP_URL || (port === 'auto' ? 'http://localhost' : `http://localhost:${port}`),
    headless: true,
    viewport: { width: 1280, height: 720 },
    video: 'retain-on-failure',
    actionTimeout: 5000,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
}); 