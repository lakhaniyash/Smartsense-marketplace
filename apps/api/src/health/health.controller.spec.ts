import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('runs the health check with a database ping against Prisma', async () => {
    const db = { pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }) }
    const health = {
      check: jest
        .fn()
        .mockImplementation((indicators: Array<() => Promise<unknown>>) =>
          Promise.all(indicators.map((indicator) => indicator())),
        ),
    }
    const prisma = {}
    const controller = new HealthController(health as never, db as never, prisma as never)

    await controller.check()

    expect(health.check).toHaveBeenCalledTimes(1)
    // The indicator passed to check() must ping the database via Prisma.
    const indicators = health.check.mock.calls[0][0] as Array<() => Promise<unknown>>
    await indicators[0]?.()
    expect(db.pingCheck).toHaveBeenCalledWith('database', prisma)
  })
})
