import { Global, Module } from '@nestjs/common'
import { DecimalScalar } from './graphql/decimal.scalar'
import { AuditLogService } from './services/audit-log.service'
import { KeycloakAdminService } from './services/keycloak-admin.service'
import { LoggingService } from './services/logging.service'

@Global()
@Module({
  providers: [LoggingService, DecimalScalar, AuditLogService, KeycloakAdminService],
  exports: [LoggingService, AuditLogService, KeycloakAdminService],
})
export class CommonModule {}
