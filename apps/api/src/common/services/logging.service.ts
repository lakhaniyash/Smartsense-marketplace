import { Injectable, Logger, type LoggerService } from '@nestjs/common'

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger = new Logger(LoggingService.name)

  log(message: string, context?: string): void {
    this.logger.log(message, context)
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context)
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context)
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, context)
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, context)
  }
}
