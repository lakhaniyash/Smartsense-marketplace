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

  it('never forwards a raw, non-HttpException message to the client', () => {
    const error = catchAsGraphql(
      new Error('relation "products" does not exist at column 3, id=af31...'),
    )
    expect(error.message).toBe('Internal server error')
  })

  it('still logs the real message server-side for a raw exception', () => {
    catchAsGraphql(new Error('relation "products" does not exist'))
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('relation "products" does not exist'),
      undefined,
      GlobalExceptionFilter.name,
    )
  })

  it('genericizes a bare string throw the same way', () => {
    const error = catchAsGraphql('unexpected internal detail')
    expect(error.message).toBe('Internal server error')
  })

  it('still forwards an HttpException message verbatim (deliberately user-facing)', () => {
    const error = catchAsGraphql(new NotFoundException('Order not found'))
    expect(error.message).toBe('Order not found')
  })
})
