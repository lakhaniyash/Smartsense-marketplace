import { defineConfig, devices } from '@playwright/test'

// PW_BASE_URL points Playwright at an already-running stack (the CI
// Playwright job's Docker Compose stack, serving web on 8081) instead of
// letting Playwright boot its own `npm run dev` on 5173. Deliberately a
// dedicated variable, not the existing `CI` var above — `CI` also gates the
// Jest/API job and any future CI job that isn't this one, and overloading it
// here would change `retries`/`workers` semantics for those unrelated cases.
const externalBaseURL = process.env['PW_BASE_URL']

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  ...(process.env['CI'] !== undefined && { workers: 1 }),
  reporter: [['html'], ['list']],
  use: {
    baseURL: externalBaseURL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  // Omitted entirely (not just disabled) when PW_BASE_URL targets an
  // already-running stack — Playwright must never try to spawn or wait on a
  // dev server it didn't start.
  ...(externalBaseURL === undefined && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env['CI'],
    },
  }),
})
