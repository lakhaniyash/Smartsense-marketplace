import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional } from 'class-validator'
import { SortDirection } from '../../../common/graphql/sort-direction.enum'
import { UserSortField } from './user-sort.enum'

@InputType()
export class UserSortInput {
  // @IsOptional() here isn't about the GraphQL schema (see
  // CustomerSortInput's identical comment) — AppValidationPipe substitutes
  // `{}` for an omitted nullable `sort` argument, so these required-looking
  // fields still need it.
  @Field(() => UserSortField)
  @IsOptional()
  @IsEnum(UserSortField)
  field!: UserSortField

  @Field(() => SortDirection)
  @IsOptional()
  @IsEnum(SortDirection)
  direction!: SortDirection
}
