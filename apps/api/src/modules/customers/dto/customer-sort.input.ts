import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional } from 'class-validator'
import { SortDirection } from '../../../common/graphql/sort-direction.enum'
import { CustomerSortField } from './customer-sort.enum'

@InputType()
export class CustomerSortInput {
  // @IsOptional() here isn't about the GraphQL schema (see ProductSortInput's
  // identical comment) — AppValidationPipe substitutes `{}` for an omitted
  // nullable `sort` argument, so these required-looking fields still need it.
  @Field(() => CustomerSortField)
  @IsOptional()
  @IsEnum(CustomerSortField)
  field!: CustomerSortField

  @Field(() => SortDirection)
  @IsOptional()
  @IsEnum(SortDirection)
  direction!: SortDirection
}
