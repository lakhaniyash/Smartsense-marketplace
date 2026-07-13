import { Module } from '@nestjs/common'
import { ReportsResolver } from './reports.resolver'
import { ReportsService } from './reports.service'

// No `imports` array, mirroring BillingModule/NotificationsModule: Prisma
// and Common are Global modules, injected directly without a domain
// import, and ReportsService deliberately never imports another domain
// module (OrdersModule/BillingModule/CatalogModule/NotificationsModule) —
// it queries Prisma directly, mirroring DashboardService's own precedent
// (see reports.service.ts's module-level doc comment / the implementation
// plan's Architectural Decision 1).
@Module({
  providers: [ReportsResolver, ReportsService],
})
export class ReportsModule {}
