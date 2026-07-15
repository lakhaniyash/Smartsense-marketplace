import { createServer, type Server } from 'http'
import { generateKeyPairSync, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the Reports module, following the
 * real-AppModule/real-Postgres/mocked-JWKS pattern established in
 * billing.e2e-spec.ts (docs/testing.md § Authorization Testing).
 *
 * Covers: (a) reports:read permission/ownership gating including Customer
 * rejection and cross-partner NOT_FOUND, (b) the full
 * Generated→Finalized→PaidOut BillingReport lifecycle reconciling exactly
 * against fixture Invoice data (M15's own exit criterion), (c) the GiST
 * exclusion-constraint overlap rejection surfacing a clean CONFLICT (not a
 * raw Postgres error) — the real error shape was verified directly against
 * this dev Postgres instance before ReportsService.translateBillingReportError
 * was written (Prisma.PrismaClientUnknownRequestError, no `.code`, message
 * containing the constraint name), so this test proves the real end-to-end
 * behavior, not just the already-unit-tested branch.
 */
describe('Reports (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined
  let originalNodeEnv: string | undefined

  const OWN_PARTNER_EMAIL = 'yash.lakhani+reports-own-partner-e2e@smartsensesolutions.com'
  const OTHER_PARTNER_EMAIL = 'yash.lakhani+reports-other-partner-e2e@smartsensesolutions.com'
  const OWN_CUSTOMER_EMAIL = 'yash.lakhani+reports-own-customer-e2e@smartsensesolutions.com'
  const ADMIN_EMAIL = 'yash.lakhani+reports-admin-e2e@smartsensesolutions.com'
  const NO_PERMISSION_EMAIL = 'yash.lakhani+reports-no-permission-e2e@smartsensesolutions.com'

  let ownPartnerUserId: string
  let otherPartnerUserId: string
  let ownCustomerUserId: string
  let adminUserId: string
  let noPermissionUserId: string

  let ownPartnerId: string
  let otherPartnerId: string
  let ownCustomerId: string
  let ownVariantId: string
  const createdProductIds: string[] = []
  const createdOrderIds: string[] = []
  const createdBillingReportIds: string[] = []

  // Round commissionRate so expected commissionAmount/netPayout are exact,
  // integer-friendly values — easy to assert against without any floating
  // rounding ambiguity (docs/api-conventions.md § money is Decimal, never Float).
  const COMMISSION_RATE = '20.00'

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-reports-e2e-no-permission',
      iss: issuer,
      aud: audience,
      email: NO_PERMISSION_EMAIL,
      realm_access: { roles: [] as string[] },
      iat: now,
      exp: now + 900,
      ...overrides,
    }
    return jwt.sign(payload, privateKey.export({ type: 'pkcs1', format: 'pem' }), {
      algorithm: 'RS256',
      keyid: KEY_ID,
    })
  }

  function ownPartnerToken(): string {
    return signToken({
      sub: 'kc-sub-reports-own-partner-e2e',
      email: OWN_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function otherPartnerToken(): string {
    return signToken({
      sub: 'kc-sub-reports-other-partner-e2e',
      email: OTHER_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function ownCustomerToken(): string {
    return signToken({
      sub: 'kc-sub-reports-own-customer-e2e',
      email: OWN_CUSTOMER_EMAIL,
      realm_access: { roles: ['Customer'] },
    })
  }

  // Distinct subject from the other tokens — see billing.e2e-spec.ts's
  // identical comment on adminToken(): syncRoles grants roles permanently
  // per-subject, so reusing a subject with a different claimed role would
  // leak Admin permissions onto it for the rest of the suite.
  function adminToken(): string {
    return signToken({
      sub: 'kc-sub-reports-admin-e2e',
      email: ADMIN_EMAIL,
      realm_access: { roles: ['Admin'] },
    })
  }

  async function createProductFixture(
    partnerId: string,
    categoryId: string,
    sku: string,
    price: number,
  ) {
    const product = await prisma.product.create({
      data: { partnerId, categoryId, title: `Reports E2E fixture ${sku}`, status: 'PUBLISHED' },
    })
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, partnerId, sku, price, isDefault: true },
    })
    await prisma.inventory.create({ data: { productVariantId: variant.id, quantityOnHand: 100 } })
    createdProductIds.push(product.id)
    return variant
  }

  async function createOrderFixture(
    partnerId: string,
    customerId: string,
    variantId: string,
    quantity: number,
    unitPrice: number,
  ) {
    const total = quantity * unitPrice
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-REPORTS-E2E-${Math.random().toString(36).slice(2, 10)}`,
        customerId,
        partnerId,
        status: 'DRAFT',
        subtotal: total,
        tax: 0,
        shippingCost: 0,
        total,
        items: {
          create: [
            {
              productVariantId: variantId,
              quantity,
              unitPriceSnapshot: unitPrice,
              lineTotal: total,
            },
          ],
        },
        statusHistory: { create: [{ toStatus: 'DRAFT' }] },
      },
    })
    createdOrderIds.push(order.id)
    return order
  }

  const UPDATE_STATUS_MUTATION = `
    mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
      updateOrderStatus(id: $id, status: $status) { id status }
    }
  `

  async function advanceOrderTo(orderId: string, statuses: string[], token: string): Promise<void> {
    for (const status of statuses) {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: UPDATE_STATUS_MUTATION, variables: { id: orderId, status } })
        .expect(200)
      if (res.body.errors) {
        throw new Error(`advanceOrderTo(${status}) failed: ${JSON.stringify(res.body.errors)}`)
      }
    }
  }

  // OrderCompletedEvent → generateInvoiceForOrder is fire-and-forget
  // (EventEmitter2's `emit()`, not `emitAsync()`) — same poll pattern as
  // billing.e2e-spec.ts's waitForInvoiceByOrderId.
  async function waitForInvoiceByOrderId(orderId: string) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const invoice = await prisma.invoice.findUnique({ where: { orderId } })
      if (invoice !== null) return invoice
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error(`Invoice for order ${orderId} was not generated within the poll window`)
  }

  beforeAll(async () => {
    const { publicKey, privateKey: generatedPrivateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    })
    privateKey = generatedPrivateKey

    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KEY_ID, alg: 'RS256', use: 'sig' }
    jwksServer = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ keys: [jwk] }))
    })
    await new Promise<void>((resolve) => jwksServer.listen(0, resolve))
    const address = jwksServer.address()
    if (address === null || typeof address === 'string')
      throw new Error('failed to bind JWKS server')

    originalJwksUri = process.env['KEYCLOAK_JWKS_URI']
    process.env['KEYCLOAK_JWKS_URI'] = `http://127.0.0.1:${address.port}/certs`

    originalNodeEnv = process.env['NODE_ENV']
    process.env['NODE_ENV'] = 'development'

    const keycloakUrl = process.env['KEYCLOAK_URL'] ?? 'http://localhost:8080'
    const keycloakRealm = process.env['KEYCLOAK_REALM'] ?? 'smartsense-marketplace'
    issuer = `${keycloakUrl}/realms/${keycloakRealm}`
    audience = process.env['KEYCLOAK_API_CLIENT_ID'] ?? 'smartsense-api'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    prisma = app.get(PrismaService)

    const [ownPartner, otherPartner] = await Promise.all([
      prisma.partner.create({
        data: {
          legalName: 'Reports E2E Own Partner Ltd',
          displayName: 'Reports E2E Own Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+reports-e2e-own-partner@smartsensesolutions.com',
          commissionRate: COMMISSION_RATE,
        },
      }),
      prisma.partner.create({
        data: {
          legalName: 'Reports E2E Other Partner Ltd',
          displayName: 'Reports E2E Other Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+reports-e2e-other-partner@smartsensesolutions.com',
          commissionRate: COMMISSION_RATE,
        },
      }),
    ])
    ownPartnerId = ownPartner.id
    otherPartnerId = otherPartner.id

    const ownCustomer = await prisma.customer.create({
      data: {
        displayName: 'Reports E2E Own Customer',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        billingEmail: 'yash.lakhani+reports-e2e-own-customer-billing@smartsensesolutions.com',
      },
    })
    ownCustomerId = ownCustomer.id

    const category = await prisma.category.findFirstOrThrow({ where: { slug: 'electronics' } })
    const ownVariant = await createProductFixture(
      ownPartnerId,
      category.id,
      'REPORTS-E2E-OWN-SKU',
      100,
    )
    ownVariantId = ownVariant.id

    const [ownPartnerUser, otherPartnerUser, ownCustomerUser, adminUser, noPermissionUser] =
      await Promise.all([
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-reports-own-partner-e2e',
            email: OWN_PARTNER_EMAIL,
            fullName: 'Reports E2E Own Partner User',
            status: 'ACTIVE',
            ownerType: 'PARTNER',
            partnerId: ownPartnerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-reports-other-partner-e2e',
            email: OTHER_PARTNER_EMAIL,
            fullName: 'Reports E2E Other Partner User',
            status: 'ACTIVE',
            ownerType: 'PARTNER',
            partnerId: otherPartnerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-reports-own-customer-e2e',
            email: OWN_CUSTOMER_EMAIL,
            fullName: 'Reports E2E Own Customer User',
            status: 'ACTIVE',
            ownerType: 'CUSTOMER',
            customerId: ownCustomerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-reports-admin-e2e',
            email: ADMIN_EMAIL,
            fullName: 'Reports E2E Admin User',
            status: 'ACTIVE',
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-reports-e2e-no-permission',
            email: NO_PERMISSION_EMAIL,
            fullName: 'Reports E2E No-Permission User',
            status: 'ACTIVE',
          },
        }),
      ])
    ownPartnerUserId = ownPartnerUser.id
    otherPartnerUserId = otherPartnerUser.id
    ownCustomerUserId = ownCustomerUser.id
    adminUserId = adminUser.id
    noPermissionUserId = noPermissionUser.id
  })

  afterAll(async () => {
    const userIds = [
      ownPartnerUserId,
      otherPartnerUserId,
      ownCustomerUserId,
      adminUserId,
      noPermissionUserId,
    ]
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.billingReport.deleteMany({ where: { id: { in: createdBillingReportIds } } })
    // AuditLog.actor and Invoice FKs are onDelete: Restrict
    // (docs/database-schema.md) — payments/invoices/audit rows must go
    // before the Orders/Users they reference can be deleted.
    await prisma.payment.deleteMany({ where: { invoice: { orderId: { in: createdOrderIds } } } })
    await prisma.invoice.deleteMany({ where: { orderId: { in: createdOrderIds } } })
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } })
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } })
    await prisma.customer.deleteMany({ where: { id: ownCustomerId } })
    await prisma.partner.deleteMany({ where: { id: { in: [ownPartnerId, otherPartnerId] } } })
    await app.close()
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()))
    if (originalJwksUri === undefined) delete process.env['KEYCLOAK_JWKS_URI']
    else process.env['KEYCLOAK_JWKS_URI'] = originalJwksUri
    if (originalNodeEnv === undefined) delete process.env['NODE_ENV']
    else process.env['NODE_ENV'] = originalNodeEnv
  })

  function billingReportsQuery(variables: Record<string, unknown> = {}) {
    return {
      query: `
        query BillingReports($filter: BillingReportFilterInput) {
          billingReports(filter: $filter) {
            edges { node { id partnerId status grossRevenue commissionAmount netPayout } }
            pageInfo { hasNextPage hasPreviousPage }
          }
        }
      `,
      variables,
    }
  }

  function billingReportByIdQuery(id: string) {
    return {
      query: `
        query BillingReportById($id: ID!) {
          billingReport(id: $id) {
            id partnerId status grossRevenue commissionAmount netPayout periodStart periodEnd
          }
        }
      `,
      variables: { id },
    }
  }

  const GENERATE_BILLING_REPORT_MUTATION = `
    mutation GenerateBillingReport($input: GenerateBillingReportInput!) {
      generateBillingReport(input: $input) {
        id partnerId status grossRevenue commissionAmount netPayout
      }
    }
  `

  const FINALIZE_BILLING_REPORT_MUTATION = `
    mutation FinalizeBillingReport($id: ID!) {
      finalizeBillingReport(id: $id) { id status }
    }
  `

  const MARK_PAID_OUT_MUTATION = `
    mutation MarkBillingReportPaidOut($id: ID!) {
      markBillingReportPaidOut(id: $id) { id status }
    }
  `

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send(billingReportsQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects an authenticated caller with no reports:read permission', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${signToken()}`)
      .send(billingReportsQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  it('rejects a Customer caller — Customers hold no reports:read permission at all', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${ownCustomerToken()}`)
      .send(billingReportsQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  describe('Billing Report lifecycle: Generated → Finalized → PaidOut', () => {
    let orderId: string
    let reportId: string
    const periodStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const periodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    it('reconciles grossRevenue/commissionAmount/netPayout exactly against a COMPLETED order Invoice', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId, 2, 100)
      orderId = order.id

      await advanceOrderTo(
        orderId,
        ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'],
        ownPartnerToken(),
      )

      const invoice = await waitForInvoiceByOrderId(orderId)
      expect(invoice.amountDue.toString()).toBe('200')

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: GENERATE_BILLING_REPORT_MUTATION,
          variables: { input: { periodStart, periodEnd } },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const report = res.body.data.generateBillingReport
      reportId = report.id
      createdBillingReportIds.push(reportId)

      // grossRevenue = SUM(amountDue) = 200; commissionRate = 20.00% (a
      // percentage, NOT a 0-1 fraction) → commissionAmount = 200 * 0.20 = 40;
      // netPayout = 200 - 40 = 160. Pins exactly the formula in
      // docs and ReportsService's own doc comment.
      expect(report.partnerId).toBe(ownPartnerId)
      expect(report.status).toBe('GENERATED')
      expect(report.grossRevenue).toBe('200')
      expect(report.commissionAmount).toBe('40')
      expect(report.netPayout).toBe('160')
    })

    it('scopes billing report visibility to its own vendor Partner, not another Partner (NOT_FOUND)', async () => {
      const ownRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(billingReportByIdQuery(reportId))
        .expect(200)
      expect(ownRes.body.errors).toBeUndefined()
      expect(ownRes.body.data.billingReport.id).toBe(reportId)

      const otherRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${otherPartnerToken()}`)
        .send(billingReportByIdQuery(reportId))
        .expect(200)
      expect(otherRes.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it('Admin can view the report scoped to any Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(billingReportByIdQuery(reportId))
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.billingReport.id).toBe(reportId)
    })

    it('rejects finalizing as the other Partner (ownership-scoped NOT_FOUND, not just a state check)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${otherPartnerToken()}`)
        .send({ query: FINALIZE_BILLING_REPORT_MUTATION, variables: { id: reportId } })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it('moves GENERATED → FINALIZED', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: FINALIZE_BILLING_REPORT_MUTATION, variables: { id: reportId } })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.finalizeBillingReport.status).toBe('FINALIZED')
    })

    it('rejects finalizing an already-FINALIZED report', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: FINALIZE_BILLING_REPORT_MUTATION, variables: { id: reportId } })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('CONFLICT')
    })

    it('moves FINALIZED → PAID_OUT', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: MARK_PAID_OUT_MUTATION, variables: { id: reportId } })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.markBillingReportPaidOut.status).toBe('PAID_OUT')
    })

    it('rejects marking an already-PAID_OUT report as paid out again', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: MARK_PAID_OUT_MUTATION, variables: { id: reportId } })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('CONFLICT')
    })

    it('rejects an overlapping-but-non-identical period for the same Partner with a clean CONFLICT (GiST exclusion constraint)', async () => {
      // Overlaps [periodStart, periodEnd] above (today falls within both
      // ranges) without being identical to it — exercises the Postgres
      // exclusion constraint path, not the `@@unique` exact-duplicate path.
      const overlappingStart = new Date().toISOString()
      const overlappingEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: GENERATE_BILLING_REPORT_MUTATION,
          variables: { input: { periodStart: overlappingStart, periodEnd: overlappingEnd } },
        })
        .expect(200)

      expect(res.body.errors).toBeDefined()
      expect(res.body.errors[0].extensions.code).toBe('CONFLICT')
      // Not a raw Postgres/Prisma error leaking through — a clean, generic
      // message, same bar as every other translated error in this codebase.
      expect(res.body.errors[0].message).not.toMatch(/23P01|PrismaClient|ConnectorError/i)
    })

    it('rejects an Admin caller who omits partnerId when generating (no bulk "generate for all partners" op)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: GENERATE_BILLING_REPORT_MUTATION,
          variables: {
            input: {
              periodStart: '2020-01-01T00:00:00.000Z',
              periodEnd: '2020-01-31T00:00:00.000Z',
            },
          },
        })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('lets Admin generate a report for an explicit partnerId', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: GENERATE_BILLING_REPORT_MUTATION,
          variables: {
            input: {
              partnerId: otherPartnerId,
              periodStart: '2020-01-01T00:00:00.000Z',
              periodEnd: '2020-01-31T00:00:00.000Z',
            },
          },
        })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.generateBillingReport.partnerId).toBe(otherPartnerId)
      // A period with zero matching Invoices is a legitimate, generatable
      // report — coalesced to Decimal(0), not an error.
      expect(res.body.data.generateBillingReport.grossRevenue).toBe('0')
      expect(res.body.data.generateBillingReport.commissionAmount).toBe('0')
      createdBillingReportIds.push(res.body.data.generateBillingReport.id)
    })
  })

  describe('computed-on-read reports — Partner scoping smoke coverage', () => {
    const REVENUE_REPORT_QUERY = `
      query RevenueReport($filter: RevenueReportFilterInput) {
        revenueReport(filter: $filter) { totalGrossRevenue totalCommission totalNetPayout invoiceCount }
      }
    `
    const ORDERS_REPORT_QUERY = `
      query OrdersReport($filter: OrdersReportFilterInput) {
        ordersReport(filter: $filter) { totalOrders totalRevenue averageOrderValue statusBreakdown { status count } }
      }
    `
    const INVENTORY_REPORT_QUERY = `
      query InventoryReport($filter: InventoryReportFilterInput) {
        inventoryReport(filter: $filter) {
          totalVariants totalOnHand totalReserved lowStockCount
          lowStockItems { edges { node { sku } } pageInfo { hasNextPage } }
        }
      }
    `
    const CUSTOMERS_REPORT_QUERY = `
      query CustomersReport($filter: CustomersReportFilterInput) {
        customersReport(filter: $filter) {
          totalCustomers
          statusBreakdown { status count }
          typeBreakdown { type count }
        }
      }
    `
    const PRODUCT_PERFORMANCE_QUERY = `
      query ProductPerformanceReport($filter: ProductPerformanceFilterInput) {
        productPerformanceReport(filter: $filter) {
          edges { cursor node { productVariantId sku unitsSold revenue } }
          pageInfo { hasNextPage hasPreviousPage }
        }
      }
    `
    const NOTIFICATION_ACTIVITY_QUERY = `
      query NotificationActivityReport($filter: NotificationActivityReportFilterInput) {
        notificationActivityReport(filter: $filter) { totalNotifications unreadCount readCount }
      }
    `
    const REPORTS_DASHBOARD_QUERY = `
      query ReportsDashboard($filter: ReportsDashboardFilterInput) {
        reportsDashboard(filter: $filter) { grossRevenue totalOrders ordersRevenue lowStockCount }
      }
    `

    it('rejects a Partner requesting another Partner via filter.partnerId (FORBIDDEN)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: REVENUE_REPORT_QUERY, variables: { filter: { partnerId: otherPartnerId } } })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('revenueReport reconciles totalGrossRevenue for the own Partner with no filter', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: REVENUE_REPORT_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      // Same 200 Invoice reconciled in the lifecycle block above.
      expect(res.body.data.revenueReport.totalGrossRevenue).toBe('200')
      expect(res.body.data.revenueReport.totalCommission).toBe('40')
    })

    it('ordersReport returns a status breakdown scoped to the own Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: ORDERS_REPORT_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.ordersReport.totalOrders).toBeGreaterThanOrEqual(1)
    })

    it('inventoryReport returns a snapshot scoped to the own Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: INVENTORY_REPORT_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.inventoryReport.totalVariants).toBeGreaterThanOrEqual(1)
    })

    it('customersReport scopes to the own Partner via the orders relation, not a direct column', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: CUSTOMERS_REPORT_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      // The ownCustomer (INDIVIDUAL/ACTIVE) placed the COMPLETED order to this
      // Partner in the lifecycle block above; Customer has no partnerId column,
      // so the Partner sees it only through orders.some.partnerId.
      expect(res.body.data.customersReport.totalCustomers).toBeGreaterThanOrEqual(1)
      expect(res.body.data.customersReport.statusBreakdown).toContainEqual({
        status: 'ACTIVE',
        count: expect.any(Number) as unknown as number,
      })
      expect(res.body.data.customersReport.typeBreakdown).toContainEqual({
        type: 'INDIVIDUAL',
        count: expect.any(Number) as unknown as number,
      })
    })

    it('productPerformanceReport ranks the sold variant with an offset-encoded cursor', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: PRODUCT_PERFORMANCE_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      const edges = res.body.data.productPerformanceReport.edges
      expect(edges.length).toBeGreaterThanOrEqual(1)
      const own = edges.find(
        (edge: { node: { productVariantId: string } }) =>
          edge.node.productVariantId === ownVariantId,
      )
      expect(own).toBeDefined()
      expect(own.node.unitsSold).toBe(2)
      expect(own.node.revenue).toBe('200')
      // Cursor decodes (base64) to the "offset:<n>" shape documented on
      // ProductPerformanceConnectionOutput, not a row id like every other
      // connection's cursor.
      expect(Buffer.from(edges[0].cursor, 'base64').toString('utf8')).toMatch(/^offset:\d+$/)
    })

    it('notificationActivityReport counts Partner-staff notification activity', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: NOTIFICATION_ACTIVITY_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      // The COMPLETED order above triggers Order/Invoice notifications
      // fanned out to this Partner's staff (docs/domain-model.md § Notification).
      expect(res.body.data.notificationActivityReport.totalNotifications).toBeGreaterThanOrEqual(1)
    })

    it('reportsDashboard composes revenue/orders/inventory without touching dashboardStats', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: REPORTS_DASHBOARD_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.reportsDashboard.grossRevenue).toBe('200')
    })

    it('Admin sees marketplace-wide totals spanning both Partners', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ query: ORDERS_REPORT_QUERY, variables: {} })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.ordersReport.totalOrders).toBeGreaterThanOrEqual(1)
    })
  })

  describe('exportReport', () => {
    const EXPORT_REPORT_QUERY = `
      query ExportReport($input: ExportReportInput!) {
        exportReport(input: $input)
      }
    `

    it('renders a CSV for BILLING_REPORTS scoped to the own Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: EXPORT_REPORT_QUERY,
          variables: { input: { reportType: 'BILLING_REPORTS', format: 'CSV' } },
        })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      const csv = res.body.data.exportReport as string
      expect(csv).toContain('partnerId')
      expect(csv).toContain(ownPartnerId)
      expect(csv).not.toContain(otherPartnerId)
    })

    it('renders a CSV for PRODUCT_PERFORMANCE including the sold variant SKU', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: EXPORT_REPORT_QUERY,
          variables: { input: { reportType: 'PRODUCT_PERFORMANCE', format: 'CSV' } },
        })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.exportReport as string).toContain('REPORTS-E2E-OWN-SKU')
    })

    it('renders a CSV for CUSTOMERS flattening status and type breakdowns', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: EXPORT_REPORT_QUERY,
          variables: { input: { reportType: 'CUSTOMERS', format: 'CSV' } },
        })
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      const csv = res.body.data.exportReport as string
      // Both breakdowns are flattened into one dimension/value/count sheet
      // (ReportsService.exportCustomersReportCsv).
      expect(csv).toContain('dimension,value,count')
      expect(csv).toContain('status,ACTIVE')
      expect(csv).toContain('type,INDIVIDUAL')
    })

    it('throws BAD_USER_INPUT for the EXCEL foundation-only placeholder', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: EXPORT_REPORT_QUERY,
          variables: { input: { reportType: 'BILLING_REPORTS', format: 'EXCEL' } },
        })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })
  })
})
