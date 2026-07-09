import { Global, Module } from '@nestjs/common'
import { DecimalScalar } from './graphql/decimal.scalar'
import { AuditLogService } from './services/audit-log.service'
import { LoggingService } from './services/logging.service'

@Global()
@Module({
  providers: [LoggingService, DecimalScalar, AuditLogService],
  exports: [LoggingService, AuditLogService],
})
export class CommonModule {}
