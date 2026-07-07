import { Prisma } from '@prisma/client'
import { registerDecorator, type ValidationOptions } from 'class-validator'

// Structural validation for a Decimal-scalar field (docs/api-conventions.md
// § Validation Strategy: "price > 0" doesn't depend on database state, so it
// belongs on the DTO, not the Service). The DTO field is typed `string` —
// see decimal.scalar.ts for why a real Prisma.Decimal instance can't safely
// pass through class-transformer — so this parses on the fly to evaluate it.
export function IsPositiveDecimal(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isPositiveDecimal',
      target: object.constructor,
      propertyName,
      ...(validationOptions !== undefined && { options: validationOptions }),
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' && typeof value !== 'number') return false
          try {
            return new Prisma.Decimal(value).greaterThan(0)
          } catch {
            return false
          }
        },
        defaultMessage(): string {
          return `${propertyName} must be a positive decimal value`
        },
      },
    })
  }
}
