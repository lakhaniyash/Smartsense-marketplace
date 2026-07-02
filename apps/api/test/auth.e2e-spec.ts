import { createServer, type Server } from 'http'
import { generateKeyPairSync, type KeyObject } from 'crypto'
import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Full-stack integration test for the auth pipeline: real AppModule, real
 * JwtStrategy/guards/AuthService/PermissionService, real Postgres — the
 * only thing not real is Keycloak itself, replaced by a local HTTP server
 * serving a JWKS document for a self-generated RSA test key pair, per
 * docs/authentication.md's "mocked JWTs signed with a test key pair" note
 * for CI. Every claim check (signature, exp, iss, aud/azp) runs for real.
 */
describe('Auth pipeline (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwksServer: Server
  let issuer: string
  let audience: string

  const KEY_ID = 'test-key-1'
  let privateKey: KeyObject
  let originalJwksUri: string | undefined

  const TEST_USER_EMAIL = 'auth-e2e-test-user@smartsense.example'
  let testUserId: string

  function signToken(overrides: Partial<Record<string, unknown>> = {}): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: 'kc-sub-auth-e2e',
      iss: issuer,
      aud: audience,
      email: TEST_USER_EMAIL,
      realm_access: { roles: ['Admin'] },
      iat: now,
      exp: now + 900,
      ...overrides,
    }
    return jwt.sign(payload, privateKey.export({ type: 'pkcs1', format: 'pem' }), {
      algorithm: 'RS256',
      keyid: KEY_ID,
    })
  }

  function meQuery(): { query: string } {
    return { query: '{ me { id email fullName roles permissions } }' }
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
        keycloakSubjectId: `pending-${Date.now()}`,
        email: TEST_USER_EMAIL,
        fullName: 'Auth E2E Test User',
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
  })

  it('rejects a protected query with no Authorization header', async () => {
    const res = await request(app.getHttpServer()).post('/graphql').send(meQuery()).expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects a malformed bearer token', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', 'Bearer not-a-real-jwt')
      .send(meQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects a validly-signed token with the wrong issuer', async () => {
    const token = signToken({ iss: 'http://localhost:8080/realms/some-other-realm' })
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(meQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects a validly-signed token whose audience and azp both mismatch', async () => {
    const token = signToken({ aud: 'some-other-client', azp: 'some-other-client' })
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(meQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000)
    const token = signToken({ iat: now - 1000, exp: now - 100 })
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(meQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('rejects a fully valid token for an identity with no provisioned account', async () => {
    const token = signToken({ sub: 'kc-sub-nobody', email: 'nobody@smartsense.example' })
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(meQuery())
      .expect(200)
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED')
  })

  it('accepts a fully valid token, provisions the identity, and resolves roles/permissions', async () => {
    const token = signToken()
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send(meQuery())
      .expect(200)

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.me).toMatchObject({
      id: testUserId,
      email: TEST_USER_EMAIL,
      fullName: 'Auth E2E Test User',
    })
    expect(res.body.data.me.roles).toContain('Admin')
    expect(res.body.data.me.permissions).toEqual(
      expect.arrayContaining(['catalog:write', 'orders:read']),
    )

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } })
    expect(updated.keycloakSubjectId).toBe('kc-sub-auth-e2e')
  })

  it('leaves the @Public() authStatus query accessible with no token', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ authStatus }' })
      .expect(200)
    expect(res.body.data.authStatus).toBe('auth module initialized')
  })

  it('leaves the REST /health endpoint accessible with no token', async () => {
    await request(app.getHttpServer()).get('/health').expect(200)
  })
})
