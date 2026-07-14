import { createServer, type Server } from 'http'
import { generateKeyPairSync, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the Customers module, following the
 * real-AppModule/real-Postgres/mocked-JWKS pattern established in
 * auth.e2e-spec.ts / orders.e2e-spec.ts (docs/testing.md § Authorization Testing).
 */
describe('Customers (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined
  let originalNodeEnv: string | undefined

  const ADMIN_EMAIL = 'yash.lakhani+customers-admin-e2e@smartsensesolutions.com'
  const OWN_PARTNER_EMAIL = 'yash.lakhani+customers-own-partner-e2e@smartsensesolutions.com'
  const CUSTOMER_ROLE_EMAIL = 'yash.lakhani+customers-customer-role-e2e@smartsensesolutions.com'
  const NO_PERMISSION_EMAIL = 'yash.lakhani+customers-no-permission-e2e@smartsensesolutions.com'

  let adminUserId: string
  let ownPartnerUserId: string
  let customerRoleUserId: string
  let noPermissionUserId: string

  let ownPartnerId: string
  let otherPartnerId: string
  let ownCustomerId: string
  let otherCustomerId: string
  let ownCustomerAddressId: string
  const createdProductIds: string[] = []
  const createdOrderIds: string[] = []
  const createdAddressIds: string[] = []
  const createdCustomerIds: string[] = []

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-customers-e2e-no-permission',
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

  // Distinct subject per role — see orders.e2e-spec.ts's identical comment on
  // adminToken(): syncRoles grants roles permanently per-subject, so reusing a
  // subject with a different claimed role would leak permissions onto it for
  // the rest of the suite.
  function adminToken(): string {
    return signToken({
      sub: 'kc-sub-customers-admin-e2e',
      email: ADMIN_EMAIL,
      realm_access: { roles: ['Admin'] },
    })
  }

  function ownPartnerToken(): string {
    return signToken({
      sub: 'kc-sub-customers-own-partner-e2e',
      email: OWN_PARTNER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  function customerRoleToken(): string {
    return signToken({
      sub: 'kc-sub-customers-customer-role-e2e',
      email: CUSTOMER_ROLE_EMAIL,
      realm_access: { roles: ['Customer'] },
    })
  }

  async function createOrderFixture(partnerId: string, customerId: string) {
    const category = await prisma.category.findFirstOrThrow({ where: { slug: 'electronics' } })
    const product = await prisma.product.create({
      data: {
        partnerId,
        categoryId: category.id,
        title: `Customers E2E fixture ${Math.random().toString(36).slice(2, 8)}`,
        status: 'PUBLISHED',
      },
    })
    createdProductIds.push(product.id)
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        partnerId,
        sku: `CUSTOMERS-E2E-${Math.random().toString(36).slice(2, 10)}`,
        price: 50,
        isDefault: true,
      },
    })
    await prisma.inventory.create({ data: { productVariantId: variant.id, quantityOnHand: 100 } })

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-CUST-E2E-${Math.random().toString(36).slice(2, 10)}`,
        customerId,
        partnerId,
        status: 'DRAFT',
        subtotal: 100,
        tax: 0,
        shippingCost: 0,
        total: 100,
        items: {
          create: [
            { productVariantId: variant.id, quantity: 2, unitPriceSnapshot: 50, lineTotal: 100 },
          ],
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
          legalName: 'Customers E2E Own Partner Ltd',
          displayName: 'Customers E2E Own Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+customers-e2e-own-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
      prisma.partner.create({
        data: {
          legalName: 'Customers E2E Other Partner Ltd',
          displayName: 'Customers E2E Other Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+customers-e2e-other-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
    ])
    ownPartnerId = ownPartner.id
    otherPartnerId = otherPartner.id

    const [ownCustomer, otherCustomer] = await Promise.all([
      prisma.customer.create({
        data: {
          displayName: 'Customers E2E Own Customer',
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          billingEmail: 'yash.lakhani+customers-e2e-own-customer-billing@smartsensesolutions.com',
        },
      }),
      prisma.customer.create({
        data: {
          displayName: 'Customers E2E Other Customer',
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          billingEmail: 'yash.lakhani+customers-e2e-other-customer-billing@smartsensesolutions.com',
        },
      }),
    ])
    ownCustomerId = ownCustomer.id
    otherCustomerId = otherCustomer.id
    createdCustomerIds.push(ownCustomerId, otherCustomerId)

    // Ownership derives from Order, not a direct FK (CustomersService.buildWhere)
    // — ownCustomer is only "the own Partner's customer" because they share an
    // Order; otherCustomer only ever transacts with otherPartner.
    await createOrderFixture(ownPartnerId, ownCustomerId)
    await createOrderFixture(otherPartnerId, otherCustomerId)

    const ownCustomerAddress = await prisma.address.create({
      data: {
        ownerType: 'CUSTOMER',
        customerId: ownCustomerId,
        type: 'SHIPPING',
        line1: '1 Customers E2E Way',
        city: 'Testville',
        state: 'TS',
        postalCode: '00000',
        country: 'US',
      },
    })
    ownCustomerAddressId = ownCustomerAddress.id
    createdAddressIds.push(ownCustomerAddressId)

    const [adminUser, ownPartnerUser, customerRoleUser, noPermissionUser] = await Promise.all([
      prisma.user.create({
        data: {
          keycloakSubjectId: 'kc-sub-customers-admin-e2e',
          email: ADMIN_EMAIL,
          fullName: 'Customers E2E Admin User',
          status: 'ACTIVE',
        },
      }),
      prisma.user.create({
        data: {
          keycloakSubjectId: 'kc-sub-customers-own-partner-e2e',
          email: OWN_PARTNER_EMAIL,
          fullName: 'Customers E2E Own Partner User',
          status: 'ACTIVE',
          ownerType: 'PARTNER',
          partnerId: ownPartnerId,
        },
      }),
      prisma.user.create({
        data: {
          keycloakSubjectId: 'kc-sub-customers-customer-role-e2e',
          email: CUSTOMER_ROLE_EMAIL,
          fullName: 'Customers E2E Customer Role User',
          status: 'ACTIVE',
          ownerType: 'CUSTOMER',
          customerId: ownCustomerId,
        },
      }),
      prisma.user.create({
        data: {
          keycloakSubjectId: 'kc-sub-customers-e2e-no-permission',
          email: NO_PERMISSION_EMAIL,
          fullName: 'Customers E2E No-Permission User',
          status: 'ACTIVE',
        },
      }),
    ])
    adminUserId = adminUser.id
    ownPartnerUserId = ownPartnerUser.id
    customerRoleUserId = customerRoleUser.id
    noPermissionUserId = noPermissionUser.id
  })

  afterAll(async () => {
    const userIds = [adminUserId, ownPartnerUserId, customerRoleUserId, noPermissionUserId]
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } })
    // AuditLog.actor is onDelete: Restrict (docs/database-schema.md) — every
    // create/update/archive/activate/address test writes an audit row for
    // these users, which must go before the users themselves can be deleted.
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } })
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } })
    await prisma.address.deleteMany({ where: { id: { in: createdAddressIds } } })
    await prisma.customer.deleteMany({ where: { id: { in: createdCustomerIds } } })
    await prisma.partner.deleteMany({ where: { id: { in: [ownPartnerId, otherPartnerId] } } })
    await app.close()
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()))
    if (originalJwksUri === undefined) delete process.env['KEYCLOAK_JWKS_URI']
    else process.env['KEYCLOAK_JWKS_URI'] = originalJwksUri
    if (originalNodeEnv === undefined) delete process.env['NODE_ENV']
    else process.env['NODE_ENV'] = originalNodeEnv
  })

  function customersQuery(variables: Record<string, unknown> = {}): {
    query: string
    variables: Record<string, unknown>
  } {
    return {
      query: `
        query Customers($filter: CustomerFilterInput) {
          customers(filter: $filter) {
            edges { node { id displayName status } }
            pageInfo { hasNextPage hasPreviousPage }
          }
        }
      `,
      variables,
    }
  }

  function customerByIdQuery(id: string): { query: string; variables: { id: string } } {
    return {
      query: `
        query CustomerById($id: ID!) {
          customerById(id: $id) {
            id
            displayName
            status
            billingEmail
            billingSummary { totalOrders totalInvoiced totalOutstanding }
          }
        }
      `,
      variables: { id },
    }
  }

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send(customersQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects an authenticated caller with no customers:read permission', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${signToken()}`)
      .send(customersQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  it('rejects a Customer-role caller (Customer holds neither customers:read nor customers:write)', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${customerRoleToken()}`)
      .send(customersQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  describe('customers', () => {
    it("scopes the list to only the caller's own customers as vendor Partner", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(customersQuery())
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const ids = res.body.data.customers.edges.map(
        (edge: { node: { id: string } }) => edge.node.id,
      )
      expect(ids).toContain(ownCustomerId)
      expect(ids).not.toContain(otherCustomerId)
    })

    it('returns every customer for a caller with no owning organization (Admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(customersQuery())
        .expect(200)

      const ids = res.body.data.customers.edges.map(
        (edge: { node: { id: string } }) => edge.node.id,
      )
      expect(ids).toEqual(expect.arrayContaining([ownCustomerId, otherCustomerId]))
    })
  })

  describe('customerById', () => {
    it('returns the customer with its billing summary for its own vendor Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(customerByIdQuery(ownCustomerId))
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.customerById).toMatchObject({ id: ownCustomerId, status: 'ACTIVE' })
      expect(res.body.data.customerById.billingSummary.totalOrders).toBeGreaterThanOrEqual(1)
    })

    it("returns NOT_FOUND (never FORBIDDEN) when a Partner requests another Partner's customer", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send(customerByIdQuery(otherCustomerId))
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it('returns any customer for Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send(customerByIdQuery(otherCustomerId))
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.customerById.id).toBe(otherCustomerId)
    })
  })

  describe('createCustomer', () => {
    const CREATE_MUTATION = `
      mutation CreateCustomer($input: CreateCustomerInput!) {
        createCustomer(input: $input) { id displayName type billingEmail }
      }
    `

    it('rejects a caller with no customers:manage permission', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              displayName: 'Should Not Be Created',
              type: 'INDIVIDUAL',
              billingEmail: 'yash.lakhani+customers-e2e-should-not-exist@smartsensesolutions.com',
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    // customers:write (granted to Partner) is deliberately distinct from
    // customers:manage (Admin-only) — see CustomersService.createCustomer's
    // own doc comment on why creation can't be scoped the way update/archive
    // are. A Partner caller has customers:write but not customers:manage.
    it('rejects a vendor Partner caller (customers:write does not imply customers:manage)', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              displayName: 'Should Not Be Created',
              type: 'INDIVIDUAL',
              billingEmail:
                'yash.lakhani+customers-e2e-partner-should-not-create@smartsensesolutions.com',
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('lets an Admin create a customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              displayName: 'Customers E2E Created Customer',
              type: 'ORGANIZATION',
              billingEmail: 'yash.lakhani+customers-e2e-created@smartsensesolutions.com',
            },
          },
        })
        .expect(200)

      if (typeof res.body.data?.createCustomer?.id === 'string') {
        createdCustomerIds.push(res.body.data.createCustomer.id)
      }

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.createCustomer).toMatchObject({
        displayName: 'Customers E2E Created Customer',
        type: 'ORGANIZATION',
      })
    })

    it('rejects a duplicate billingEmail with CONFLICT', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              displayName: 'Customers E2E Duplicate Email Attempt',
              type: 'INDIVIDUAL',
              billingEmail:
                'yash.lakhani+customers-e2e-own-customer-billing@smartsensesolutions.com',
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('CONFLICT')
    })
  })

  describe('updateCustomer / archiveCustomer / activateCustomer', () => {
    const UPDATE_MUTATION = `
      mutation UpdateCustomer($input: UpdateCustomerInput!) {
        updateCustomer(input: $input) { id displayName }
      }
    `
    const ARCHIVE_MUTATION = `
      mutation ArchiveCustomer($id: ID!) {
        archiveCustomer(id: $id) { id status }
      }
    `
    const ACTIVATE_MUTATION = `
      mutation ActivateCustomer($id: ID!) {
        activateCustomer(id: $id) { id status }
      }
    `

    it('rejects a caller with no customers:write permission', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({
          query: UPDATE_MUTATION,
          variables: { input: { id: ownCustomerId, displayName: 'Should Not Update' } },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it("returns NOT_FOUND when a Partner updates another Partner's customer", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: UPDATE_MUTATION,
          variables: { input: { id: otherCustomerId, displayName: 'Should Not Update' } },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it('lets the vendor Partner update their own customer', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: UPDATE_MUTATION,
          variables: {
            input: { id: ownCustomerId, displayName: 'Customers E2E Own Customer (Updated)' },
          },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.updateCustomer.displayName).toBe('Customers E2E Own Customer (Updated)')
    })

    it('lets the vendor Partner suspend then reactivate their own customer (round trip)', async () => {
      const archiveRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: ARCHIVE_MUTATION, variables: { id: ownCustomerId } })
        .expect(200)

      expect(archiveRes.body.errors).toBeUndefined()
      expect(archiveRes.body.data.archiveCustomer.status).toBe('SUSPENDED')

      const activateRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: ACTIVATE_MUTATION, variables: { id: ownCustomerId } })
        .expect(200)

      expect(activateRes.body.errors).toBeUndefined()
      expect(activateRes.body.data.activateCustomer.status).toBe('ACTIVE')
    })

    it('rejects archiving an already-suspended customer', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: ARCHIVE_MUTATION, variables: { id: ownCustomerId } })
        .expect(200)

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: ARCHIVE_MUTATION, variables: { id: ownCustomerId } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')

      // Leave the shared fixture ACTIVE for any tests that run after this one.
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: ACTIVATE_MUTATION, variables: { id: ownCustomerId } })
        .expect(200)
    })

    it("returns NOT_FOUND when a Partner archives another Partner's customer", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: ARCHIVE_MUTATION, variables: { id: otherCustomerId } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })
  })

  describe('Address sub-resource mutations', () => {
    const ADD_ADDRESS_MUTATION = `
      mutation AddCustomerAddress($input: AddCustomerAddressInput!) {
        addCustomerAddress(input: $input) { id line1 isDefault }
      }
    `
    const UPDATE_ADDRESS_MUTATION = `
      mutation UpdateCustomerAddress($input: UpdateCustomerAddressInput!) {
        updateCustomerAddress(input: $input) { id line1 isDefault }
      }
    `
    // CustomerAddressOutput deliberately does not expose `isActive` — a
    // deactivated address becomes invisible via GraphQL, not merely flagged
    // (CUSTOMER_INCLUDE filters `isActive: true`) — so deactivation is
    // verified directly against Prisma below, not via the mutation response.
    const DEACTIVATE_ADDRESS_MUTATION = `
      mutation DeactivateCustomerAddress($id: ID!) {
        deactivateCustomerAddress(id: $id) { id }
      }
    `

    it('rejects a caller with no customers:write permission', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${signToken()}`)
        .send({
          query: ADD_ADDRESS_MUTATION,
          variables: {
            input: {
              customerId: ownCustomerId,
              type: 'BILLING',
              line1: 'Should Not Be Added',
              city: 'Testville',
              state: 'TS',
              postalCode: '00000',
              country: 'US',
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it("returns NOT_FOUND when a Partner adds an address to another Partner's customer", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: ADD_ADDRESS_MUTATION,
          variables: {
            input: {
              customerId: otherCustomerId,
              type: 'BILLING',
              line1: 'Should Not Be Added',
              city: 'Testville',
              state: 'TS',
              postalCode: '00000',
              country: 'US',
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it('lets the vendor Partner add, update, and deactivate an address on their own customer', async () => {
      const addRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: ADD_ADDRESS_MUTATION,
          variables: {
            input: {
              customerId: ownCustomerId,
              type: 'BILLING',
              line1: 'Customers E2E New Billing Address',
              city: 'Testville',
              state: 'TS',
              postalCode: '00000',
              country: 'US',
              isDefault: true,
            },
          },
        })
        .expect(200)

      expect(addRes.body.errors).toBeUndefined()
      const newAddressId: string = addRes.body.data.addCustomerAddress.id
      createdAddressIds.push(newAddressId)
      expect(addRes.body.data.addCustomerAddress.isDefault).toBe(true)

      // Setting this one as default must have unset the fixture address's
      // own default flag within the same transaction (CustomersService.addCustomerAddress).
      const originalAddress = await prisma.address.findUniqueOrThrow({
        where: { id: ownCustomerAddressId },
      })
      expect(originalAddress.isDefault).toBe(false)

      const updateRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({
          query: UPDATE_ADDRESS_MUTATION,
          variables: { input: { id: newAddressId, line1: 'Customers E2E Updated Address' } },
        })
        .expect(200)

      expect(updateRes.body.errors).toBeUndefined()
      expect(updateRes.body.data.updateCustomerAddress.line1).toBe('Customers E2E Updated Address')

      const deactivateRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: DEACTIVATE_ADDRESS_MUTATION, variables: { id: newAddressId } })
        .expect(200)

      expect(deactivateRes.body.errors).toBeUndefined()
      const deactivated = await prisma.address.findUniqueOrThrow({ where: { id: newAddressId } })
      expect(deactivated.isActive).toBe(false)
    })

    it("returns NOT_FOUND when a Partner deactivates another Partner's customer's address", async () => {
      const otherAddress = await prisma.address.create({
        data: {
          ownerType: 'CUSTOMER',
          customerId: otherCustomerId,
          type: 'SHIPPING',
          line1: 'Other Customer Address',
          city: 'Testville',
          state: 'TS',
          postalCode: '00000',
          country: 'US',
        },
      })
      createdAddressIds.push(otherAddress.id)

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${ownPartnerToken()}`)
        .send({ query: DEACTIVATE_ADDRESS_MUTATION, variables: { id: otherAddress.id } })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })
  })
})
