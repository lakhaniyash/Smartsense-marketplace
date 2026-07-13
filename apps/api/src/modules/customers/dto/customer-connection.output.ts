import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { CustomerOutput } from './customer.output'

@ObjectType('CustomerEdge')
export class CustomerEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => CustomerOutput)
  node!: CustomerOutput
}

@ObjectType('CustomerConnection')
export class CustomerConnectionOutput {
  @Field(() => [CustomerEdgeOutput])
  edges!: CustomerEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
