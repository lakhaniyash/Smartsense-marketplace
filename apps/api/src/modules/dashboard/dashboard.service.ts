import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { DashboardStatsOutput } from './dto/dashboard-stats.output'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus(): string {
    return 'dashboard module initialized'
  }

  async getStats(): Promise<DashboardStatsOutput> {
    // Order has no deletedAt (ledger/financial models are never soft-deleted,
    // per docs/database-schema.md § Design Conventions) — Product/Customer do.
    const [totalProducts, totalOrders, totalCustomers] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.order.count(),
      this.prisma.customer.count({ where: { deletedAt: null } }),
    ])
    return { totalProducts, totalOrders, totalCustomers }
  }
}
