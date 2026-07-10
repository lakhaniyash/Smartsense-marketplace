import { test, expect } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only user (docs/keycloak-setup.md § Users), same real Keycloak
// realm login as catalog.spec.ts/orders.spec.ts. One test per file, one
// sign-in, following those specs' established fix for this realm's
// bruteForceProtected: true setting (docs/testing.md § End-to-End Testing).
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'

const SAMPLE_CUSTOMER_ID = '00000000-0000-4000-8000-000000000020'

// Smoke-level round-trip for M16 Notifications Foundation: a real domain
// event (order.confirmed) fires from a real UI action, fans out through the
// backend's event bus into a real Notification row, and surfaces in both
// the header dropdown and the full /notifications page — the one thing a
// component-level Vitest test can't prove. Not in scope here (per
// docs/milestones.md M16 and this project's "generate only the requested
// scope" convention): mark-all-as-read, filter-tab, and pagination coverage
// — Billing itself has no e2e suite yet despite being a larger, completed
// milestone; one smoke journey is the right size for a foundation milestone.
test.describe('Notifications', () => {
  test('confirming an order surfaces a notification in the header dropdown and the full page', async ({
    page,
  }) => {
    const timestamp = Date.now()
    const sku = `PW-E2E-NOTIF-SKU-${timestamp}`
    const title = `Playwright E2E Notification Product ${timestamp}`

    // Fixture: a PUBLISHED, in-stock product so a real Order can be placed
    // and confirmed (same steps as orders.spec.ts's established fixture).
    await page.goto('/catalog/new')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)
    await expect(page).toHaveURL(/\/catalog\/new$/)

    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Category').selectOption({ label: 'Electronics' })
    await page.getByLabel('SKU').fill(sku)
    await page.getByLabel('Price').fill('19.99')
    await page.getByRole('button', { name: 'Create product' }).click()
    await expect(page.getByText('Product created').first()).toBeVisible()

    await page.getByRole('link', { name: 'Edit' }).click()
    await page.getByLabel('Status').selectOption({ label: 'Published' })
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Product updated').first()).toBeVisible()

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
    await page.getByLabel('Item 1 quantity').fill('1')
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
    // NotificationRow links by entityId (the Order's uuid, not its display
    // orderNumber) — capture it from the URL so the dropdown/page assertions
    // below can match the exact notification this test's action produced,
    // not just any similarly-titled row (title/timestamp alone are
    // ambiguous against leftover notifications from earlier runs sharing
    // this dev database).
    const orderId = new URL(page.url()).pathname.split('/').pop()
    if (orderId === undefined) throw new Error('Could not read the created order id')
    const orderHref = `/orders/${orderId}`

    // Confirm (DRAFT -> CONFIRMED): emits order.confirmed, which the
    // Notifications listener fans out to every ACTIVE user of the owning
    // Partner org — including this same Partner user, since they're staff
    // of the org that placed/confirmed the order.
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.getByText('Order status updated').first()).toBeVisible()
    await expect(page.getByText('Confirmed').first()).toBeVisible()

    // Navigate away and back so the header (and its notification queries)
    // remounts fresh, rather than waiting on the 45s poll interval.
    await page.goto('/dashboard')

    const bell = page.getByRole('button', { name: /Notifications/ })
    await expect(bell).toBeVisible()
    await bell.click()

    // Scoped to "confirmed" specifically — order.created also links to this
    // same Order (same href), so a bare href match would ambiguously catch
    // both notifications this test's own actions just produced.
    const dropdownLink = page.locator(`a[href="${orderHref}"]`).filter({ hasText: 'confirmed' })
    await expect(dropdownLink).toBeVisible()
    await expect(dropdownLink.getByLabel('Unread')).toBeVisible()

    // Clicking it marks it read and navigates to the Order it references.
    await dropdownLink.click()
    await expect(page).toHaveURL(new RegExp(`${orderHref}$`))

    // The full /notifications page reflects the same, now-read state.
    await page.goto('/notifications')
    const pageRow = page
      .locator('li')
      .filter({ has: page.locator(`a[href="${orderHref}"]`) })
      .filter({ hasText: 'confirmed' })
    await expect(pageRow).toBeVisible()
    await expect(pageRow.getByLabel('Unread')).toHaveCount(0)

    // Clean up the fixture Product this test created (archive != delete,
    // per docs/domain-model.md — same convention as orders.spec.ts).
    await page.goto('/catalog')
    // exact: true — the header's global search input shares the substring
    // "Search" in its own accessible name ("Search everything (Ctrl+K)"),
    // which otherwise makes a plain getByLabel('Search') ambiguous once the
    // header is fully mounted (unlike a fresh post-login redirect).
    await page.getByLabel('Search', { exact: true }).fill(sku)
    await page.getByRole('link', { name: title }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Product deleted').first()).toBeVisible()
  })
})
