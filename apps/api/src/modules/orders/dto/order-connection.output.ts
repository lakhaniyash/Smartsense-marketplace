import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { OrderOutput } from './order.output'

@ObjectType('OrderEdge')
export class OrderEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => OrderOutput)
  node!: OrderOutput
}

@ObjectType('OrderConnection')
export class OrderConnectionOutput {
  @Field(() => [OrderEdgeOutput])
  edges!: OrderEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
