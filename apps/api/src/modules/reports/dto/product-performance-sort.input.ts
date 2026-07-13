import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional } from 'class-validator'
import { SortDirection } from '../../../common/graphql/sort-direction.enum'
import { ProductPerformanceSortField } from './product-performance-sort.enum'

@InputType()
export class ProductPerformanceSortInput {
  // @IsOptional() here isn't about the GraphQL schema (see InvoiceSortInput's
  // identical comment) — AppValidationPipe substitutes `{}` for an omitted
  // nullable `sort` argument, so these required-looking fields still need it.
  @Field(() => ProductPerformanceSortField)
  @IsOptional()
  @IsEnum(ProductPerformanceSortField)
  field!: ProductPerformanceSortField

  @Field(() => SortDirection)
  @IsOptional()
  @IsEnum(SortDirection)
  direction!: SortDirection
}
