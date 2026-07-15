import 'reflect-metadata'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { LoggingService } from './common/services/logging.service'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  const logger = app.get(LoggingService)
  app.useLogger(logger)

  // Baseline security response headers (HSTS, X-Content-Type-Options,
  // X-Frame-Options, etc.) — SM-269 production posture. CSP is left off: the
  // API serves no HTML app (the SPA is served by its own host, which owns the
  // page CSP), and helmet's default CSP would otherwise break the Apollo
  // sandbox used in non-production introspection.
  app.use(helmet({ contentSecurityPolicy: false }))

  // Restrict CORS to the configured origin allowlist when set; unset →
  // permissive, for local dev (see configuration.ts). Auth is Bearer-token,
  // but a production allowlist is still correct posture.
  const allowedOrigins = app.get(ConfigService).get<string[]>('cors.allowedOrigins') ?? []
  app.enableCors(allowedOrigins.length > 0 ? { origin: allowedOrigins, credentials: true } : {})

  const port = app.get(ConfigService).get<number>('port') ?? 3000

  await app.listen(port)

  logger.log(`Application is running on: http://localhost:${port.toString()}`, 'Bootstrap')
  logger.log(`GraphQL playground: http://localhost:${port.toString()}/graphql`, 'Bootstrap')
  logger.log(`Health check: http://localhost:${port.toString()}/health`, 'Bootstrap')
}

void bootstrap()
