import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus'

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([])
  }
}
