import { registerEnumType } from '@nestjs/graphql'

// Promoted from the Catalog module once Orders (M13) became its second
// consumer, per docs/graphql.md § 3 Shared Types. Field-specific sort enums
// (e.g. ProductSortField, OrderSortField) stay module-local.
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(SortDirection, { name: 'SortDirection' })
