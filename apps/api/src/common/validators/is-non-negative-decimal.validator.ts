import { Prisma } from '@prisma/client'
import { registerDecorator, type ValidationOptions } from 'class-validator'

// Sibling to IsPositiveDecimal for fields that may legitimately be zero
// (e.g. Order.tax/shippingCost when no tax/shipping engine applies).
export function IsNonNegativeDecimal(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isNonNegativeDecimal',
      target: object.constructor,
      propertyName,
      ...(validationOptions !== undefined && { options: validationOptions }),
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' && typeof value !== 'number') return false
          try {
            return new Prisma.Decimal(value).greaterThanOrEqualTo(0)
          } catch {
            return false
          }
        },
        defaultMessage(): string {
          return `${propertyName} must be a non-negative decimal value`
        },
      },
    })
  }
}
