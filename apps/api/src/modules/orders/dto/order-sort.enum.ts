import { registerEnumType } from '@nestjs/graphql'

export enum OrderSortField {
  CREATED_AT = 'CREATED_AT',
  TOTAL = 'TOTAL',
}

registerEnumType(OrderSortField, {
  name: 'OrderSortField',
  description: 'Fields the order list can be sorted by.',
})
