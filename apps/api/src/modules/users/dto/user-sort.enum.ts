import { registerEnumType } from '@nestjs/graphql'

export enum UserSortField {
  EMAIL = 'EMAIL',
  FULL_NAME = 'FULL_NAME',
  CREATED_AT = 'CREATED_AT',
}

registerEnumType(UserSortField, {
  name: 'UserSortField',
  description: 'Fields the user list can be sorted by.',
})
