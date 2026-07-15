import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckService,
  type HealthCheckResult,
  PrismaHealthIndicator,
} from '@nestjs/terminus'
import { PrismaService } from '../prisma/prisma.service'

// Liveness + readiness in one endpoint (SM-267): `/health` now actually
// verifies the database dependency rather than reporting a bare 200, so an
// orchestrator's healthcheck fails when Postgres is unreachable. Plain REST —
// GqlAuthGuard bypasses non-GraphQL requests, so this stays unauthenticated
// (an orchestrator can't present a JWT).
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.pingCheck('database', this.prisma)])
  }
}
