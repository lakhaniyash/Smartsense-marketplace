import { type INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

describe('AppModule (e2e)', () => {
  let app: INestApplication

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

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res: { body: { status: string } }) => {
        expect(res.body.status).toBe('ok')
      })
  })

  it('/graphql (POST) - authStatus query', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ authStatus }' })
      .expect(200)
      .expect((res: { body: { data: { authStatus: string } } }) => {
        expect(res.body.data.authStatus).toBe('auth module initialized')
      })
  })
})
