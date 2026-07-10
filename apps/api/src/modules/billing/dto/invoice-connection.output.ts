import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { InvoiceOutput } from './invoice.output'

@ObjectType('InvoiceEdge')
export class InvoiceEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => InvoiceOutput)
  node!: InvoiceOutput
}

@ObjectType('InvoiceConnection')
export class InvoiceConnectionOutput {
  @Field(() => [InvoiceEdgeOutput])
  edges!: InvoiceEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
