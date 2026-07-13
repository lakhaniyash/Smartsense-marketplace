import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { InventoryReportItemOutput } from './inventory-report-item.output'

@ObjectType('InventoryReportItemEdge')
export class InventoryReportItemEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => InventoryReportItemOutput)
  node!: InventoryReportItemOutput
}

@ObjectType('InventoryReportItemConnection')
export class InventoryReportItemConnectionOutput {
  @Field(() => [InventoryReportItemEdgeOutput])
  edges!: InventoryReportItemEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
