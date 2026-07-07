import { createServer, type Server } from 'http'
import { generateKeyPairSync, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the `categories` query, following the
 * real-AppModule/real-Postgres/mocked-JWKS pattern established in
 * auth.e2e-spec.ts (docs/testing.md § Authorization Testing).
 */
describe('Catalog (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined
  let originalNodeEnv: string | undefined

  const TEST_USER_EMAIL = 'yash.lakhani+catalog-e2e@smartsensesolutions.com'
  const PARTNER_USER_EMAIL = 'yash.lakhani+catalog-partner-e2e@smartsensesolutions.com'
  const ADMIN_USER_EMAIL = 'yash.lakhani+catalog-admin-e2e@smartsensesolutions.com'
  let testUserId: string
  let partnerUserId: string
  let adminUserId: string
  let ownPartnerId: string
  let otherPartnerId: string
  let ownProductId: string
  let otherProductId: string
  let electronicsCategoryId: string
  const mutationCreatedProductIds: string[] = []

  function partnerToken(): string {
    return signToken({
      sub: 'kc-sub-catalog-partner-e2e',
      email: PARTNER_USER_EMAIL,
      realm_access: { roles: ['Partner'] },
    })
  }

  // Deliberately a distinct identity from testUserId: syncRoles adds
  // UserRole rows from every authenticated request and never resets them,
  // so a token merely *claiming* the Admin role for testUserId's subject
  // would permanently grant it Admin (and thus catalog:write) for the rest
  // of the suite — exactly the bug this helper avoids.
  function adminToken(): string {
    return signToken({
      sub: 'kc-sub-catalog-admin-e2e',
      email: ADMIN_USER_EMAIL,
      realm_access: { roles: ['Admin'] },
    })
  }

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-catalog-e2e',
      iss: issuer,
      aud: audience,
      email: TEST_USER_EMAIL,
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

  function categoriesQuery(): { query: string } {
    return { query: '{ categories { id name slug parentCategoryId displayOrder } }' }
  }

  async function createProductFixture(partnerId: string, categoryId: string, sku: string) {
    const product = await prisma.product.create({
      data: {
        partnerId,
        categoryId,
        title: `Fixture product ${sku}`,
        status: 'PUBLISHED',
      },
    })
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        partnerId,
        sku,
        price: 10,
        isDefault: true,
      },
    })
    await prisma.inventory.create({ data: { productVariantId: variant.id } })
    return product
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
    const testUser = await prisma.user.create({
      data: {
        keycloakSubjectId: 'kc-sub-catalog-e2e',
        email: TEST_USER_EMAIL,
        fullName: 'Catalog E2E Test User',
        status: 'ACTIVE',
      },
    })
    testUserId = testUser.id

    const [ownPartner, otherPartner] = await Promise.all([
      prisma.partner.create({
        data: {
          legalName: 'Catalog E2E Own Partner Ltd',
          displayName: 'Catalog E2E Own Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+catalog-e2e-own-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
      prisma.partner.create({
        data: {
          legalName: 'Catalog E2E Other Partner Ltd',
          displayName: 'Catalog E2E Other Partner',
          status: 'ACTIVE',
          contactEmail: 'yash.lakhani+catalog-e2e-other-partner@smartsensesolutions.com',
          commissionRate: 10,
        },
      }),
    ])
    ownPartnerId = ownPartner.id
    otherPartnerId = otherPartner.id

    const category = await prisma.category.findFirstOrThrow({ where: { slug: 'electronics' } })
    electronicsCategoryId = category.id

    const [ownProduct, otherProduct] = await Promise.all([
      createProductFixture(ownPartnerId, category.id, 'CATALOG-E2E-OWN-SKU'),
      createProductFixture(otherPartnerId, category.id, 'CATALOG-E2E-OTHER-SKU'),
    ])
    ownProductId = ownProduct.id
    otherProductId = otherProduct.id

    const partnerUser = await prisma.user.create({
      data: {
        keycloakSubjectId: 'kc-sub-catalog-partner-e2e',
        email: PARTNER_USER_EMAIL,
        fullName: 'Catalog E2E Partner User',
        status: 'ACTIVE',
        ownerType: 'PARTNER',
        partnerId: ownPartnerId,
      },
    })
    partnerUserId = partnerUser.id

    const adminUser = await prisma.user.create({
      data: {
        keycloakSubjectId: 'kc-sub-catalog-admin-e2e',
        email: ADMIN_USER_EMAIL,
        fullName: 'Catalog E2E Admin User',
        status: 'ACTIVE',
      },
    })
    adminUserId = adminUser.id
  })

  afterAll(async () => {
    await prisma.userRole.deleteMany({
      where: { userId: { in: [testUserId, partnerUserId, adminUserId] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, partnerUserId, adminUserId] } },
    })
    // Cascades to each Product's ProductVariant + Inventory.
    await prisma.product.deleteMany({
      where: { id: { in: [ownProductId, otherProductId, ...mutationCreatedProductIds] } },
    })
    await prisma.partner.deleteMany({ where: { id: { in: [ownPartnerId, otherPartnerId] } } })
    await app.close()
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()))
    if (originalJwksUri === undefined) delete process.env['KEYCLOAK_JWKS_URI']
    else process.env['KEYCLOAK_JWKS_URI'] = originalJwksUri
    if (originalNodeEnv === undefined) delete process.env['NODE_ENV']
    else process.env['NODE_ENV'] = originalNodeEnv
  })

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send(categoriesQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects an authenticated caller with no catalog:read permission', async () => {
    const token = signToken()
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(categoriesQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  it('returns the seeded category taxonomy for a caller with the Admin role', async () => {
    const token = adminToken()
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(categoriesQuery())
      .expect(200)

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.categories.length).toBeGreaterThan(0)
    expect(res.body.data.categories).toContainEqual(
      expect.objectContaining({ slug: 'electronics', parentCategoryId: null }),
    )
  })

  describe('products', () => {
    function productsQuery(variables: Record<string, unknown> = {}): {
      query: string
      variables: Record<string, unknown>
    } {
      return {
        query: `
          query Products($filter: ProductFilterInput) {
            products(filter: $filter) {
              edges { node { id title sku status } }
              pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
            }
          }
        `,
        variables,
      }
    }

    it("scopes the list to only the caller's own Partner products", async () => {
      const token = signToken({
        sub: 'kc-sub-catalog-partner-e2e',
        email: PARTNER_USER_EMAIL,
        realm_access: { roles: ['Partner'] },
      })
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send(productsQuery())
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      const ids = res.body.data.products.edges.map((edge: { node: { id: string } }) => edge.node.id)
      expect(ids).toContain(ownProductId)
      expect(ids).not.toContain(otherProductId)
    })

    it("returns every Partner's products for a caller with no owning organization (Admin)", async () => {
      const token = adminToken()
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send(productsQuery())
        .expect(200)

      const ids = res.body.data.products.edges.map((edge: { node: { id: string } }) => edge.node.id)
      expect(ids).toEqual(expect.arrayContaining([ownProductId, otherProductId]))
    })

    it('filters by SKU search across the OR(title, sku) match', async () => {
      const token = adminToken()
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send(productsQuery({ filter: { search: 'CATALOG-E2E-OWN-SKU' } }))
        .expect(200)

      const nodes = res.body.data.products.edges.map((edge: { node: { sku: string } }) => edge.node)
      expect(nodes).toEqual([expect.objectContaining({ sku: 'CATALOG-E2E-OWN-SKU' })])
    })

    // Regression test: a TypeScript client under exactOptionalPropertyTypes
    // sends `after: null` (rather than omitting the variable) for an unset
    // nullable cursor — this previously crashed with "Buffer.from ... Received
    // null" because the resolver typed `after` as `string | undefined` while
    // GraphQL runtime actually handed it `null`.
    it('does not crash when the client explicitly sends after: null', async () => {
      const token = adminToken()
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: `
            query Products($after: String) {
              products(after: $after) {
                edges { node { id } }
                pageInfo { hasPreviousPage }
              }
            }
          `,
          variables: { after: null },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.products.pageInfo.hasPreviousPage).toBe(false)
    })
  })

  describe('productById', () => {
    function productByIdQuery(id: string): { query: string; variables: { id: string } } {
      return {
        query: 'query ProductById($id: ID!) { productById(id: $id) { id title sku } }',
        variables: { id },
      }
    }

    it("returns the product when it belongs to the caller's own Partner", async () => {
      const token = signToken({
        sub: 'kc-sub-catalog-partner-e2e',
        email: PARTNER_USER_EMAIL,
        realm_access: { roles: ['Partner'] },
      })
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send(productByIdQuery(ownProductId))
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.productById).toMatchObject({
        id: ownProductId,
        sku: 'CATALOG-E2E-OWN-SKU',
      })
    })

    it('returns NOT_FOUND (never FORBIDDEN) when the product belongs to a different Partner', async () => {
      const token = signToken({
        sub: 'kc-sub-catalog-partner-e2e',
        email: PARTNER_USER_EMAIL,
        realm_access: { roles: ['Partner'] },
      })
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send(productByIdQuery(otherProductId))
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })
  })

  describe('createProduct', () => {
    const CREATE_MUTATION = `
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          id
          title
          sku
          status
        }
      }
    `

    it('rejects a caller with no catalog:write permission', async () => {
      const token = signToken()
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              title: 'Denied Product',
              categoryId: electronicsCategoryId,
              sku: 'CATALOG-E2E-DENIED-SKU',
              price: '9.99',
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it("creates a Product owned by the caller's own Partner, with its SKU flattened", async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              title: 'Catalog E2E Created Product',
              categoryId: electronicsCategoryId,
              sku: 'CATALOG-E2E-CREATED-SKU',
              price: '24.99',
            },
          },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.createProduct).toMatchObject({
        title: 'Catalog E2E Created Product',
        sku: 'CATALOG-E2E-CREATED-SKU',
        status: 'DRAFT',
      })
      mutationCreatedProductIds.push(res.body.data.createProduct.id as string)

      // Ownership actually landed on the caller's own Partner, not just the
      // response shape — fetch it back through the scoped query.
      const verify = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: 'query($id: ID!) { productById(id: $id) { id } }',
          variables: { id: res.body.data.createProduct.id },
        })
        .expect(200)
      expect(verify.body.errors).toBeUndefined()
    })

    it('translates a duplicate SKU within the same Partner into CONFLICT', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: CREATE_MUTATION,
          variables: {
            input: {
              title: 'Duplicate SKU Product',
              categoryId: electronicsCategoryId,
              sku: 'CATALOG-E2E-OWN-SKU', // already used by ownProductId's variant
              price: '9.99',
            },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('CONFLICT')
      expect(res.body.data).toBeNull()
    })
  })

  describe('updateProduct', () => {
    it('updates a Product owned by the caller', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: `
            mutation UpdateProduct($input: UpdateProductInput!) {
              updateProduct(input: $input) { id title }
            }
          `,
          variables: { input: { id: ownProductId, title: 'Renamed via e2e' } },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.updateProduct).toMatchObject({
        id: ownProductId,
        title: 'Renamed via e2e',
      })
    })

    it('returns NOT_FOUND when updating a product owned by a different Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: `
            mutation UpdateProduct($input: UpdateProductInput!) {
              updateProduct(input: $input) { id }
            }
          `,
          variables: { input: { id: otherProductId, title: 'Should not apply' } },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })
  })

  describe('archiveProduct', () => {
    it('transitions a caller-owned Product to ARCHIVED', async () => {
      const created = await createProductFixture(
        ownPartnerId,
        electronicsCategoryId,
        'CATALOG-E2E-ARCHIVE-SKU',
      )
      mutationCreatedProductIds.push(created.id)

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: 'mutation($id: ID!) { archiveProduct(id: $id) { id status } }',
          variables: { id: created.id },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.archiveProduct).toEqual({ id: created.id, status: 'ARCHIVED' })
    })

    it('returns NOT_FOUND when archiving a product owned by a different Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: 'mutation($id: ID!) { archiveProduct(id: $id) { id } }',
          variables: { id: otherProductId },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })
  })

  describe('variants and inventory', () => {
    const CREATE_VARIANT_MUTATION = `
      mutation CreateVariant($input: CreateProductVariantInput!) {
        createProductVariant(input: $input) {
          id
          sku
          price
          isDefault
          attributes { key value }
          inventory { quantityOnHand quantityReserved sellableQuantity }
        }
      }
    `

    async function productVariants(productId: string) {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query:
            'query($id: ID!) { productById(id: $id) { variants { id sku isDefault status } } }',
          variables: { id: productId },
        })
        .expect(200)
      return res.body.data.productById.variants as Array<{
        id: string
        sku: string
        isDefault: boolean
      }>
    }

    it('rejects a caller with no catalog:write permission', async () => {
      const token = signToken()
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({
          query: CREATE_VARIANT_MUTATION,
          variables: { input: { productId: ownProductId, sku: 'X', price: '1.00' } },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
    })

    it('returns NOT_FOUND when adding a variant to a Product owned by a different Partner', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: CREATE_VARIANT_MUTATION,
          variables: { input: { productId: otherProductId, sku: 'X', price: '1.00' } },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
    })

    it('adds a non-default Variant with structured attributes, without disturbing the existing default', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: CREATE_VARIANT_MUTATION,
          variables: {
            input: {
              productId: ownProductId,
              sku: 'CATALOG-E2E-VARIANT-2',
              price: '29.99',
              attributes: [{ key: 'color', value: 'Blue' }],
            },
          },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.createProductVariant).toMatchObject({
        sku: 'CATALOG-E2E-VARIANT-2',
        price: '29.99',
        isDefault: false,
        attributes: [{ key: 'color', value: 'Blue' }],
        inventory: { quantityOnHand: 0, quantityReserved: 0, sellableQuantity: 0 },
      })

      const variants = await productVariants(ownProductId)
      expect(variants.filter((v) => v.isDefault)).toHaveLength(1)
      expect(variants.find((v) => v.sku === 'CATALOG-E2E-OWN-SKU')?.isDefault).toBe(true)
    })

    it('rejects a duplicate SKU within the same Partner as CONFLICT', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: CREATE_VARIANT_MUTATION,
          variables: {
            input: { productId: ownProductId, sku: 'CATALOG-E2E-OWN-SKU', price: '5.00' },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('CONFLICT')
    })

    it('rejects a non-positive price at the input layer', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: CREATE_VARIANT_MUTATION,
          variables: {
            input: { productId: ownProductId, sku: 'CATALOG-E2E-ZERO-PRICE', price: '0' },
          },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('setDefaultProductVariant promotes a new default and demotes the previous one', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: CREATE_VARIANT_MUTATION,
          variables: {
            input: { productId: ownProductId, sku: 'CATALOG-E2E-VARIANT-3', price: '15.00' },
          },
        })
        .expect(200)
      const newVariantId = createRes.body.data.createProductVariant.id as string

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: 'mutation($id: ID!) { setDefaultProductVariant(id: $id) { id isDefault } }',
          variables: { id: newVariantId },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
      expect(res.body.data.setDefaultProductVariant).toEqual({ id: newVariantId, isDefault: true })

      const variants = await productVariants(ownProductId)
      expect(variants.filter((v) => v.isDefault)).toEqual([
        expect.objectContaining({ id: newVariantId }),
      ])
    })

    it('rejects archiving the default variant', async () => {
      const variants = await productVariants(ownProductId)
      const defaultVariant = variants.find((v) => v.isDefault)
      expect(defaultVariant).toBeDefined()

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: 'mutation($id: ID!) { archiveProductVariant(id: $id) { id } }',
          variables: { id: defaultVariant!.id },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it("rejects archiving a Product's only remaining variant", async () => {
      // A Product created via createProduct/createProductFixture always
      // starts with exactly one Variant, which is necessarily its default —
      // this exercises the same "must keep >= 1 Variant" invariant that
      // "rejects archiving the default variant" covers from the other angle.
      const solo = await createProductFixture(
        ownPartnerId,
        electronicsCategoryId,
        'CATALOG-E2E-SOLO-SKU',
      )
      mutationCreatedProductIds.push(solo.id)
      const [soloVariant] = await productVariants(solo.id)

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: 'mutation($id: ID!) { archiveProductVariant(id: $id) { id } }',
          variables: { id: soloVariant?.id },
        })
        .expect(200)

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
    })

    it('archives a non-default Variant when another Variant remains', async () => {
      const variants = await productVariants(ownProductId)
      const nonDefault = variants.find((v) => !v.isDefault)
      expect(nonDefault).toBeDefined()

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${partnerToken()}`)
        .send({
          query: 'mutation($id: ID!) { archiveProductVariant(id: $id) { id } }',
          variables: { id: nonDefault!.id },
        })
        .expect(200)

      expect(res.body.errors).toBeUndefined()
    })

    describe('updateProductVariant', () => {
      it('rejects setting status directly to ACTIVE or OUT_OF_STOCK', async () => {
        const variants = await productVariants(ownProductId)
        const target = variants[0]

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: `
              mutation($input: UpdateProductVariantInput!) {
                updateProductVariant(input: $input) { id status }
              }
            `,
            variables: { input: { id: target?.id, status: 'OUT_OF_STOCK' } },
          })
          .expect(200)

        expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
      })

      it('allows transitioning status to DISCONTINUED', async () => {
        const created = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: CREATE_VARIANT_MUTATION,
            variables: {
              input: { productId: ownProductId, sku: 'CATALOG-E2E-DISCONTINUE', price: '3.00' },
            },
          })
          .expect(200)
        const variantId = created.body.data.createProductVariant.id as string

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: `
              mutation($input: UpdateProductVariantInput!) {
                updateProductVariant(input: $input) { id status }
              }
            `,
            variables: { input: { id: variantId, status: 'DISCONTINUED' } },
          })
          .expect(200)

        expect(res.body.errors).toBeUndefined()
        expect(res.body.data.updateProductVariant).toEqual({
          id: variantId,
          status: 'DISCONTINUED',
        })
      })
    })

    describe('adjustInventory', () => {
      const ADJUST_MUTATION = `
        mutation($input: AdjustInventoryInput!) {
          adjustInventory(input: $input) {
            id
            status
            inventory { quantityOnHand quantityReserved sellableQuantity }
          }
        }
      `

      it('returns NOT_FOUND for a variant owned by a different Partner', async () => {
        const [otherVariant] = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${adminToken()}`)
          .send({
            query: 'query($id: ID!) { productById(id: $id) { variants { id } } }',
            variables: { id: otherProductId },
          })
          .then((res) => res.body.data.productById.variants as Array<{ id: string }>)

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: ADJUST_MUTATION,
            variables: {
              input: {
                productVariantId: otherVariant?.id,
                adjustmentType: 'INCREASE',
                quantity: 1,
              },
            },
          })
          .expect(200)

        expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND')
      })

      it('INCREASE raises quantityOnHand and flips status to ACTIVE', async () => {
        const created = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: CREATE_VARIANT_MUTATION,
            variables: {
              input: { productId: ownProductId, sku: 'CATALOG-E2E-ADJUST-1', price: '7.50' },
            },
          })
          .expect(200)
        const variantId = created.body.data.createProductVariant.id as string

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: ADJUST_MUTATION,
            variables: {
              input: { productVariantId: variantId, adjustmentType: 'INCREASE', quantity: 20 },
            },
          })
          .expect(200)

        expect(res.body.errors).toBeUndefined()
        expect(res.body.data.adjustInventory).toEqual({
          id: variantId,
          status: 'ACTIVE',
          inventory: { quantityOnHand: 20, quantityReserved: 0, sellableQuantity: 20 },
        })
      })

      it('rejects a DECREASE that would drive stock negative', async () => {
        const created = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: CREATE_VARIANT_MUTATION,
            variables: {
              input: { productId: ownProductId, sku: 'CATALOG-E2E-ADJUST-2', price: '7.50' },
            },
          })
          .expect(200)
        const variantId = created.body.data.createProductVariant.id as string

        const res = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${partnerToken()}`)
          .send({
            query: ADJUST_MUTATION,
            variables: {
              input: { productVariantId: variantId, adjustmentType: 'DECREASE', quantity: 1 },
            },
          })
          .expect(200)

        expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT')
      })
    })
  })
})
