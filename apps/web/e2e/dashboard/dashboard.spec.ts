import { test, expect, type Route } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only user (docs/keycloak-setup.md § Users) — same real Keycloak
// realm login as auth/session.spec.ts, not a mock. One continuous test with
// one sign-in, per auth/session.spec.ts's established fix for this realm's
// bruteForceProtected: true setting, which makes concurrent logins as the
// same seeded user across parallel workers flaky.
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'

function isDashboardStatsRequest(route: Route): boolean {
  const body = route.request().postDataJSON() as { operationName?: string } | null
  return body?.operationName === 'DashboardStats'
}

test.describe('Dashboard', () => {
  test('authenticated access, loading, error, and rendering across one session', async ({
    page,
  }) => {
    let holdResponse = false
    let held: Promise<void> = Promise.resolve()
    let releaseResponse: () => void = () => {}
    let shouldFail = false

    await page.route('**/graphql', async (route) => {
      if (!isDashboardStatsRequest(route)) {
        await route.continue()
        return
      }
      if (shouldFail) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            errors: [
              { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
            ],
          }),
        })
        return
      }
      if (holdResponse) {
        await held
      }
      await route.continue()
    })

    // Authenticated access + rendering.
    await page.goto('/dashboard')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()

    await expect(page.getByText('Total Products')).toBeVisible()
    await expect(page.getByText('Total Orders')).toBeVisible()
    await expect(page.getByText('Total Customers')).toBeVisible()
    await expect(page.getByText('Total Revenue')).toBeVisible()
    await expect(page.getByText('Coming soon')).toBeVisible()

    await expect(page.getByRole('link', { name: /View Catalog/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /View Orders/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /View Billing/ })).toBeVisible()

    await expect(page.getByText('No recent activity yet')).toBeVisible()

    // Loading state: hold the next dashboardStats response and reload —
    // the existing Keycloak SSO session keeps this page authenticated.
    holdResponse = true
    held = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    await page.reload()

    await expect(page.locator('[aria-hidden="true"].animate-pulse').first()).toBeVisible()
    await expect(page.getByText('Total Products')).not.toBeVisible()

    releaseResponse()
    holdResponse = false
    await expect(page.getByText('Total Products')).toBeVisible()

    // Error state, with a working retry.
    shouldFail = true
    await page.reload()

    await expect(page.getByText("Couldn't load statistics")).toBeVisible()
    const retryButton = page.getByRole('button', { name: 'Try again' })
    await expect(retryButton).toBeVisible()

    shouldFail = false
    await retryButton.click()

    await expect(page.getByText('Total Products')).toBeVisible()
    await expect(page.getByText("Couldn't load statistics")).not.toBeVisible()
  })
})
