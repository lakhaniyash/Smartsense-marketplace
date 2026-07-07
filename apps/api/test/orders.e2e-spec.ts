import { createServer, type Server } from 'http'
import { generateKeyPairSync, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the Orders module, following the
 * real-AppModule/real-Postgres/mocked-JWKS pattern established in
 * auth.e2e-spec.ts / catalog.e2e-spec.ts (docs/testing.md § Authorization Testing).
 */
describe('Orders (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined
  let originalNodeEnv: string | undefined

  const OWN_PARTNER_EMAIL = 'yash.lakhani+orders-own-partner-e2e@smartsensesolutions.com'
  const OWN_CUSTOMER_EMAIL = 'yash.lakhani+orders-own-customer-e2e@smartsensesolutions.com'
  const OTHER_CUSTOMER_EMAIL = 'yash.lakhani+orders-other-customer-e2e@smartsensesolutions.com'
  const ADMIN_EMAIL = 'yash.lakhani+orders-admin-e2e@smartsensesolutions.com'
  const NO_PERMISSION_EMAIL = 'yash.lakhani+orders-no-permission-e2e@smartsensesolutions.com'

  let ownPartnerUserId: string
  let ownCustomerUserId: string
  let otherCustomerUserId: string
  let adminUserId: string
  let noPermissionUserId: string

  let ownPartnerId: string
  let otherPartnerId: string
  let ownCustomerId: string
  let otherCustomerId: string
  let ownVariantId: string
  let otherVariantId: string
  let lowStockVariantId: string
  let ownCustomerAddressId: string
  let ownOrderId: string
  let otherOrderId: string
  const createdProductIds: string[] = []
  const createdOrderIds: string[] = []

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-orders-e2e-no-permission',
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
      sub: 'kc-sub-orders-own-partner-e2e',
      email: OWN_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function ownCustomerToken(): string {
    return signToken({
      sub: 'kc-sub-orders-own-customer-e2e',
      email: OWN_CUSTOMER_EMAIL,
      realm_access: { roles: ['Customer'] },
    })
  }

  function otherCustomerToken(): string {
    return signToken({
      sub: 'kc-sub-orders-other-customer-e2e',
      email: OTHER_CUSTOMER_EMAIL,
      realm_access: { roles: ['Customer'] },
    })
  }

  // Distinct subject from the other tokens — see catalog.e2e-spec.ts's
  // identical comment on adminToken(): syncRoles grants roles permanently
  // per-subject, so reusing a subject with a different claimed role would
  // leak Admin permissions onto it for the rest of the suite.
  function adminToken(): string {
    return signToken({
      sub: 'kc-sub-orders-admin-e2e',
      email: ADMIN_EMAIL,
      realm_access: { roles: ['Admin'] },
    })
  }

  async function createProductFixture(
    partnerId: string,
    categoryId: string,
    sku: string,
    quantityOnHand = 100,
  ) {
    const product = await prisma.product.create({
      data: { partnerId, categoryId, title: `Orders E2E fixture ${sku}`, status: 'PUBLISHED' },
    })
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, partnerId, sku, price: 50, isDefault: true },
    })
    await prisma.inventory.create({ data: { productVariantId: variant.id, quantityOnHand } })
    createdProductIds.push(product.id)
    return variant
  }

  async function createOrderFixture(partnerId: string, customerId: string, variantId: string) {
    return createOrderWithItemsFixture(partnerId, customerId, [
      { variantId, quantity: 2, unitPrice: 50 },
    ])
  }

  async function createOrderWithItemsFixture(
    partnerId: string,
    customerId: string,
    items: Array<{ variantId: string; quantity: number; unitPrice: number }>,
  ) {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-E2E-${Math.random().toString(36).slice(2, 10)}`,
        customerId,
        partnerId,
        status: 'DRAFT',
        subtotal,
        tax: 0,
        shippingCost: 0,
        total: subtotal,
        items: {
          create: items.map((item) => ({
            productVariantId: item.variantId,
            quantity: item.quantity,
            unitPriceSnapshot: item.unitPrice,
            lineTotal: item.unitPrice * item.quantity,
          })),
        },
        statusHistory: { create: [{ toStatus: 'DRAFT' }] },
      },
    })
    createdOrderIds.push(order.id)
    return order
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
          legalName: 'Orders E2E Own Partner Ltd',
          displayName: 'Orders E2E Own Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+orders-e2e-own-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
      prisma.partner.create({
        data: {
          legalName: 'Orders E2E Other Partner Ltd',
          displayName: 'Orders E2E Other Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+orders-e2e-other-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
    ])
    ownPartnerId = ownPartner.id
    otherPartnerId = otherPartner.id

    const [ownCustomer, otherCustomer] = await Promise.all([
      prisma.customer.create({
        data: {
          displayName: 'Orders E2E Own Customer',
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          billingEmail: 'yash.lakhani+orders-e2e-own-customer-billing@smartsensesolutions.com',
        },
      }),
      prisma.customer.create({
        data: {
          displayName: 'Orders E2E Other Customer',
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          billingEmail: 'yash.lakhani+orders-e2e-other-customer-billing@smartsensesolutions.com',
        },
      }),
    ])
    ownCustomerId = ownCustomer.id
    otherCustomerId = otherCustomer.id

    const category = await prisma.category.findFirstOrThrow({ where: { slug: 'electronics' } })
    const ownVariant = await createProductFixture(ownPartnerId, category.id, 'ORDERS-E2E-OWN-SKU')
    ownVariantId = ownVariant.id
    const otherVariant = await createProductFixture(
      otherPartnerId,
      category.id,
      'ORDERS-E2E-OTHER-SKU',
    )
    otherVariantId = otherVariant.id
    // Deliberately scarce stock — used to prove the reservation-rollback
    // invariant (testing.md § Transaction Testing).
    const lowStockVariant = await createProductFixture(
      ownPartnerId,
      category.id,
      'ORDERS-E2E-LOW-STOCK-SKU',
      3,
    )
    lowStockVariantId = lowStockVariant.id

    const ownOrder = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
    ownOrderId = ownOrder.id
    const otherOrder = await createOrderFixture(otherPartnerId, otherCustomerId, ownVariantId)
    otherOrderId = otherOrder.id

    const ownCustomerAddress = await prisma.address.create({
      data: {
        ownerType: 'CUSTOMER',
        customerId: ownCustomerId,
        type: 'SHIPPING',
        line1: '1 Orders E2E Way',
        city: 'Testville',
        state: 'TS',
        postalCode: '00000',
        country: 'US',
      },
    })
    ownCustomerAddressId = ownCustomerAddress.id

    const [ownPartnerUser, ownCustomerUser, otherCustomerUser, adminUser, noPermissionUser] =
      await Promise.all([
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-orders-own-partner-e2e',
            email: OWN_PARTNER_EMAIL,
            fullName: 'Orders E2E Own Partner User',
            status: 'ACTIVE',
            ownerType: 'PARTNER',
            partnerId: ownPartnerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-orders-own-customer-e2e',
            email: OWN_CUSTOMER_EMAIL,
            fullName: 'Orders E2E Own Customer User',
            status: 'ACTIVE',
            ownerType: 'CUSTOMER',
            customerId: ownCustomerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-orders-other-customer-e2e',
            email: OTHER_CUSTOMER_EMAIL,
            fullName: 'Orders E2E Other Customer User',
            status: 'ACTIVE',
            ownerType: 'CUSTOMER',
            customerId: otherCustomerId,
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-orders-admin-e2e',
            email: ADMIN_EMAIL,
            fullName: 'Orders E2E Admin User',
            status: 'ACTIVE',
          },
        }),
        prisma.user.create({
          data: {
            keycloakSubjectId: 'kc-sub-orders-e2e-no-permission',
            email: NO_PERMISSION_EMAIL,
            fullName: 'Orders E2E No-Permission User',
            status: 'ACTIVE',
          },
        }),
      ])
    ownPartnerUserId = ownPartnerUser.id
    ownCustomerUserId = ownCustomerUser.id
    otherCustomerUserId = otherCustomerUser.id
    adminUserId = adminUser.id
    noPermissionUserId = noPermissionUser.id
  })

  afterAll(async () => {
    const userIds = [
      ownPartnerUserId,
      ownCustomerUserId,
      otherCustomerUserId,
      adminUserId,
      noPermissionUserId,
    ]
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    // Order -> OrderItem/OrderStatusHistory cascade; Product -> ProductVariant/Inventory cascade.
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } })
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } })
    await prisma.address.deleteMany({ where: { id: ownCustomerAddressId } })
    await prisma.customer.deleteMany({ where: { id: { in: [ownCustomerId, otherCustomerId] } } })
    await prisma.partner.deleteMany({ where: { id: { in: [ownPartnerId, otherPartnerId] } } })
    await app.close()
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()))
    if (originalJwksUri === undefined) delete process.env['KEYCLOAK_JWKS_URI']
    else process.env['KEYCLOAK_JWKS_URI'] = originalJwksUri
    if (originalNodeEnv === undefined) delete process.env['NODE_ENV']
    else process.env['NODE_ENV'] = originalNodeEnv
  })

  function ordersQuery(variables: Record<string, unknown> = {}): {
    query: string
    variables: Record<string, unknown>
  } {
    return {
      query: `
        query Orders($filter: OrderFilterInput) {
          orders(filter: $filter) {
            edges { node { id partnerId customerId status } }
            pageInfo { hasNextPage hasPreviousPage }
          }
        }
      `,
      variables,
    }
  }

  function orderByIdQuery(id: string): { query: string; variables: { id: string } } {
    return {
      query: `
        query OrderById($id: ID!) {
          order(id: $id) {
            id
            status
            items { id quantity productVariant { sku } }
            statusHistory { fromStatus toStatus }
          }
        }
      `,
      variables: { id },
    }
  }

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app.getHttpServer()).post('/graphql').send(ordersQuery()).expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects an authenticated caller with no orders:read permission', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${signToken()}`)
      .send(ordersQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  describe('orders', () => {
    it("scopes the list to only the caller's own orders as vendor Partner", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(ordersQuery())
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const ids = res.body.data.orders.edges.map((edge: { node: { id: string } }) => edge.node.id)
      expect(ids).toContain(ownOrderId)
      expect(ids).not.toContain(otherOrderId)
    })

    it("scopes the list to only the caller's own orders as buyer Customer", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send(ordersQuery())
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const ids = res.body.data.orders.edges.map((edge: { node: { id: string } }) => edge.node.id)
      expect(ids).toContain(ownOrderId)
      expect(ids).not.toContain(otherOrderId)
    })

    it('returns every order for a caller with no owning organization (Admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(ordersQuery())
        .expect(200)

      const ids = res.body.data.orders.edges.map((edge: { node: { id: string } }) => edge.node.id)
      expect(ids).toEqual(expect.arrayContaining([ownOrderId, otherOrderId]))
    })

    // Regression test: every OrderFilterInput field is `nullable: true`, so
    // a client can send each as `null` rather than omitting it — this class
    // of bug crashed CatalogService.buildWhere the same way (see
    // catalog.e2e-spec.ts's identical regression test) before
    // OrdersService.buildWhere got the same `?? undefined` normalization.
    it('does not crash when the client explicitly sends filter fields as null', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(
          ordersQuery({
            filter: {
              status: null,
              partnerId: null,
              customerId: null,
              createdAfter: null,
              createdBefore: null,
            },
          }),
        )
        .expect(200)

      expect(res.body.errors).toBeUndefined()
    })
  })

  describe('order', () => {
    it('returns the order with items and statusHistory for its own vendor Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(orderByIdQuery(ownOrderId))
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.order).toMatchObject({ id: ownOrderId, status: 'DRAFT' })
      expect(res.body.data.order.items).toEqual([
        expect.objectContaining({ quantity: 2, productVariant: { sku: 'ORDERS-E2E-OWN-SKU' } }),
      ])
      expect(res.body.data.order.statusHistory).toEqual([
        expect.objectContaining({ fromStatus: null, toStatus: 'DRAFT' }),
      ])
    })

    it("returns NOT_FOUND (never FORBIDDEN) when a Partner requests another Partner's order", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(orderByIdQuery(otherOrderId))
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it("returns NOT_FOUND (never FORBIDDEN) when a Customer requests another Customer's order", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${otherCustomerToken()}`)
        .send(orderByIdQuery(ownOrderId))
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })
  })

  describe('createOrder', () => {
    const CREATE_MUTATION = `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          id
          status
          customerId
          partnerId
          subtotal
          total
          items { productVariantId quantity }
        }
      }
    `

    it('rejects a caller with no orders:create permission', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: { input: { items: [{ productVariantId: ownVariantId, quantity: 1 }] } },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('places an order for a Customer caller under their own customerId, in DRAFT', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              items: [{ productVariantId: ownVariantId, quantity: 3 }],
              shippingAddressId: ownCustomerAddressId,
            },
          },
        })
        .expect(200)

      // Captured before assertions: a failed assertion must not leave this
      // order out of cleanup and orphaned against a Product deletion later.
      if (typeof res.body.data?.createOrder?.id === 'string') {
        createdOrderIds.push(res.body.data.createOrder.id)
      }

      expect(res.body.errors).toBeUndefined()
      // Prisma.Decimal normalizes trailing zeros (150.00 -> "150"), same as
      // every other Decimal-scalar field in this codebase (e.g. ProductVariant.price).
      expect(res.body.data.createOrder).toMatchObject({
        status: 'DRAFT',
        customerId: ownCustomerId,
        partnerId: ownPartnerId,
        subtotal: '150',
        total: '150',
      })
    })

    it('lets a Partner place an order on behalf of a specified customerId', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              items: [{ productVariantId: ownVariantId, quantity: 1 }],
              customerId: ownCustomerId,
            },
          },
        })
        .expect(200)

      if (typeof res.body.data?.createOrder?.id === 'string') {
        createdOrderIds.push(res.body.data.createOrder.id)
      }

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.createOrder.customerId).toBe(ownCustomerId)
    })

    it('rejects a Partner/Admin caller with no customerId (on-behalf-of placement requires one)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: { input: { items: [{ productVariantId: ownVariantId, quantity: 1 }] } },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('rejects items spanning more than one Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              customerId: ownCustomerId,
              items: [
                { productVariantId: ownVariantId, quantity: 1 },
                { productVariantId: otherVariantId, quantity: 1 },
              ],
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it("rejects a Partner ordering another Partner's variant", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              customerId: ownCustomerId,
              items: [{ productVariantId: otherVariantId, quantity: 1 }],
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('rejects a shipping address belonging to a different Customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        // Address belongs to ownCustomer, but the caller here is otherCustomer.
        .set('Authorization', `Bearer ${otherCustomerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              items: [{ productVariantId: ownVariantId, quantity: 1 }],
              shippingAddressId: ownCustomerAddressId,
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })
  })

  describe('updateOrderStatus', () => {
    const UPDATE_STATUS_MUTATION = `
      mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
        updateOrderStatus(id: $id, status: $status) { id status }
      }
    `

    it('rejects a caller with no orders:create permission (floor)', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({ query: UPDATE_STATUS_MUTATION, variables: { id: order.id, status: 'CONFIRMED' } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it("lets the order's own Customer confirm it (DRAFT->CONFIRMED), reserving inventory", async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send({ query: UPDATE_STATUS_MUTATION, variables: { id: order.id, status: 'CONFIRMED' } })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.updateOrderStatus.status).toBe('CONFIRMED')

      const inventory = await prisma.inventory.findUnique({
        where: { productVariantId: ownVariantId },
      })
      expect(inventory?.quantityReserved).toBeGreaterThanOrEqual(2)
    })

    it('rejects a Customer advancing CONFIRMED->PROCESSING (fulfillment is Partner/Admin only)', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send({ query: UPDATE_STATUS_MUTATION, variables: { id: order.id, status: 'PROCESSING' } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('lets the vendor Partner advance CONFIRMED->PROCESSING', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: UPDATE_STATUS_MUTATION, variables: { id: order.id, status: 'PROCESSING' } })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.updateOrderStatus.status).toBe('PROCESSING')
    })

    it('rejects a transition not in the matrix (e.g. DRAFT->PROCESSING)', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: UPDATE_STATUS_MUTATION, variables: { id: order.id, status: 'PROCESSING' } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('rejects confirmation that would exceed available stock, atomically (no partial reservation)', async () => {
      // Two items: one with ample stock, one with only 3 on hand — the second
      // item's reservation must fail and roll back the whole transaction,
      // including the first item's already-applied reservation
      // (docs/testing.md § Transaction Testing).
      const order = await createOrderWithItemsFixture(ownPartnerId, ownCustomerId, [
        { variantId: ownVariantId, quantity: 2, unitPrice: 50 },
        { variantId: lowStockVariantId, quantity: 10, unitPrice: 50 },
      ])
      const beforeInventory = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send({ query: UPDATE_STATUS_MUTATION, variables: { id: order.id, status: 'CONFIRMED' } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')

      const afterInventory = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })
      expect(afterInventory.quantityReserved).toBe(beforeInventory.quantityReserved)

      const unchangedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
      expect(unchangedOrder.status).toBe('DRAFT')
    })
  })

  describe('cancelOrder', () => {
    const CANCEL_MUTATION = `
      mutation CancelOrder($id: ID!, $reason: String) {
        cancelOrder(id: $id, reason: $reason) { id status }
      }
    `

    it("lets the order's own Customer cancel from DRAFT, without touching inventory", async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      const before = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send({ query: CANCEL_MUTATION, variables: { id: order.id, reason: 'Changed my mind' } })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.cancelOrder.status).toBe('CANCELLED')
      const after = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })
      expect(after.quantityReserved).toBe(before.quantityReserved)
    })

    it("lets the order's own Customer cancel from CONFIRMED, releasing reserved inventory", async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } })
      await prisma.inventory.update({
        where: { productVariantId: ownVariantId },
        data: { quantityReserved: { increment: 2 } },
      })
      const before = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send({ query: CANCEL_MUTATION, variables: { id: order.id } })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const after = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })
      expect(after.quantityReserved).toBe(before.quantityReserved - 2)
    })

    it('rejects a Customer cancelling from PROCESSING (vendor Partner/Admin only)', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownCustomerToken()}`)
        .send({ query: CANCEL_MUTATION, variables: { id: order.id } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('lets the vendor Partner cancel from PROCESSING, releasing reserved inventory', async () => {
      const order = await createOrderFixture(ownPartnerId, ownCustomerId, ownVariantId)
      await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } })
      await prisma.inventory.update({
        where: { productVariantId: ownVariantId },
        data: { quantityReserved: { increment: 2 } },
      })
      const before = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: CANCEL_MUTATION, variables: { id: order.id } })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const after = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: ownVariantId },
      })
      expect(after.quantityReserved).toBe(before.quantityReserved - 2)
    })
  })
})
