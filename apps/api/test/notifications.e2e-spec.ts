import { createServer, type Server } from 'http'
import { generateKeyPairSync, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the Notifications module, following the
 * real-AppModule/real-Postgres/mocked-JWKS pattern established in
 * orders.e2e-spec.ts / billing.e2e-spec.ts (docs/testing.md § Authorization
 * Testing). This is the one thing a mocked-Prisma unit test structurally
 * cannot prove: that Orders'/Billing's `eventEmitter.emit(...)` calls
 * actually round-trip through the real, globally-registered
 * EventEmitterModule and land real Notification rows via
 * NotificationEventsListener -> NotificationsService.fanOut.
 */
describe('Notifications (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined
  let originalNodeEnv: string | undefined

  const OWN_PARTNER_EMAIL = 'yash.lakhani+notifications-own-partner-e2e@smartsensesolutions.com'
  const OTHER_PARTNER_EMAIL = 'yash.lakhani+notifications-other-partner-e2e@smartsensesolutions.com'
  const OWN_CUSTOMER_EMAIL = 'yash.lakhani+notifications-own-customer-e2e@smartsensesolutions.com'

  let ownPartnerUserId: string
  let otherPartnerUserId: string
  let ownCustomerUserId: string

  let ownPartnerId: string
  let otherPartnerId: string
  let ownCustomerId: string
  let ownVariantId: string
  const createdProductIds: string[] = []
  const createdOrderIds: string[] = []

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-notifications-own-partner-e2e',
      iss: issuer,
      aud: audience,
      email: OWN_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] as string[] },
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
      sub: 'kc-sub-notifications-own-partner-e2e',
      email: OWN_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function otherPartnerToken(): string {
    return signToken({
      sub: 'kc-sub-notifications-other-partner-e2e',
      email: OTHER_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function ownCustomerToken(): string {
    return signToken({
      sub: 'kc-sub-notifications-own-customer-e2e',
      email: OWN_CUSTOMER_EMAIL,
      realm_access: { roles: ['Customer'] },
    })
  }

  async function createProductFixture(partnerId: string, categoryId: string, sku: string) {
    const product = await prisma.product.create({
      data: {
        partnerId,
        categoryId,
        title: `Notifications E2E fixture ${sku}`,
        status: 'PUBLISHED',
      },
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
        orderNumber: `ORD-NOTIF-E2E-${Math.random().toString(36).slice(2, 10)}`,
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

  // Every emitting event here (order.confirmed, order.cancelled,
  // order.completed, invoice.generated) travels through EventEmitter2's
  // fire-and-forget `emit()` — same as billing.e2e-spec.ts's
  // waitForInvoiceByOrderId, the listener's async fan-out is not guaranteed
  // to have committed by the time the triggering mutation's HTTP response
  // returns, so this polls briefly rather than asserting immediately.
  async function waitForNotification(
    recipientId: string,
    type: string,
    entityId: string,
  ): Promise<{ id: string; status: string }> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const notification = await prisma.notification.findFirst({
        where: { recipientId, type: type as never, entityId },
      })
      if (notification !== null) return notification
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error(
      `Notification (${type}, entityId=${entityId}) for recipient ${recipientId} was not ` +
        'created within the poll window',
    )
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
          legalName: 'Notifications E2E Own Partner Ltd',
          displayName: 'Notifications E2E Own Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+notifications-e2e-own-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
      prisma.partner.create({
        data: {
          legalName: 'Notifications E2E Other Partner Ltd',
          displayName: 'Notifications E2E Other Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+notifications-e2e-other-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
    ])
    ownPartnerId = ownPartner.id
    otherPartnerId = otherPartner.id

    const ownCustomer = await prisma.customer.create({
      data: {
        displayName: 'Notifications E2E Own Customer',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        billingEmail: 'yash.lakhani+notifications-e2e-own-customer-billing@smartsensesolutions.com',
      },
    })
    ownCustomerId = ownCustomer.id

    const category = await prisma.category.findFirstOrThrow({ where: { slug: 'electronics' } })
    const ownVariant = await createProductFixture(
      ownPartnerId,
      category.id,
      'NOTIFICATIONS-E2E-OWN-SKU',
    )
    ownVariantId = ownVariant.id

    const [ownPartnerUser, otherPartnerUser, ownCustomerUser] = await Promise.all([
      prisma.user.create({
        data: {
          keycloakSubjectId: 'kc-sub-notifications-own-partner-e2e',
          email: OWN_PARTNER_EMAIL,
          fullName: 'Notifications E2E Own Partner User',
          status: 'ACTIVE',
          ownerType: 'PARTNER',
          partnerId: ownPartnerId,
        },
      }),
      prisma.user.create({
        data: {
          keycloakSubjectId: 'kc-sub-notifications-other-partner-e2e',
          email: OTHER_PARTNER_EMAIL,
          fullName: 'Notifications E2E Other Partner User',
          status: 'ACTIVE',
          ownerType: 'PARTNER',
          partnerId: otherPartnerId,
        },
      }),
      prisma.user.create({
        data: {
          keycloakSubjectId: 'kc-sub-notifications-own-customer-e2e',
          email: OWN_CUSTOMER_EMAIL,
          fullName: 'Notifications E2E Own Customer User',
          status: 'ACTIVE',
          ownerType: 'CUSTOMER',
          customerId: ownCustomerId,
        },
      }),
    ])
    ownPartnerUserId = ownPartnerUser.id
    otherPartnerUserId = otherPartnerUser.id
    ownCustomerUserId = ownCustomerUser.id
  })

  afterAll(async () => {
    const userIds = [ownPartnerUserId, otherPartnerUserId, ownCustomerUserId]
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.notification.deleteMany({ where: { recipientId: { in: userIds } } })
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

  function notificationsQuery(variables: Record<string, unknown> = {}) {
    return {
      query: `
        query Notifications($filter: NotificationFilterInput) {
          notifications(filter: $filter) {
            edges { node { id type status entityType entityId } }
            pageInfo { hasNextPage hasPreviousPage }
          }
        }
      `,
      variables,
    }
  }

  function unreadCountQuery() {
    return { query: `query { unreadNotificationCount }` }
  }

  const MARK_READ_MUTATION = `
    mutation MarkNotificationRead($id: ID!) {
      markNotificationRead(id: $id) { id status }
    }
  `

  const MARK_ALL_READ_MUTATION = `
    mutation MarkAllNotificationsRead {
      markAllNotificationsRead
    }
  `

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send(notificationsQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  describe('order confirm -> cancel -> complete drives real fan-out via the event bus', () => {
    let confirmedOrderId: string
    let cancelledOrderId: string

    it('order.confirmed fans out to both the Partner and Customer', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      confirmedOrderId = order.id

      await advanceOrderTo(confirmedOrderId, ['CONFIRMED'], ownPartnerToken())

      const partnerNotification = await waitForNotification(
        ownPartnerUserId,
        'ORDER_CONFIRMED',
        confirmedOrderId,
      )
      const customerNotification = await waitForNotification(
        ownCustomerUserId,
        'ORDER_CONFIRMED',
        confirmedOrderId,
      )
      expect(partnerNotification.status).toBe('UNREAD')
      expect(customerNotification.status).toBe('UNREAD')

      // Confirms the Customer can see it via GraphQL too, not just via a
      // direct Prisma read — same ownership-scoped query path a Partner uses.
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send(notificationsQuery({ filter: { status: 'UNREAD' } }))
        .expect(200)
      expect(res.body.errors).toBeUndefined()
      expect(
        res.body.data.notifications.edges.some(
          (edge: { node: { entityId: string } }) => edge.node.entityId === confirmedOrderId,
        ),
      ).toBe(true)
    })

    it('order.completed and invoice.generated notify only the Partner (no customerId on either event)', async () => {
      await advanceOrderTo(
        confirmedOrderId,
        ['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'],
        ownPartnerToken(),
      )

      await waitForNotification(ownPartnerUserId, 'ORDER_COMPLETED', confirmedOrderId)

      const invoice = await (async () => {
        for (let attempt = 0; attempt < 20; attempt++) {
          const found = await prisma.invoice.findUnique({ where: { orderId: confirmedOrderId } })
          if (found !== null) return found
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
        throw new Error('Invoice was not generated within the poll window')
      })()
      await waitForNotification(ownPartnerUserId, 'INVOICE_GENERATED', invoice.id)

      const customerCompletedNotification = await prisma.notification.findFirst({
        where: { recipientId: ownCustomerUserId, type: 'ORDER_COMPLETED' },
      })
      expect(customerCompletedNotification).toBeNull()
    })

    it('order.cancelled (DRAFT -> CANCELLED) fans out to both the Partner and Customer', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      cancelledOrderId = order.id

      await advanceOrderTo(cancelledOrderId, ['CANCELLED'], ownPartnerToken())

      await waitForNotification(ownPartnerUserId, 'ORDER_CANCELLED', cancelledOrderId)
      await waitForNotification(ownCustomerUserId, 'ORDER_CANCELLED', cancelledOrderId)
    })
  })

  describe('notifications / unreadNotificationCount / markNotificationRead / markAllNotificationsRead', () => {
    it("only returns the caller's own notifications, scoped by recipientId", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${otherPartnerToken()}`)
        .send(notificationsQuery())
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.notifications.edges).toHaveLength(0)
    })

    it('unreadNotificationCount reflects the UNREAD rows fanned out to this Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(unreadCountQuery())
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.unreadNotificationCount).toBeGreaterThan(0)
    })

    it("throws NOT_FOUND (not FORBIDDEN) when marking another recipient's notification read", async () => {
      const mine = await prisma.notification.findFirstOrThrow({
        where: { recipientId: ownPartnerUserId },
      })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${otherPartnerToken()}`)
        .send({ query: MARK_READ_MUTATION, variables: { id: mine.id } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it("marks one of the caller's own notifications read", async () => {
      const mine = await prisma.notification.findFirstOrThrow({
        where: { recipientId: ownPartnerUserId, status: 'UNREAD' },
      })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: MARK_READ_MUTATION, variables: { id: mine.id } })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.markNotificationRead.status).toBe('READ')
    })

    it('markAllNotificationsRead marks every remaining UNREAD notification for the caller', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: MARK_ALL_READ_MUTATION })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.markAllNotificationsRead).toBeGreaterThan(0)

      const remainingUnread = await prisma.notification.count({
        where: { recipientId: ownPartnerUserId, status: 'UNREAD' },
      })
      expect(remainingUnread).toBe(0)
    })
  })
})
