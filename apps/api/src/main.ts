import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { LoggingService } from './common/services/logging.service'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  const logger = app.get(LoggingService)
  app.useLogger(logger)

  app.enableCors()

  const portStr = process.env['PORT']
  const port = portStr !== undefined ? parseInt(portStr, 10) : 3000

  await app.listen(port)

  logger.log(`Application is running on: http://localhost:${port.toString()}`, 'Bootstrap')
  logger.log(`GraphQL playground: http://localhost:${port.toString()}/graphql`, 'Bootstrap')
  logger.log(`Health check: http://localhost:${port.toString()}/health`, 'Bootstrap')
}

void bootstrap()
