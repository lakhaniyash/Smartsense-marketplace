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
  // 5000ms default is too tight for the CI Playwright job specifically —
  // that stack runs 5 Docker containers (db, keycloak-db, keycloak, api,
  // web) plus the browser engine on a GitHub-hosted runner's 2 cores.
  // Confirmed via direct reproduction (docs in reports.spec.ts's history,
  // PR #57): every page renders in ~2s on an idle machine, so this raises
  // the CI budget for real contention rather than masking a defect —
  // local runs (fast machine, no CI env var) keep Playwright's default.
  ...(process.env['CI'] && { expect: { timeout: 15000 } }),
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
