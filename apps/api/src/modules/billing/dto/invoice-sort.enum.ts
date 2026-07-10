import { registerEnumType } from '@nestjs/graphql'

export enum InvoiceSortField {
  CREATED_AT = 'CREATED_AT',
  ISSUED_AT = 'ISSUED_AT',
  DUE_AT = 'DUE_AT',
  AMOUNT_DUE = 'AMOUNT_DUE',
}

registerEnumType(InvoiceSortField, {
  name: 'InvoiceSortField',
  description: 'Fields the invoice list can be sorted by.',
})
