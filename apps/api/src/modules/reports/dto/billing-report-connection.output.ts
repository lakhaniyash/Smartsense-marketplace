import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { BillingReportOutput } from './billing-report.output'

@ObjectType('BillingReportEdge')
export class BillingReportEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => BillingReportOutput)
  node!: BillingReportOutput
}

@ObjectType('BillingReportConnection')
export class BillingReportConnectionOutput {
  @Field(() => [BillingReportEdgeOutput])
  edges!: BillingReportEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
