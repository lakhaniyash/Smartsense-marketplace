import { createServer, type Server } from 'http'
import { generateKeyPairSync, randomUUID, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the Billing module, following the
 * real-AppModule/real-Postgres/mocked-JWKS pattern established in
 * orders.e2e-spec.ts (docs/testing.md § Authorization Testing).
 *
 * Invoice generation is triggered by OrderCompletedEvent, emitted via
 * EventEmitter2's fire-and-forget `emit()` (not `emitAsync()`) — the same
 * pattern OrdersService already uses for its other M13 events. The
 * `waitForInvoice` helper below polls briefly rather than asserting
 * immediately after the triggering mutation responds, since the listener's
 * async work is not guaranteed to have completed by then.
 */
describe('Billing (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined
  let originalNodeEnv: string | undefined

  const OWN_PARTNER_EMAIL = 'yash.lakhani+billing-own-partner-e2e@smartsensesolutions.com'
  const OTHER_PARTNER_EMAIL = 'yash.lakhani+billing-other-partner-e2e@smartsensesolutions.com'
  const OWN_CUSTOMER_EMAIL = 'yash.lakhani+billing-own-customer-e2e@smartsensesolutions.com'
  const ADMIN_EMAIL = 'yash.lakhani+billing-admin-e2e@smartsensesolutions.com'
  const NO_PERMISSION_EMAIL = 'yash.lakhani+billing-no-permission-e2e@smartsensesolutions.com'

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

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-billing-e2e-no-permission',
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
      sub: 'kc-sub-billing-own-partner-e2e',
      email: OWN_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function otherPartnerToken(): string {
    return signToken({
      sub: 'kc-sub-billing-other-partner-e2e',
      email: OTHER_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function ownCustomerToken(): string {
    return signToken({
      sub: 'kc-sub-billing-own-customer-e2e',
      email: OWN_CUSTOMER_EMAIL,
      realm_access: { roles: ['Customer'] },
    })
  }

  // Distinct subject from the other tokens — see orders.e2e-spec.ts's
  // identical comment on adminToken(): syncRoles grants roles permanently
  // per-subject, so reusing a subject with a different claimed role would
  // leak Admin permissions onto it for the rest of the suite.
  function adminToken(): string {
    return signToken({
      sub: 'kc-sub-billing-admin-e2e',
      email: ADMIN_EMAIL,
      realm_access: { roles: ['Admin'] },
    })
  }

  async function createProductFixture(partnerId: string, categoryId: string, sku: string) {
    const product = await prisma.product.create({
      data: { partnerId, categoryId, title: `Billing E2E fixture ${sku}`, status: 'PUBLISHED' },
    })
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, partnerId, sku, price: 100, isDefault: true },
    })
    await prisma.inventory.create({ data: { productVariantId: variant.id, quantityOnHand: 100 } })
    createdProductIds.push(product.id)
    return variant
  }

  async function createOrderFixture(partnerId: string, customerId: string, variantId: string) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-E2E-${Math.random().toString(36).slice(2, 10)}`,
        customerId,
        partnerId,
        status: 'DRAFT',
        subtotal: 200,
        tax: 0,
        shippingCost: 0,
        total: 200,
        items: {
          create: [
            { productVariantId: variantId, quantity: 2, unitPriceSnapshot: 100, lineTotal: 200 },
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

  // OrderCompletedEvent is emitted via EventEmitter2's fire-and-forget
  // `emit()` — generateInvoiceForOrder's write is not guaranteed to have
  // committed by the time the triggering mutation's HTTP response returns.
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
          legalName: 'Billing E2E Own Partner Ltd',
          displayName: 'Billing E2E Own Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+billing-e2e-own-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
      prisma.partner.create({
        data: {
          legalName: 'Billing E2E Other Partner Ltd',
          displayName: 'Billing E2E Other Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+billing-e2e-other-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
    ])
    ownPartnerId = ownPartner.id
    otherPartnerId = otherPartner.id

    const ownCustomer = await prisma.customer.create({
      data: {
        displayName: 'Billing E2E Own Customer',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        billingEmail: 'yash.lakhani+billing-e2e-own-customer-billing@smartsensesolutions.com',
      },
    })
    ownCustomerId = ownCustomer.id

    const category = await prisma.category.findFirstOrThrow({ where: { slug: 'electronics' } })
    const ownVariant = await createProductFixture(ownPartnerId, category.id, 'BILLING-E2E-OWN-SKU')
    ownVariantId = ownVariant.id

    const [ownPartnerUser, otherPartnerUser, ownCustomerUser, adminUser, noPermissionUser] =
      await Promise.all([
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-billing-own-partner-e2e',
            email: OWN_PARTNER_EMAIL,
            fullName: 'Billing E2E Own Partner User',
            status: 'ACTIVE',
            ownerType: 'PARTNER',
            partnerId: ownPartnerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-billing-other-partner-e2e',
            email: OTHER_PARTNER_EMAIL,
            fullName: 'Billing E2E Other Partner User',
            status: 'ACTIVE',
            ownerType: 'PARTNER',
            partnerId: otherPartnerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-billing-own-customer-e2e',
            email: OWN_CUSTOMER_EMAIL,
            fullName: 'Billing E2E Own Customer User',
            status: 'ACTIVE',
            ownerType: 'CUSTOMER',
            customerId: ownCustomerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-billing-admin-e2e',
            email: ADMIN_EMAIL,
            fullName: 'Billing E2E Admin User',
            status: 'ACTIVE',
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-billing-e2e-no-permission',
            email: NO_PERMISSION_EMAIL,
            fullName: 'Billing E2E No-Permission User',
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
    // AuditLog.actor and Invoice/Payment FKs are onDelete: Restrict
    // (docs/database-schema.md) — payments/invoices/audit rows must go
    // before the Orders/Users they reference can be deleted.
    await prisma.payment.deleteMany({
      where: { invoice: { orderId: { in: createdOrderIds } } },
    })
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

  function invoicesQuery(variables: Record<string, unknown> = {}) {
    return {
      query: `
        query Invoices($filter: InvoiceFilterInput) {
          invoices(filter: $filter) {
            edges { node { id invoiceNumber partnerId status amountDue } }
            pageInfo { hasNextPage hasPreviousPage }
          }
        }
      `,
      variables,
    }
  }

  function invoiceByIdQuery(id: string) {
    return {
      query: `
        query InvoiceById($id: ID!) {
          invoice(id: $id) {
            id status amountDue payments { id amount status externalTransactionId }
          }
        }
      `,
      variables: { id },
    }
  }

  const RECORD_PAYMENT_MUTATION = `
    mutation RecordPayment($input: CreatePaymentInput!) {
      recordPayment(input: $input) { id amount status invoiceId externalTransactionId }
    }
  `

  const VOID_INVOICE_MUTATION = `
    mutation VoidInvoice($id: ID!) {
      voidInvoice(id: $id) { id status }
    }
  `

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send(invoicesQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects an authenticated caller with no billing:read permission', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${signToken()}`)
      .send(invoicesQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  it('rejects a Customer caller — Customers hold no billing:* permission at all', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${ownCustomerToken()}`)
      .send(invoicesQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  describe('order completion → invoice generation → payment → paid', () => {
    let orderId: string
    let invoiceId: string

    it('generates an ISSUED Invoice for amountDue = order.total once the order reaches COMPLETED', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      orderId = order.id

      await advanceOrderTo(
        orderId,
        ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'],
        ownPartnerToken(),
      )

      const invoice = await waitForInvoiceByOrderId(orderId)
      invoiceId = invoice.id
      expect(invoice.status).toBe('ISSUED')
      expect(invoice.amountDue.toString()).toBe('200')
      expect(invoice.partnerId).toBe(ownPartnerId)
    })

    it("scopes invoice visibility to the invoice's own vendor Partner, not another Partner", async () => {
      const ownRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(invoiceByIdQuery(invoiceId))
        .expect(200)
      expect(ownRes.body.errors).toBeUndefined()
      expect(ownRes.body.data.invoice.id).toBe(invoiceId)

      const otherRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${otherPartnerToken()}`)
        .send(invoiceByIdQuery(invoiceId))
        .expect(200)
      expect(otherRes.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it('rejects a Partner (billing:read only) calling recordPayment (billing:manage required)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: RECORD_PAYMENT_MUTATION,
          variables: {
            input: {
              invoiceId,
              amount: '200',
              method: 'BANK_TRANSFER',
              externalTransactionId: 'billing-e2e-rejected-txn',
              idempotencyKey: randomUUID(),
            },
          },
        })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    const partialPaymentIdempotencyKey = randomUUID()

    it('partially pays the invoice as Admin, moving status to PARTIALLY_PAID', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: RECORD_PAYMENT_MUTATION,
          variables: {
            input: {
              invoiceId,
              amount: '120',
              method: 'BANK_TRANSFER',
              externalTransactionId: 'billing-e2e-partial-txn',
              idempotencyKey: partialPaymentIdempotencyKey,
            },
          },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.recordPayment.status).toBe('SUCCEEDED')

      const invoiceRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(invoiceByIdQuery(invoiceId))
        .expect(200)
      expect(invoiceRes.body.data.invoice.status).toBe('PARTIALLY_PAID')
    })

    it('replaying the same idempotencyKey does not create a second Payment', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: RECORD_PAYMENT_MUTATION,
          variables: {
            input: {
              invoiceId,
              amount: '120',
              method: 'BANK_TRANSFER',
              externalTransactionId: 'billing-e2e-partial-txn',
              idempotencyKey: partialPaymentIdempotencyKey,
            },
          },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const payments = await prisma.payment.findMany({ where: { invoiceId } })
      expect(payments).toHaveLength(1)
    })

    it('cannot be voided while it has a recorded Payment', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ query: VOID_INVOICE_MUTATION, variables: { id: invoiceId } })
        .expect(200)
      expect(res.body.errors[0].extensions.code).toBe('CONFLICT')
    })

    it('pays the remainder, moving status to PAID', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: RECORD_PAYMENT_MUTATION,
          variables: {
            input: {
              invoiceId,
              amount: '80',
              method: 'CARD',
              externalTransactionId: 'billing-e2e-final-txn',
              idempotencyKey: randomUUID(),
            },
          },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()

      const invoiceRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(invoiceByIdQuery(invoiceId))
        .expect(200)
      expect(invoiceRes.body.data.invoice.status).toBe('PAID')
      expect(invoiceRes.body.data.invoice.payments).toHaveLength(2)
    })

    it('includes the invoice number in exportInvoicesCsv for the owning Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: `query { exportInvoicesCsv }`,
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
      expect(res.body.data.exportInvoicesCsv).toContain(invoice.invoiceNumber)
    })
  })

  describe('voidInvoice', () => {
    it('voids a payment-free ISSUED invoice for its own vendor Partner', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      await advanceOrderTo(
        order.id,
        ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'],
        ownPartnerToken(),
      )
      const invoice = await waitForInvoiceByOrderId(order.id)

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ query: VOID_INVOICE_MUTATION, variables: { id: invoice.id } })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.voidInvoice.status).toBe('VOID')
    })
  })
})
