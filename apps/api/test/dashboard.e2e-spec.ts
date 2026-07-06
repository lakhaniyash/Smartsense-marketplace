import { createServer, type Server } from 'http'
import { generateKeyPairSync, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the dashboardStats query, following the
 * real-AppModule/real-Postgres/mocked-JWKS pattern established in
 * auth.e2e-spec.ts (docs/testing.md § Authorization Testing).
 */
describe('Dashboard (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined
  let originalNodeEnv: string | undefined

  const TEST_USER_EMAIL = 'yash.lakhani+dashboard-e2e@smartsensesolutions.com'
  let testUserId: string

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-dashboard-e2e',
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

  function dashboardStatsQuery(): { query: string } {
    return { query: '{ dashboardStats { totalProducts totalOrders totalCustomers } }' }
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
        keycloakSubjectId: 'kc-sub-dashboard-e2e',
        email: TEST_USER_EMAIL,
        fullName: 'Dashboard E2E Test User',
        status: 'ACTIVE',
      },
    })
    testUserId = testUser.id
  })

  afterAll(async () => {
    await prisma.userRole.deleteMany({ where: { userId: testUserId } })
    await prisma.user.delete({ where: { id: testUserId } })
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
      .send(dashboardStatsQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects an authenticated caller with no roles/permissions assigned', async () => {
    const token = signToken()
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(dashboardStatsQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN')
  })

  it('returns mock stats for a caller with the Admin role (dashboard:view)', async () => {
    const token = signToken({ realm_access: { roles: ['Admin'] } })
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(dashboardStatsQuery())
      .expect(200)

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.dashboardStats).toEqual({
      totalProducts: expect.any(Number),
      totalOrders: expect.any(Number),
      totalCustomers: expect.any(Number),
    })
  })

  it('leaves the @Public() dashboardStatus query accessible with no token', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ dashboardStatus }' })
      .expect(200)
    expect(res.body.data.dashboardStatus).toBe('dashboard module initialized')
  })
})
