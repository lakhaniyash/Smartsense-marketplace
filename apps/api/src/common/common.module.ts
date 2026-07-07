import { Global, Module } from '@nestjs/common'
import { DecimalScalar } from './graphql/decimal.scalar'
import { LoggingService } from './services/logging.service'

@Global()
@Module({
  providers: [LoggingService, DecimalScalar],
  exports: [LoggingService],
})
export class CommonModule {}
