import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only user (docs/keycloak-setup.md § Users), same real Keycloak
// realm login as catalog.spec.ts/variants.spec.ts. One test per file, one
// sign-in, following those specs' established fix for this realm's
// bruteForceProtected: true setting (docs/testing.md § End-to-End Testing;
// see also variants.spec.ts's identical comment on why a second test() here
// would reintroduce that flakiness).
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'

// Fixed dev-seed id (database/prisma/seed.ts § seedSampleCustomer) — a
// Partner placing an order on a Customer's behalf must supply one
// explicitly (docs/authorization.md § Orders), and no customer-search query
// exists yet to look this up from the UI.
const SAMPLE_CUSTOMER_ID = '00000000-0000-4000-8000-000000000020'

test.describe('Orders', () => {
  test('a Partner places an order on behalf of a Customer, confirms it, starts processing, then cancels it', async ({
    page,
  }) => {
    const timestamp = Date.now()
    const sku = `PW-E2E-ORDER-SKU-${timestamp}`
    const title = `Playwright E2E Order Product ${timestamp}`

    // Fixture: a PUBLISHED product with a known SKU/price so this test can
    // predict the Create Order form's variant option label exactly.
    await page.goto('/catalog/new')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)
    await expect(page).toHaveURL(/\/catalog\/new$/)

    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Category').selectOption({ label: 'Electronics' })
    await page.getByLabel('SKU').fill(sku)
    await page.getByLabel('Price').fill('19.99')
    await page.getByRole('button', { name: 'Create product' }).click()
    await expect(page.getByText('Product created').first()).toBeVisible()

    // createOrder only accepts PUBLISHED variants (getOrderableVariants
    // filters on it) — a fresh Product starts DRAFT, so publish it first.
    await page.getByRole('link', { name: 'Edit' }).click()
    await page.getByLabel('Status').selectOption({ label: 'Published' })
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Product updated').first()).toBeVisible()

    // A fresh Variant starts with 0 on hand — confirming an order would
    // otherwise correctly fail "insufficient available stock"
    // (docs/domain-model.md § Inventory), so stock it up first.
    await page.getByRole('tab', { name: 'Variants' }).click()
    await page.getByRole('button', { name: 'Adjust stock' }).click()
    await expect(page.getByRole('heading', { name: 'Adjust inventory' })).toBeVisible()
    await page.getByLabel('Quantity').fill('100')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Inventory updated').first()).toBeVisible()

    // Create the Order, on behalf of the seeded sample Customer.
    await page.goto('/orders/new')
    await page.getByLabel('Search products').fill(sku)
    const productSelect = page.getByLabel('Item 1 product')
    await expect(productSelect.locator('option', { hasText: sku })).toHaveCount(1)
    await productSelect.selectOption({ label: `${title} — ${sku} ($19.99)` })
    await page.getByLabel('Item 1 quantity').fill('2')
    await page.getByLabel('Customer ID').fill(SAMPLE_CUSTOMER_ID)
    await page.getByRole('button', { name: 'Create Order' }).click()

    await expect(page.getByText('Order created').first()).toBeVisible()
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/)
    await expect(page.getByText('Draft').first()).toBeVisible()
    const orderNumber = (await page.getByRole('heading', { level: 1 }).textContent())?.replace(
      'Order #',
      '',
    )
    if (orderNumber === undefined) throw new Error('Could not read the created order number')

    // The order list (/orders) renders with the new order present — SM-173.
    await page.goto('/orders')
    const orderRow = page.getByRole('row', { name: new RegExp(orderNumber) })
    await expect(orderRow).toBeVisible()
    await expect(orderRow.getByText('Draft')).toBeVisible()
    await orderRow.getByRole('link', { name: orderNumber }).click()
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/)

    // Confirm (DRAFT -> CONFIRMED): reserves inventory.
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.getByText('Order status updated').first()).toBeVisible()
    await expect(page.getByText('Confirmed').first()).toBeVisible()

    // Start Processing (CONFIRMED -> PROCESSING): Partner/Admin only.
    await page.getByRole('button', { name: 'Start Processing' }).click()
    await expect(page.getByText('Order status updated').first()).toBeVisible()
    await expect(page.getByText('Processing').first()).toBeVisible()

    // Cancel from PROCESSING (Partner/Admin only) — releases inventory,
    // requires the confirmation dialog per docs/ui-guidelines.md's
    // dangerous-action rule.
    await page.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel order' }).click()
    await expect(page.getByText('Order cancelled').first()).toBeVisible()
    await expect(page.getByText('Cancelled').first()).toBeVisible()

    // Timeline shows the full history, oldest first.
    await page.getByRole('tab', { name: 'Timeline' }).click()
    const timelineItems = page.getByRole('tabpanel', { name: 'Timeline' }).getByRole('listitem')
    await expect(timelineItems).toHaveCount(4)
    await expect(timelineItems.nth(0)).toContainText('Draft')
    await expect(timelineItems.nth(3)).toContainText('Cancelled')

    // Clean up the fixture Product this test created (archive != delete,
    // per docs/domain-model.md — same convention as catalog.spec.ts). The
    // Order itself is never deleted (ledger semantics, docs/domain-model.md
    // § Order) — it stays, same as any real cancelled order would.
    await page.goto('/catalog')
    await page.getByLabel('Search', { exact: true }).fill(sku)
    await page.getByRole('link', { name: title }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Product deleted').first()).toBeVisible()
  })
})
