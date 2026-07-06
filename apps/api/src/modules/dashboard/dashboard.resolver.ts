import { Query, Resolver } from '@nestjs/graphql'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { DashboardService } from './dashboard.service'
import { DashboardStatsOutput } from './dto/dashboard-stats.output'

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Public()
  @Query(() => String, { name: 'dashboardStatus', description: 'Dashboard module status' })
  dashboardStatus(): string {
    return this.dashboardService.getStatus()
  }

  @Permissions('dashboard:view')
  @Query(() => DashboardStatsOutput, {
    name: 'dashboardStats',
    description: 'Summary statistics for the dashboard overview.',
  })
  dashboardStats(): DashboardStatsOutput {
    return this.dashboardService.getStats()
  }
}
