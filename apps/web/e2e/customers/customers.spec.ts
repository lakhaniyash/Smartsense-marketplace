import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only users (docs/keycloak-setup.md § Users). Sprint 2 (Customer
// Management, SM-320) — not tied to a docs/milestones.md milestone.
//
// The comprehensive flow below needs Admin (createCustomer is Admin-only,
// docs/authorization.md § Ownership Rules). reports.spec.ts's second test is
// this suite's only other Admin login — both are isolated to their own
// test/file and never intentionally run at the exact same instant, but a
// worker-level race between the two is the same accepted risk that file's
// own comment already documents for this realm's `bruteForceProtected: true`
// setting, not a new one introduced here. The negative-access test below
// logs in as a different account (Customer) and carries no such risk.
const ADMIN_EMAIL = 'yash.lakhani+admin@smartsensesolutions.com'
const ADMIN_PASSWORD = 'Admin@12345'
const CUSTOMER_EMAIL = 'yash.lakhani+customer@smartsensesolutions.com'
const CUSTOMER_PASSWORD = 'Customer@12345'

test.describe('Customer Management', () => {
  test('an Admin creates a customer, views its tabs, suspends and reactivates it', async ({
    page,
  }) => {
    const timestamp = Date.now()
    const displayName = `Playwright E2E Customer ${timestamp}`
    const billingEmail = `yash.lakhani+pwe2e${timestamp}@smartsensesolutions.com`

    await page.goto('/customers/new')
    await new KeycloakLoginPage(page).loginAs(ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page).toHaveURL(/\/customers\/new$/)

    await page.getByLabel('Display name').fill(displayName)
    await page.getByLabel('Type').selectOption({ label: 'Organization' })
    await page.getByLabel('Billing email').fill(billingEmail)
    await page.getByRole('button', { name: 'Create customer' }).click()

    await expect(page.getByText('Customer created').first()).toBeVisible()
    await expect(page).toHaveURL(/\/customers\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: displayName })).toBeVisible()
    await expect(page.getByText('Active').first()).toBeVisible()

    // The customer list (/customers) renders with the new customer present.
    await page.goto('/customers')
    const customerRow = page.getByRole('row', { name: new RegExp(displayName) })
    await expect(customerRow).toBeVisible()
    await customerRow.getByRole('link', { name: displayName }).click()
    await expect(page).toHaveURL(/\/customers\/[0-9a-f-]+$/)

    // Every tab renders without throwing — the assertion is just that the
    // click succeeds and the page keeps responding to further interaction.
    for (const tabName of ['Orders', 'Addresses', 'Assigned Users', 'Activity', 'Details']) {
      await page.getByRole('tab', { name: tabName }).click()
    }

    // Suspend (Active -> Suspended): requires the confirm dialog per
    // docs/ui-guidelines.md's dangerous-action rule.
    await page.getByRole('button', { name: 'Suspend' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Suspend' }).click()
    await expect(page.getByText('Customer suspended').first()).toBeVisible()
    await expect(page.getByText('Suspended').first()).toBeVisible()

    // Reactivate (Suspended -> Active): reversible, no confirm dialog.
    await page.getByRole('button', { name: 'Reactivate' }).click()
    await expect(page.getByText('Customer reactivated').first()).toBeVisible()
    await expect(page.getByText('Active').first()).toBeVisible()

    // Activity tab shows the full history, most recent first
    // (AuditLogService.findForEntity's orderBy).
    await page.getByRole('tab', { name: 'Activity' }).click()
    const activityItems = page.getByRole('tabpanel', { name: 'Activity' }).getByRole('listitem')
    await expect(activityItems).toHaveCount(3)
    await expect(activityItems.nth(0)).toContainText('Customer reactivated')
    await expect(activityItems.nth(1)).toContainText('Customer suspended')
    await expect(activityItems.nth(2)).toContainText('Customer created')
  })

  // A different account — never run concurrently against the same seeded
  // user as the test above (Keycloak's bruteForceProtected: true realm
  // setting only makes concurrent logins as the *same* user flaky).
  test('a Customer-role login has no Customers nav item and cannot reach /customers', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await new KeycloakLoginPage(page).loginAs(CUSTOMER_EMAIL, CUSTOMER_PASSWORD)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()

    // customers:read/customers:write/customers:manage are not granted to the
    // Customer role (docs/authorization.md § Resource Authorization) — this
    // is an Admin/Partner management surface, not buyer self-service.
    await expect(page.getByRole('link', { name: 'Customers' })).not.toBeVisible()

    await page.goto('/customers')
    await expect(page).toHaveURL(/\/forbidden$/)
    await expect(
      page.getByRole('heading', { name: "You don't have access to this page" }),
    ).toBeVisible()
  })
})
