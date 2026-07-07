import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional } from 'class-validator'
import { SortDirection } from '../../../common/graphql/sort-direction.enum'
import { ProductSortField } from './product-sort.enum'

@InputType()
export class ProductSortInput {
  // @IsOptional() here isn't about the GraphQL schema (the `sort: ...!`
  // fields are already non-null there, enforced before the resolver runs)
  // — it's a workaround for AppValidationPipe's toEmptyIfNil behavior,
  // which substitutes `{}` for an omitted nullable `sort` argument and
  // would otherwise fail these required-field validators against that
  // manufactured empty object.
  @Field(() => ProductSortField)
  @IsOptional()
  @IsEnum(ProductSortField)
  field!: ProductSortField

  @Field(() => SortDirection)
  @IsOptional()
  @IsEnum(SortDirection)
  direction!: SortDirection
}
