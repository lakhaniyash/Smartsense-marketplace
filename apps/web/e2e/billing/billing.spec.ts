import { test, expect, type APIRequestContext } from '@playwright/test'
import { KeycloakLoginPage } from '../auth/login.page'

// Seeded dev-only users (docs/keycloak-setup.md § Users) — the same real
// Keycloak realm logins every other e2e spec uses, not mocks. This file
// follows the repo's "one login per account, one continuous test per role"
// convention (docs/testing.md § End-to-End Testing): each test() below signs
// in exactly once, as a single seeded user, so this realm's
// bruteForceProtected: true setting never sees a concurrent same-user login.
//
// Why two tests, split Partner-then-Admin (and why describe.serial):
//   * Recording a payment / voiding needs `billing:manage`, which only Admin
//     holds (docs/authorization.md § Billing — Partner is billing:read only).
//   * But an Invoice only ever comes into existence when an Order reaches
//     COMPLETED (docs/domain-model.md § Billing Flow, via BillingEventsListener),
//     and creating the Product the Order needs requires a Partner-scoped user
//     (catalog.service.ts createProduct rejects a null partnerId) — an Admin
//     cannot bootstrap the fixture.
//   So test 1 (Partner) builds the fixture and proves the read-only surface a
//   Partner sees; test 2 (Admin) proves the money-movement surface only Admin
//   can reach, against that same invoice. describe.serial makes the second
//   depend on the first deterministically, in one worker.
const PARTNER_EMAIL = 'yash.lakhani+partner@smartsensesolutions.com'
const PARTNER_PASSWORD = 'Partner@12345'
const ADMIN_EMAIL = 'yash.lakhani+admin@smartsensesolutions.com'
const ADMIN_PASSWORD = 'Admin@12345'

// Fixed dev-seed id (database/prisma/seed.ts § seedSampleCustomer) — a
// Partner placing an order on a Customer's behalf must supply one explicitly
// (docs/authorization.md § Orders); same value orders.spec.ts uses.
const SAMPLE_CUSTOMER_ID = '00000000-0000-4000-8000-000000000020'

// Handed from test 1 (Partner, builds the fixture) to test 2 (Admin, pays it),
// via the describe.serial closure — see the header comment for why the split.
let invoiceId: string | undefined
let invoiceNumber: string | undefined
let invoiceAmountDue: string | undefined

interface InvoiceNode {
  id: string
  invoiceNumber: string
  amountDue: string
  orderId: string
}

// The Orders UI only exposes DRAFT→CONFIRMED→PROCESSING (+ Cancel) —
// PROCESSING→SHIPPED→DELIVERED→COMPLETED exist in the API's transition matrix
// (orders.service.ts ORDER_TRANSITIONS, a Partner holds orders:write for all
// three) but have no button (docs/milestones.md M13: "4 of 10 OrderStatus
// values" surfaced in the UI). COMPLETED is what fires invoice generation, so
// this drives those last three transitions straight against the GraphQL API,
// reusing the *real* Bearer token the browser session already obtained —
// Keycloak's clients have directAccessGrantsEnabled: false, so a password-grant
// token can't be minted here; capturing the live one is the honest substitute.
async function advanceOrderStatusViaApi(
  request: APIRequestContext,
  graphqlUrl: string,
  authHeader: string,
  orderId: string,
  status: 'SHIPPED' | 'DELIVERED' | 'COMPLETED',
): Promise<void> {
  const response = await request.post(graphqlUrl, {
    headers: { authorization: authHeader, 'content-type': 'application/json' },
    data: {
      query:
        'mutation($id: ID!, $status: OrderStatus!) {' +
        ' updateOrderStatus(id: $id, status: $status) { id status } }',
      variables: { id: orderId, status },
    },
  })
  expect(response.ok(), `updateOrderStatus → ${status} HTTP ok`).toBeTruthy()
  const body = (await response.json()) as {
    errors?: unknown
    data?: { updateOrderStatus: { status: string } }
  }
  expect(body.errors, `updateOrderStatus → ${status} returned no GraphQL errors`).toBeUndefined()
  expect(body.data?.updateOrderStatus.status).toBe(status)
}

test.describe.serial('Billing (Invoices)', () => {
  test('a completed order generates an invoice its owning Partner can read and download but not manage', async ({
    page,
    request,
  }) => {
    // Fixture build drives many full-page navigations against 5 Docker
    // containers sharing a CI runner — same budget rationale as
    // orders.spec.ts / reports.spec.ts.
    test.setTimeout(120000)

    const timestamp = Date.now()
    const sku = `PW-E2E-INVOICE-SKU-${timestamp}`
    const title = `Playwright E2E Invoice Product ${timestamp}`

    // Capture the live Authorization header + GraphQL endpoint off the app's
    // own authenticated traffic, so the API-only transitions below use the
    // exact token this browser session is already sending.
    let authHeader: string | undefined
    let graphqlUrl = 'http://localhost:3000/graphql'
    page.on('request', (req) => {
      if (req.method() !== 'POST' || !req.url().endsWith('/graphql')) return
      const header = req.headers()['authorization']
      if (header !== undefined && header.length > 0) {
        authHeader = header
        graphqlUrl = req.url()
      }
    })

    // Fixture: a PUBLISHED, stocked product (Partner-owned) — mirrors
    // orders.spec.ts, the proven pattern for reaching an orderable variant.
    await page.goto('/catalog/new')
    await new KeycloakLoginPage(page).loginAs(PARTNER_EMAIL, PARTNER_PASSWORD)
    await expect(page).toHaveURL(/\/catalog\/new$/)

    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Category').selectOption({ label: 'Electronics' })
    await page.getByLabel('SKU').fill(sku)
    await page.getByLabel('Price').fill('50.00')
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

    // Create the Order for 2 units. Select the variant by its option *value*
    // (the variant id) rather than a reconstructed price label, so this never
    // depends on how the Decimal price serializes.
    await page.goto('/orders/new')
    await page.getByLabel('Search products').fill(sku)
    const productSelect = page.getByLabel('Item 1 product')
    const option = productSelect.locator('option', { hasText: sku })
    await expect(option).toHaveCount(1)
    const optionValue = await option.getAttribute('value')
    expect(optionValue).not.toBeNull()
    await productSelect.selectOption(optionValue as string)
    await page.getByLabel('Item 1 quantity').fill('2')
    await page.getByLabel('Customer ID').fill(SAMPLE_CUSTOMER_ID)
    await page.getByRole('button', { name: 'Create Order' }).click()

    await expect(page.getByText('Order created').first()).toBeVisible()
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/)
    const orderId = page.url().split('/').pop()
    if (orderId === undefined || orderId === '')
      throw new Error('Could not read the created order id')

    // Confirm (reserves stock) and Start Processing — the transitions the UI
    // does expose.
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.getByText('Order status updated').first()).toBeVisible()
    await expect(page.getByText('Confirmed').first()).toBeVisible()
    await page.getByRole('button', { name: 'Start Processing' }).click()
    await expect(page.getByText('Order status updated').first()).toBeVisible()
    await expect(page.getByText('Processing').first()).toBeVisible()

    // Drive PROCESSING→SHIPPED→DELIVERED→COMPLETED via the API (no UI path).
    expect(authHeader, 'captured a Bearer token from the browser session').toBeDefined()
    await advanceOrderStatusViaApi(request, graphqlUrl, authHeader as string, orderId, 'SHIPPED')
    await advanceOrderStatusViaApi(request, graphqlUrl, authHeader as string, orderId, 'DELIVERED')
    await advanceOrderStatusViaApi(request, graphqlUrl, authHeader as string, orderId, 'COMPLETED')

    // Invoice generation is an async event handler that runs *after* the
    // COMPLETED transaction commits (billing.service.ts generateInvoiceForOrder,
    // emitted post-commit) — poll the invoices list for the one carrying our
    // orderId rather than sleeping a fixed interval.
    await expect
      .poll(
        async () => {
          const response = await request.post(graphqlUrl, {
            headers: { authorization: authHeader as string, 'content-type': 'application/json' },
            data: {
              query:
                'query { invoices(first: 50) { edges { node {' +
                ' id invoiceNumber amountDue orderId } } } }',
            },
          })
          if (!response.ok()) return false
          const body = (await response.json()) as {
            data?: { invoices: { edges: { node: InvoiceNode }[] } }
          }
          const match = body.data?.invoices.edges
            .map((edge) => edge.node)
            .find((node) => node.orderId === orderId)
          if (match === undefined) return false
          invoiceId = match.id
          invoiceNumber = match.invoiceNumber
          invoiceAmountDue = match.amountDue
          return true
        },
        { timeout: 15000 },
      )
      .toBe(true)

    // The invoice list renders with our real, freshly generated invoice.
    await page.goto('/billing')
    await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible()
    const invoiceLink = page.getByRole('link', { name: invoiceNumber as string })
    await expect(invoiceLink).toBeVisible()

    // Detail page: a freshly generated invoice is ISSUED, unpaid.
    await invoiceLink.click()
    await expect(page).toHaveURL(/\/billing\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: `Invoice #${invoiceNumber}` })).toBeVisible()
    await expect(page.getByText('Issued', { exact: true }).first()).toBeVisible()

    // Download PDF is available to any billing:read user and fires a real
    // download (same assertion shape reports.spec.ts uses for its CSV exports).
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download PDF' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(`${invoiceNumber}.pdf`)

    // Cross-visibility, Partner side: a Partner is billing:read only, so the
    // money-movement controls must not exist for them (docs/authorization.md
    // § Billing). Test 2 asserts the Admin complement.
    await expect(page.getByRole('button', { name: 'Record Payment' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Void Invoice' })).toHaveCount(0)

    // Clean up the fixture Product (archive, per docs/domain-model.md — same
    // as orders.spec.ts). The Order and Invoice are ledger records and stay.
    await page.goto('/catalog')
    await page.getByLabel('Search', { exact: true }).fill(sku)
    await page.getByRole('link', { name: title }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Product deleted').first()).toBeVisible()
  })

  test('an Admin records payments through PARTIALLY_PAID to PAID, and can export', async ({
    page,
  }) => {
    test.setTimeout(120000)

    // test 1 must have produced the invoice (describe.serial guarantees order).
    expect(invoiceId, 'invoice fixture from test 1').toBeDefined()
    expect(invoiceAmountDue, 'invoice amount from test 1').toBeDefined()

    // Split the amount into a first partial payment and the exact remainder,
    // regardless of how the Decimal serializes — the first drives
    // PARTIALLY_PAID, the second closes it to PAID.
    const amount = Number(invoiceAmountDue)
    const partial = (amount / 2).toFixed(2)
    const remaining = (amount - Number(partial)).toFixed(2)

    // Deep-link into the list → Keycloak redirects → Admin signs in → lands
    // back on /billing (same post-login deep-link behavior orders.spec.ts uses).
    await page.goto('/billing')
    await new KeycloakLoginPage(page).loginAs(ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page).toHaveURL(/\/billing$/)
    await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible()

    // The list renders with at least our invoice (Admin sees all partners').
    const invoiceLink = page.getByRole('link', { name: invoiceNumber as string })
    await expect(invoiceLink).toBeVisible()

    // Export CSV from the list fires a real download.
    const csvDownloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export CSV' }).click()
    const csvDownload = await csvDownloadPromise
    expect(csvDownload.suggestedFilename()).toBe('invoices.csv')

    await invoiceLink.click()
    await expect(page).toHaveURL(/\/billing\/[0-9a-f-]+$/)

    // Cross-visibility, Admin side: Admin holds billing:manage, so the
    // money-movement controls that were absent for the Partner are present.
    await expect(page.getByRole('button', { name: 'Record Payment' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Void Invoice' })).toBeVisible()

    // Record the partial payment → PARTIALLY_PAID.
    await page.getByRole('button', { name: 'Record Payment' }).click()
    await expect(page.getByRole('heading', { name: 'Record payment' })).toBeVisible()
    await page.getByLabel(/Amount/).fill(partial)
    await page.getByLabel(/External transaction ID/).fill(`PW-E2E-PAY-1-${Date.now()}`)
    await page.getByRole('button', { name: 'Record payment' }).click()
    await expect(page.getByText('Payment recorded').first()).toBeVisible()
    await expect(page.getByText('Partially paid').first()).toBeVisible()

    // Record the remainder → PAID.
    await page.getByRole('button', { name: 'Record Payment' }).click()
    await expect(page.getByRole('heading', { name: 'Record payment' })).toBeVisible()
    await page.getByLabel(/Amount/).fill(remaining)
    await page.getByLabel(/External transaction ID/).fill(`PW-E2E-PAY-2-${Date.now()}`)
    await page.getByRole('button', { name: 'Record payment' }).click()
    await expect(page.getByText('Payment recorded').first()).toBeVisible()
    await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible()

    // A PAID invoice can no longer be voided (docs/domain-model.md § Invoice
    // Lifecycle — VOID is only reachable from DRAFT/ISSUED).
    await expect(page.getByRole('button', { name: 'Void Invoice' })).toHaveCount(0)

    // PDF download works for the Admin too.
    const pdfDownloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download PDF' }).click()
    const pdfDownload = await pdfDownloadPromise
    expect(pdfDownload.suggestedFilename()).toBe(`${invoiceNumber}.pdf`)
  })
})
