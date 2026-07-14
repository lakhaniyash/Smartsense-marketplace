import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only users (docs/keycloak-setup.md § Users). Sprint 2 (Customer
// Management, SM-320) — not tied to a docs/milestones.md milestone.
//
// The comprehensive flow below needs Admin (createCustomer is Admin-only,
// docs/authorization.md § Ownership Rules). reports.spec.ts's second test is
// this suite's only other Admin login, so a worker-level race between the
// two is a real (not merely theoretical) risk under this realm's
// `bruteForceProtected: true` setting on a local, non-CI, multi-worker run —
// CI is unaffected (`playwright.config.ts` pins `workers: 1` there). This is
// the same tradeoff the project already accepts at larger scale for the
// Partner account, shared across seven other spec files in this folder. The
// negative-access test below logs in as a different account (Customer) and
// carries no such risk.
//
// Address CRUD (SM-324), CSV export (SM-327), the billing summary display,
// and filter/search were all previously unexercised here despite shipping
// alongside/after this file's original two tests (SM-345) — all folded into
// this same single Admin-login flow below rather than new `test()` blocks,
// to avoid adding further Admin logins to this file.
const ADMIN_EMAIL = 'yash.lakhani+admin@smartsensesolutions.com'
const ADMIN_PASSWORD = 'Admin@12345'
const CUSTOMER_EMAIL = 'yash.lakhani+customer@smartsensesolutions.com'
const CUSTOMER_PASSWORD = 'Customer@12345'

test.describe('Customer Management', () => {
  test('an Admin creates a customer, filters/exports the list, manages its addresses, and suspends/reactivates it', async ({
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

    // Search narrows to this customer by displayName (CustomerFilterInput.search
    // matches displayName/billingEmail — docs/graphql.md § Searching).
    await page.getByLabel('Search', { exact: true }).fill(displayName)
    await expect(customerRow).toBeVisible()

    // Combined with a Status filter that excludes it (still Active at this
    // point), the row disappears and the "no match" empty state renders.
    await page.getByLabel('Status').selectOption({ label: 'Suspended' })
    await expect(customerRow).not.toBeVisible()
    await expect(page.getByText('No customers match this filter')).toBeVisible()

    // Clearing filters restores the row.
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await page.getByLabel('Search', { exact: true }).fill(displayName)
    await expect(customerRow).toBeVisible()

    // CSV export — a direct download, not a menu (unlike the Reports
    // module's Export/Export-as-CSV two-step), matching CustomersPage's
    // handleExportCsv/downloadBlob('customers.csv').
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export CSV' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('customers.csv')

    await customerRow.getByRole('link', { name: displayName }).click()
    await expect(page).toHaveURL(/\/customers\/[0-9a-f-]+$/)

    // Every tab renders without throwing — the assertion is just that the
    // click succeeds and the page keeps responding to further interaction.
    for (const tabName of ['Orders', 'Addresses', 'Assigned Users', 'Activity', 'Details']) {
      await page.getByRole('tab', { name: tabName }).click()
    }

    // Details tab (last clicked above) shows the billing summary block —
    // customerById always computes one (never null), even at zero, unlike
    // the customers list which intentionally omits it per row.
    await expect(page.getByText('Total orders')).toBeVisible()
    await expect(page.getByText('Total invoiced')).toBeVisible()
    await expect(page.getByText('Outstanding')).toBeVisible()

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

    // Address CRUD (SM-324) — add, edit, and deactivate, all on the
    // Addresses tab of the customer just created above.
    await page.getByRole('tab', { name: 'Addresses' }).click()
    await page.getByRole('button', { name: 'Add address' }).click()
    const addDrawer = page.getByRole('dialog')
    await addDrawer.getByLabel('Address line 1').fill('Playwright E2E Address Line 1')
    await addDrawer.getByLabel('City').fill('Testville')
    await addDrawer.getByLabel('State').fill('TS')
    await addDrawer.getByLabel('Postal code').fill('00000')
    await addDrawer.getByLabel('Country').fill('US')
    await addDrawer.getByRole('button', { name: 'Add address' }).click()
    await expect(page.getByText('Address added').first()).toBeVisible()
    await expect(page.getByText('Playwright E2E Address Line 1')).toBeVisible()

    await page.getByRole('button', { name: 'Edit' }).click()
    const editDrawer = page.getByRole('dialog')
    await editDrawer.getByLabel('Address line 1').fill('Playwright E2E Address Line 1 (Updated)')
    await editDrawer.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Address updated').first()).toBeVisible()
    await expect(page.getByText('Playwright E2E Address Line 1 (Updated)')).toBeVisible()

    await page.getByRole('button', { name: 'Deactivate' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Deactivate' }).click()
    await expect(page.getByText('Address deactivated').first()).toBeVisible()
    await expect(page.getByText('Playwright E2E Address Line 1 (Updated)')).not.toBeVisible()

    // Activity tab now also reflects the three address actions, most recent
    // first, ahead of the suspend/reactivate/created entries already
    // asserted above (CustomerTimeline falls back to the raw action string
    // for anything not in its ACTION_LABEL map, e.g. ADDRESS_ADDED).
    await page.getByRole('tab', { name: 'Activity' }).click()
    await expect(activityItems).toHaveCount(6)
    await expect(activityItems.nth(0)).toContainText('ADDRESS_DEACTIVATED')
    await expect(activityItems.nth(1)).toContainText('ADDRESS_UPDATED')
    await expect(activityItems.nth(2)).toContainText('ADDRESS_ADDED')
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
