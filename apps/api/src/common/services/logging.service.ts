import { ConsoleLogger, Injectable } from '@nestjs/common'

// Extends ConsoleLogger directly rather than wrapping `new Logger()` — once
// this is registered via `app.useLogger()` in main.ts, Nest's static Logger
// delegates every instance's calls back to this service, so a wrapped
// `new Logger().log()` call recurses infinitely (NestJS's documented
// "custom logger" pattern is to extend ConsoleLogger for exactly this
// reason).
@Injectable()
export class LoggingService extends ConsoleLogger {}
