import { DashboardService } from './dashboard.service'

describe('DashboardService', () => {
  let service: DashboardService
  let prisma: {
    product: { count: jest.Mock }
    order: { count: jest.Mock }
    customer: { count: jest.Mock }
  }

  beforeEach(() => {
    prisma = {
      product: { count: jest.fn() },
      order: { count: jest.fn() },
      customer: { count: jest.fn() },
    }
    service = new DashboardService(prisma as never)
  })

  describe('getStats', () => {
    it('returns real Prisma counts, excluding soft-deleted Products/Customers', async () => {
      prisma.product.count.mockResolvedValueOnce(12)
      prisma.order.count.mockResolvedValueOnce(34)
      prisma.customer.count.mockResolvedValueOnce(7)

      await expect(service.getStats()).resolves.toEqual({
        totalProducts: 12,
        totalOrders: 34,
        totalCustomers: 7,
      })
      expect(prisma.product.count).toHaveBeenCalledWith({ where: { deletedAt: null } })
      expect(prisma.order.count).toHaveBeenCalledWith()
      expect(prisma.customer.count).toHaveBeenCalledWith({ where: { deletedAt: null } })
    })
  })

  describe('getStatus', () => {
    it('reports the module as initialized', () => {
      expect(service.getStatus()).toBe('dashboard module initialized')
    })
  })
})
