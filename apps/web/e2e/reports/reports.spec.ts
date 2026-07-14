import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only user (docs/keycloak-setup.md § Users) — same real Keycloak
// realm login as dashboard.spec.ts, not a mock. One continuous test with one
// sign-in, per auth/session.spec.ts's established fix for this realm's
// bruteForceProtected: true setting, which makes concurrent logins as the
// same seeded user across parallel workers flaky (see the "one login per
// account" convention every other e2e spec in this folder follows).
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'

// The billing report period is anchored to a value derived from the current
// run so repeated local runs against the same dev database don't collide
// with `generateBillingReport`'s overlapping-period rejection (the GiST
// exclusion constraint, docs/domain-model.md § Billing Report) — every other
// report page has no such uniqueness constraint to work around.
const runOffsetDays = Math.floor(Date.now() / 1000) % 3650
const periodStart = new Date(2000, 0, 1 + runOffsetDays)
const periodEnd = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000)

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

test.describe('Reports', () => {
  test('navigation, every report route, billing report lifecycle, export, and dark mode', async ({
    page,
  }) => {
    await page.goto('/reports')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)
    await expect(page).toHaveURL(/\/reports$/)

    // Reports Dashboard: KPI cards + nav grid to every report route.
    await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible()
    await expect(page.getByText('Gross revenue')).toBeVisible()
    await expect(page.getByText('Total orders')).toBeVisible()
    await expect(page.getByRole('link', { name: /Revenue/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Billing Reports/ })).toBeVisible()
    // Disambiguated from the sidebar's own plain "Customers" nav link
    // (Customer Management, /customers) by the nav card's composite
    // accessible name (title + description).
    await expect(page.getByRole('link', { name: /^Customers Customer count by/ })).toBeVisible()

    // Revenue report: KPI cards + chart + CSV export.
    await page.getByRole('link', { name: /^Revenue\b/ }).click()
    await expect(page).toHaveURL(/\/reports\/revenue$/)
    await expect(page.getByRole('heading', { name: 'Revenue', exact: true })).toBeVisible()
    await expect(page.getByText('Commission')).toBeVisible()
    let downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click()
    let download = await downloadPromise
    expect(download.suggestedFilename()).toBe('revenue-report.csv')

    // Orders report.
    await page.goto('/reports/orders')
    await expect(page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible()
    await expect(page.getByText('Average order value')).toBeVisible()

    // Inventory report — no date-range control (point-in-time snapshot).
    await page.goto('/reports/inventory')
    await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible()
    await expect(page.getByText('Total variants')).toBeVisible()
    await expect(page.getByLabel('Date range')).not.toBeVisible()
    downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click()
    download = await downloadPromise
    expect(download.suggestedFilename()).toBe('inventory-report.csv')

    // Product performance report — chart + sortable/paginated table.
    await page.goto('/reports/product-performance')
    await expect(
      page.getByRole('heading', { name: 'Product Performance', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toBeVisible()

    // Notification activity report.
    await page.goto('/reports/notification-activity')
    await expect(
      page.getByRole('heading', { name: 'Notification Activity', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Total notifications')).toBeVisible()

    // Customers report (SM-330) — point-in-time snapshot, no date-range
    // control, same as Inventory above.
    await page.goto('/reports/customers')
    await expect(page.getByRole('heading', { name: 'Customers', exact: true })).toBeVisible()
    await expect(page.getByText('Total customers')).toBeVisible()
    await expect(page.getByLabel('Date range')).not.toBeVisible()
    downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click()
    download = await downloadPromise
    expect(download.suggestedFilename()).toBe('customers-report.csv')

    // Billing reports: generate -> finalize -> mark paid out, end to end.
    await page.goto('/reports/billing-reports')
    await expect(page.getByRole('heading', { name: 'Billing Reports', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Generate report' }).click()
    await expect(page.getByRole('heading', { name: 'Generate billing report' })).toBeVisible()
    // Partner ID field must not render for a Partner caller — their own
    // partnerId always wins server-side (GenerateBillingReportInput's doc
    // comment).
    await expect(page.getByLabel('Partner ID')).toHaveCount(0)
    await page.getByLabel('Period start').fill(toDateInputValue(periodStart))
    await page.getByLabel('Period end').fill(toDateInputValue(periodEnd))
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    await expect(page.getByText('Billing report generated')).toBeVisible()

    const periodLabel = `${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}`
    await page.getByRole('link', { name: periodLabel }).click()
    await expect(page).toHaveURL(/\/reports\/billing-reports\/.+/)
    // "Generated" is ambiguous on this page (the status filter's own list
    // page can still be in a transitional Suspense state, plus the toast
    // text) — the Finalize action button only ever renders for a GENERATED
    // report (BillingReportDetailPage's own `canFinalize` gate), so its
    // presence is the unambiguous proof of the lifecycle state.
    const finalizeButton = page.getByRole('button', { name: 'Finalize', exact: true })
    await expect(finalizeButton).toBeVisible()

    await finalizeButton.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Finalize', exact: true }).click()
    await expect(page.getByText('Billing report finalized')).toBeVisible()
    const markPaidOutButton = page.getByRole('button', { name: 'Mark paid out', exact: true })
    await expect(markPaidOutButton).toBeVisible()

    await markPaidOutButton.click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Mark paid out', exact: true })
      .click()
    await expect(page.getByText('Billing report marked paid out')).toBeVisible()
    await expect(markPaidOutButton).not.toBeVisible()
    await expect(finalizeButton).not.toBeVisible()

    // Dark mode: the Chart wrapper re-applies its palette by hand on every
    // theme toggle (Chart.tsx's own doc comment — canvas can't read Tailwind
    // `dark:` classes) — confirm the toggle itself flips the resolved theme
    // on a chart-bearing page. The cycle is light -> dark -> system
    // (ThemeToggle.tsx's own `NEXT_MODE` table), so this clicks until the
    // explicit "dark" mode is reached — not "system", whose resolved theme
    // depends on the OS/browser preference and isn't deterministic here.
    await page.goto('/reports/revenue')
    const themeToggle = page.getByRole('button', { name: /^Theme:/ })
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const label = await themeToggle.getAttribute('aria-label')
      if (label?.startsWith('Theme: Dark theme')) break
      await themeToggle.click()
    }
    await expect(page.getByRole('button', { name: /^Theme: Dark theme/ })).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true)
  })

  // A separate account (never run in parallel against the same seeded user
  // as the test above — Keycloak's `bruteForceProtected: true` realm setting
  // only makes concurrent logins as the *same* user flaky).
  test('an Admin caller sees the all-partners aggregate and a Partner ID field to generate for any partner', async ({
    page,
  }) => {
    await page.goto('/reports')
    await new KeycloakLoginPage(page).loginAs(
      'yash.lakhani+admin@smartsensesolutions.com',
      'Admin@12345',
    )
    await expect(page).toHaveURL(/\/reports$/)
    await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible()
    await expect(page.getByText('Gross revenue')).toBeVisible()

    await page.goto('/reports/billing-reports')
    await page.getByRole('button', { name: 'Generate report' }).click()
    // No partner-listing query exists on the schema today (verified directly
    // against apps/api/src/schema.gql) — an Admin caller gets a plain text
    // Partner ID field rather than a fake dropdown (ReportFilterBar.tsx's own
    // doc comment on this accepted gap).
    await expect(page.getByLabel('Partner ID')).toBeVisible()
  })
})
