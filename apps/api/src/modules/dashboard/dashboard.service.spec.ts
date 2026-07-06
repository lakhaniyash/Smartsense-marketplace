import { DashboardService } from './dashboard.service'

describe('DashboardService', () => {
  let service: DashboardService

  beforeEach(() => {
    service = new DashboardService()
  })

  describe('getStats', () => {
    it('returns mock counts for products, orders, and customers', () => {
      expect(service.getStats()).toEqual({
        totalProducts: expect.any(Number),
        totalOrders: expect.any(Number),
        totalCustomers: expect.any(Number),
      })
    })
  })

  describe('getStatus', () => {
    it('reports the module as initialized', () => {
      expect(service.getStatus()).toBe('dashboard module initialized')
    })
  })
})
