import { Injectable } from '@nestjs/common'
import { DashboardStatsOutput } from './dto/dashboard-stats.output'

@Injectable()
export class DashboardService {
  getStatus(): string {
    return 'dashboard module initialized'
  }

  getStats(): DashboardStatsOutput {
    return {
      totalProducts: 128,
      totalOrders: 342,
      totalCustomers: 56,
    }
  }
}
