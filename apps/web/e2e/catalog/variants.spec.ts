import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only user (docs/keycloak-setup.md § Users), same real Keycloak
// realm login as catalog.spec.ts, auth/session.spec.ts, and
// dashboard/dashboard.spec.ts — one continuous session with one sign-in, per
// those specs' established fix for this realm's bruteForceProtected: true
// setting (concurrent logins as the same seeded user across parallel workers
// is flaky). This file follows the same one-test-per-file shape for the same
// reason: a second `test()` here would run in parallel with this one under
// `fullyParallel: true` and reintroduce that flakiness.
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'

test.describe('Catalog Variants & Inventory', () => {
  test('a variant can be added, its inventory adjusted, promoted to default, and archived', async ({
    page,
  }) => {
    // Distinct, non-overlapping strings (neither a substring of the other) —
    // an unanchored `getByRole('row', { name: regex })` match would
    // otherwise resolve to both rows if one SKU were a prefix of the other.
    const timestamp = Date.now()
    const firstSku = `PW-E2E-VARIANT-ONE-${timestamp}`
    const secondSku = `PW-E2E-VARIANT-TWO-${timestamp}`

    // Create the fixture Product (and its initial default Variant) this
    // test exercises.
    await page.goto('/catalog/new')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)
    await expect(page).toHaveURL(/\/catalog\/new$/)

    await page.getByLabel('Title').fill('Playwright E2E Variant Product')
    await page.getByLabel('Category').selectOption({ label: 'Electronics' })
    await page.getByLabel('SKU').fill(firstSku)
    await page.getByLabel('Price').fill('19.99')
    await page.getByRole('button', { name: 'Create product' }).click()

    await expect(page.getByText('Product created').first()).toBeVisible()
    await expect(page).toHaveURL(/\/catalog\/[0-9a-f-]+$/)

    // The Variants tab shows the initial default Variant with its inventory
    // columns — this is the "Inventory view" requirement, inline rather than
    // a separate page.
    await page.getByRole('tab', { name: 'Variants' }).click()
    const firstRow = page.getByRole('row', { name: new RegExp(firstSku) })
    await expect(firstRow).toBeVisible()
    await expect(firstRow.getByText('19.99')).toBeVisible()
    await expect(firstRow.getByText('Active')).toBeVisible()
    await expect(firstRow.getByText('Default').last()).toBeVisible()

    // Add a second Variant with a structured attribute.
    await page.getByRole('button', { name: 'Add variant' }).click()
    await expect(page.getByRole('heading', { name: 'Add variant' })).toBeVisible()
    await page.getByLabel('SKU').fill(secondSku)
    await page.getByLabel('Price').fill('9.50')
    await page.getByRole('button', { name: 'Add attribute' }).click()
    await page.getByLabel('Attribute 1 key').fill('color')
    await page.getByLabel('Attribute 1 value').fill('Blue')
    await page.getByRole('button', { name: 'Add variant' }).last().click()

    await expect(page.getByText('Variant added').first()).toBeVisible()
    const secondRow = page.getByRole('row', { name: new RegExp(secondSku) })
    await expect(secondRow).toBeVisible()
    await expect(secondRow.getByText('9.5')).toBeVisible()

    // Adjust the new Variant's stock upward — status derives from Inventory
    // and should flip OUT_OF_STOCK -> ACTIVE automatically.
    await secondRow.getByRole('button', { name: 'Adjust stock' }).click()
    await expect(page.getByRole('heading', { name: 'Adjust inventory' })).toBeVisible()
    await page.getByLabel('Quantity').fill('30')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Inventory updated').first()).toBeVisible()
    // On hand and Sellable both read 30 (no reservations yet). Each
    // TableCell's mobile label is concatenated into the cell's text content
    // (e.g. "On hand30"), so `exact: true` never matches — a plain substring
    // match, scoped with `.first()` to avoid a strict-mode violation across
    // the two matching cells, is what actually resolves.
    await expect(secondRow.getByText('30').first()).toBeVisible()

    // Promote the second Variant to default — the first Variant's badge
    // should move.
    await secondRow.getByRole('button', { name: 'Set default' }).click()
    await expect(page.getByText('Default variant updated').first()).toBeVisible()
    await expect(secondRow.getByText('Default').last()).toBeVisible()
    await expect(firstRow.getByRole('button', { name: 'Set default' })).toBeVisible()

    // A Product must always keep at least one default Variant — archiving
    // the current default is rejected, not silently allowed.
    await secondRow.getByRole('button', { name: 'Archive' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()
    await expect(
      page
        .getByText('Cannot archive the default variant — set another variant as default first')
        .first(),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Archiving the now-non-default first Variant succeeds.
    await firstRow.getByRole('button', { name: 'Archive' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()
    await expect(page.getByText('Variant archived').first()).toBeVisible()
    await expect(firstRow).not.toBeVisible()

    // Clean up the fixture this test created (archive ≠ delete, per
    // docs/domain-model.md — same convention as catalog.spec.ts).
    await page.getByRole('tab', { name: 'Details' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Product deleted').first()).toBeVisible()
  })
})
