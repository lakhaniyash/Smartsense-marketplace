import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { ProductOutput } from './product.output'

@ObjectType('ProductEdge')
export class ProductEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => ProductOutput)
  node!: ProductOutput
}

@ObjectType('ProductConnection')
export class ProductConnectionOutput {
  @Field(() => [ProductEdgeOutput])
  edges!: ProductEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
