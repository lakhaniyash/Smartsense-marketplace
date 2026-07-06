import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { GqlArgumentsHost, type GqlContextType } from '@nestjs/graphql'
import type { Response } from 'express'
import { GraphQLError } from 'graphql'
import { LoggingService } from '../services/logging.service'

interface ErrorResponse {
  statusCode: number
  message: string
  timestamp: string
  path: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LoggingService) private readonly logger: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const contextType = host.getType<GqlContextType>()

    if (contextType === 'graphql') {
      this.handleGraphqlException(exception)
      return
    }

    this.handleHttpException(exception, host)
  }

  private handleGraphqlException(exception: unknown): never {
    const message = this.extractMessage(exception)
    const code = this.extractCode(exception)

    this.logger.error(`GraphQL error: ${message}`, undefined, GlobalExceptionFilter.name)

    throw new GraphQLError(message, {
      extensions: { code },
    })
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<{ url: string }>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message = this.extractMessage(exception)

    this.logger.error(
      `HTTP ${status} error on ${request.url}: ${message}`,
      undefined,
      GlobalExceptionFilter.name,
    )

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(status).json(errorResponse)
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse()
      if (typeof response === 'string') return response
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as Record<string, unknown>)['message']
        return Array.isArray(msg)
          ? ((msg[0] as string | undefined) ?? exception.message)
          : String(msg)
      }
      return exception.message
    }
    if (exception instanceof Error) return exception.message
    if (typeof exception === 'string') return exception
    return 'Internal server error'
  }

  private extractCode(exception: unknown): string {
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND'
      if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHENTICATED'
      if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN'
      if (status === HttpStatus.BAD_REQUEST) return 'BAD_USER_INPUT'
      // ConflictException (409) — first exercised by CatalogService's SKU
      // uniqueness check (api-conventions.md § Error Handling Strategy's
      // P2002 → ConflictException mapping); update docs/graphql.md § 11's
      // error table in the same PR as any further change to this mapping.
      if (status === HttpStatus.CONFLICT) return 'CONFLICT'
    }
    return 'INTERNAL_SERVER_ERROR'
  }
}

export { GqlArgumentsHost }
