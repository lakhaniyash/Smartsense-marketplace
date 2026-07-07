import { registerEnumType } from '@nestjs/graphql'

export enum ProductSortField {
  NAME = 'NAME',
  CREATED_AT = 'CREATED_AT',
}

registerEnumType(ProductSortField, {
  name: 'ProductSortField',
  description: 'Fields the product list can be sorted by.',
})
