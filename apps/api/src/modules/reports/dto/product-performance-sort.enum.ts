import { registerEnumType } from '@nestjs/graphql'

export enum ProductPerformanceSortField {
  UNITS_SOLD = 'UNITS_SOLD',
  REVENUE = 'REVENUE',
}

registerEnumType(ProductPerformanceSortField, {
  name: 'ProductPerformanceSortField',
  description: 'Fields the product performance ranking can be sorted by. Defaults to REVENUE desc.',
})
