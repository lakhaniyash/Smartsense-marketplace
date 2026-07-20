import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from './login.page'

// Seeded dev-only user from docs/keycloak-setup.md § Users — real credentials
// against the real local Keycloak realm, not a mock. The full login → guard
// → logout journey is one continuous test (one sign-in) rather than several
// independent specs each re-authenticating: the realm has
// bruteForceProtected: true, and concurrent logins as the same seeded user
// across parallel workers are flaky against it — one login per account is
// the actual fix, not a serialization workaround.
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'

test.describe('Session lifecycle', () => {
  test('login lands on the requested route, /login redirects away, logout clears the session', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText(PARTNER_EMAIL)).toBeVisible()

    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard$/)

    // "Log out" lives inside the sidebar's account menu (UserMenu) — it
    // isn't in the DOM until the trigger (accessible name "Account menu for
    // <email>") opens it.
    await page.getByRole('button', { name: `Account menu for ${PARTNER_EMAIL}` }).click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/realms\/smartsense-marketplace\/protocol\/openid-connect\/auth/)
  })
})
