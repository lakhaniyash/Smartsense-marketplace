import { registerEnumType } from '@nestjs/graphql'

export enum CustomerSortField {
  DISPLAY_NAME = 'DISPLAY_NAME',
  CREATED_AT = 'CREATED_AT',
}

registerEnumType(CustomerSortField, {
  name: 'CustomerSortField',
  description: 'Fields the customer list can be sorted by.',
})
