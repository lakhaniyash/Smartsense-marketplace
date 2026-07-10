import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional } from 'class-validator'
import { SortDirection } from '../../../common/graphql/sort-direction.enum'
import { InvoiceSortField } from './invoice-sort.enum'

@InputType()
export class InvoiceSortInput {
  // @IsOptional() here isn't about the GraphQL schema (see OrderSortInput's
  // identical comment) — AppValidationPipe substitutes `{}` for an omitted
  // nullable `sort` argument, so these required-looking fields still need it.
  @Field(() => InvoiceSortField)
  @IsOptional()
  @IsEnum(InvoiceSortField)
  field!: InvoiceSortField

  @Field(() => SortDirection)
  @IsOptional()
  @IsEnum(SortDirection)
  direction!: SortDirection
}
