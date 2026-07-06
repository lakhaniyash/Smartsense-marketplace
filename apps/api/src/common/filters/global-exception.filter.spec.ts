import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import type { GraphQLError } from 'graphql'
import { GlobalExceptionFilter } from './global-exception.filter'

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter
  let logger: { error: jest.Mock }

  beforeEach(() => {
    logger = { error: jest.fn() }
    filter = new GlobalExceptionFilter(logger as never)
  })

  function catchAsGraphql(exception: unknown): GraphQLError {
    const host = { getType: () => 'graphql' } as never
    try {
      filter.catch(exception, host)
    } catch (error) {
      return error as GraphQLError
    }
    throw new Error('filter did not throw')
  }

  it('maps ConflictException to extensions.code CONFLICT', () => {
    const error = catchAsGraphql(new ConflictException('SKU already exists for this Partner'))
    expect(error.extensions?.['code']).toBe('CONFLICT')
    expect(error.message).toBe('SKU already exists for this Partner')
  })

  it('maps NotFoundException to extensions.code NOT_FOUND', () => {
    const error = catchAsGraphql(new NotFoundException('Product not found'))
    expect(error.extensions?.['code']).toBe('NOT_FOUND')
  })

  it('maps ForbiddenException to extensions.code FORBIDDEN', () => {
    const error = catchAsGraphql(new ForbiddenException('Requires permission(s): catalog:write'))
    expect(error.extensions?.['code']).toBe('FORBIDDEN')
  })

  it('maps an unrecognized exception to INTERNAL_SERVER_ERROR', () => {
    const error = catchAsGraphql(new Error('boom'))
    expect(error.extensions?.['code']).toBe('INTERNAL_SERVER_ERROR')
  })
})
