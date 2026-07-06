import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only user (docs/keycloak-setup.md § Users), same real Keycloak
// realm login as auth/session.spec.ts and dashboard/dashboard.spec.ts — one
// continuous session with one sign-in, per those specs' established fix for
// this realm's bruteForceProtected: true setting (concurrent logins as the
// same seeded user across parallel workers is flaky).
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'

test.describe('Catalog', () => {
  test('product list renders, and a product can be created, edited, and deleted', async ({
    page,
  }) => {
    const uniqueSku = `PW-E2E-${Date.now()}`

    // SM-158: product list renders.
    await page.goto('/catalog')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)
    await expect(page).toHaveURL(/\/catalog$/)

    await expect(page.getByRole('heading', { name: 'Catalog', exact: true })).toBeVisible()
    await expect(page.getByLabel('Search')).toBeVisible()
    await expect(page.getByLabel('Category')).toBeVisible()
    await expect(page.getByLabel('Status')).toBeVisible()
    // Either a table or the empty state is a correct rendered outcome —
    // what must never happen is the Error state.
    await expect(page.getByText("Couldn't load products")).not.toBeVisible()

    // SM-167: create product.
    await page.getByRole('link', { name: 'New Product' }).click()
    await expect(page).toHaveURL(/\/catalog\/new$/)

    await page.getByLabel('Title').fill('Playwright E2E Product')
    await page.getByLabel('Category').selectOption({ label: 'Electronics' })
    await page.getByLabel('SKU').fill(uniqueSku)
    await page.getByRole('button', { name: 'Create product' }).click()

    await expect(page.getByText('Product created')).toBeVisible()
    await expect(page).toHaveURL(/\/catalog\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: 'Playwright E2E Product' })).toBeVisible()
    await expect(page.getByText(`SKU: ${uniqueSku}`)).toBeVisible()

    // The created product is now findable via search on the list page. Scope
    // by the (unique-per-run) SKU rather than the shared title — archived
    // fixtures from prior runs keep the same title (archive ≠ delete, per
    // docs/domain-model.md) and would otherwise make the title ambiguous.
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Catalog' })
      .click()
    await page.getByLabel('Search').fill(uniqueSku)
    const matchingRow = page.getByRole('row', { name: new RegExp(uniqueSku) })
    await expect(matchingRow).toBeVisible()

    // Edit.
    await matchingRow.getByRole('link').click()
    await page.getByRole('link', { name: 'Edit' }).click()
    await expect(page).toHaveURL(/\/edit$/)
    await page.getByLabel('Title').fill('Playwright E2E Product (renamed)')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Product updated')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Playwright E2E Product (renamed)' }),
    ).toBeVisible()

    // Delete — cleans up the fixture this test created.
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Product deleted')).toBeVisible()
    await expect(page).toHaveURL(/\/catalog$/)
  })
})
