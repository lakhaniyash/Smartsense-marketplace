import { BadRequestException } from '@nestjs/common'
import { CustomScalar, Scalar } from '@nestjs/graphql'
import { Prisma } from '@prisma/client'
import { Kind, type ValueNode } from 'graphql'

// Serializes/parses as a string end-to-end so precision is never routed
// through a binary float (docs/database-schema.md § Design Conventions:
// money and other Decimal(12,2) columns must never become GraphQL Float).
// Shared across every module with a Decimal-backed field — introduced here
// for ProductVariant.price, reused as-is by Orders (M13) and Billing (M14).
//
// The internal (parsed) representation is a *string*, not a Prisma.Decimal
// instance, deliberately: NestJS's global ValidationPipe runs every Input
// DTO through class-transformer's plainToInstance, which — for any nested
// non-primitive object without a matching special case (String/Number/
// Boolean/Date/Buffer/Promise) — unconditionally calls `new targetType()`
// while walking the object graph. Decimal.js's constructor rejects a
// no-argument call, so a real Decimal instance here would crash inside
// class-transformer before a resolver ever runs. A string is one of
// class-transformer's safe primitive cases, and Prisma's generated types
// already accept `string` anywhere a Decimal field is written
// (`Decimal | DecimalJsLike | number | string`), so no conversion is needed
// at the write site either.
@Scalar('Decimal', () => DecimalScalar)
export class DecimalScalar implements CustomScalar<string, string> {
  description =
    'Arbitrary-precision decimal (money, percentages), transported as a string to avoid floating-point precision loss.'

  parseValue(value: unknown): string {
    return this.normalize(value)
  }

  serialize(value: unknown): string {
    if (value instanceof Prisma.Decimal) return value.toString()
    return this.normalize(value)
  }

  parseLiteral(ast: ValueNode): string {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return this.normalize(ast.value)
    }
    throw new BadRequestException('Decimal must be a string, int, or float literal')
  }

  private normalize(value: unknown): string {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new BadRequestException('Decimal must be provided as a string or number')
    }
    try {
      return new Prisma.Decimal(value).toString()
    } catch {
      throw new BadRequestException(`"${String(value)}" is not a valid decimal value`)
    }
  }
}
