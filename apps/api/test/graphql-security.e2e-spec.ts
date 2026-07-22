import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * Query-shape hardening (v1.0 Release Readiness Audit finding F-C4):
 * GraphQL depth/complexity limits are enforced as `validationRules` on the
 * Apollo Server config (app.module.ts), which graphql-js runs during query
 * *validation* — strictly before any NestJS guard or resolver executes.
 * That's why none of these tests need a JWT or a real database row: a
 * structurally-rejected query never reaches the point where auth or a
 * Prisma lookup would even happen.
 *
 * The depth query below deliberately uses a REAL, legitimately-typed field
 * chain (`order.items.productVariant.inventory`, depth 4 — the deepest
 * chain this schema's actual object types allow) rather than GraphQL
 * introspection (`__schema`/`__type`): graphql-depth-limit explicitly
 * exempts every field starting with `__` from depth counting by design (see
 * its own source comment, "ignore the introspection fields which begin with
 * double underscores") — an introspection-based deep query would never be
 * rejected no matter how deeply nested, which isn't a bug in this app's
 * config, just a fact about the library that shaped how this test had to
 * be built.
 *
 * Since the real schema's deepest legitimate chain (4) sits comfortably
 * under the production default (10), proving the *rejection* path needs a
 * second app instance booted with a deliberately tightened
 * GRAPHQL_MAX_QUERY_DEPTH — proving the configured value is actually read
 * and enforced, rather than picking an artificially contorted query to
 * clear an unmodified default.
 */
describe('GraphQL query-shape limits (e2e)', () => {
  let app: INestApplication

  const DEEP_REAL_QUERY = `
    query DeepRealQuery($id: ID!) {
      order(id: $id) {
        items {
          productVariant {
            inventory {
              quantityOnHand
            }
          }
        }
      }
    }
  `

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('allows a normal, shallow query (the default depth/complexity budget never touches real traffic)', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ authStatus }' })
      .expect(200)

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.authStatus).toBe('auth module initialized')
  })

  it("allows this schema's own deepest real field chain (depth 4) under the production default (10)", async () => {
    // No Authorization header and a made-up id: irrelevant to what this
    // test proves. A missing/invalid auth or a NOT_FOUND on the id would
    // both surface as an execution-time GraphQL error (200 + `errors`),
    // never a depth-limit rejection — this test only needs the query to
    // survive *validation*, which is the one thing UNAUTHENTICATED/
    // NOT_FOUND have no bearing on.
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: DEEP_REAL_QUERY, variables: { id: '00000000-0000-0000-0000-000000000000' } })
      .expect(200)

    expect(res.body.errors?.[0]?.message).not.toMatch(/exceeds maximum operation depth/i)
  })

  it('rejects a query deeper than a configured GRAPHQL_MAX_QUERY_DEPTH', async () => {
    const originalMaxDepth = process.env['GRAPHQL_MAX_QUERY_DEPTH']
    process.env['GRAPHQL_MAX_QUERY_DEPTH'] = '2'

    let strictApp: INestApplication | undefined
    try {
      const strictModule: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile()
      strictApp = strictModule.createNestApplication()
      await strictApp.init()

      // A validation-phase rejection (this) never reaches execution, unlike
      // a resolver throwing — GraphQL-over-HTTP returns 400 for the former,
      // 200 with an `errors` array for the latter.
      const res = await request(strictApp.getHttpServer())
        .post('/graphql')
        .send({
          query: DEEP_REAL_QUERY,
          variables: { id: '00000000-0000-0000-0000-000000000000' },
        })
        .expect(400)

      expect(res.body.data).toBeUndefined()
      expect(res.body.errors).toBeDefined()
      expect(res.body.errors[0].message).toMatch(/exceeds maximum operation depth/i)
    } finally {
      if (strictApp !== undefined) await strictApp.close()
      if (originalMaxDepth === undefined) delete process.env['GRAPHQL_MAX_QUERY_DEPTH']
      else process.env['GRAPHQL_MAX_QUERY_DEPTH'] = originalMaxDepth
    }
  })

  it('rejects a shallow-but-expensive query exceeding GRAPHQL_MAX_QUERY_COMPLEXITY (default 1000) — depth limiting alone cannot catch this shape', async () => {
    // Depth stays at 1 throughout (every alias is a top-level field on the
    // same query) — this isolates the complexity rule from the depth rule
    // deliberately, per this test's own name.
    const aliasedFields = Array.from({ length: 1100 }, (_, i) => `a${i}: authStatus`).join('\n')
    const expensiveButShallowQuery = `{ ${aliasedFields} }`

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: expensiveButShallowQuery })
      .expect(400)

    expect(res.body.data).toBeUndefined()
    expect(res.body.errors).toBeDefined()
    expect(res.body.errors[0].message).toMatch(/exceeds the maximum complexity/i)
  })
})
