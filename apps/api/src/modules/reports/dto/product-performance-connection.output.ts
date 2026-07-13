import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { ProductPerformanceOutput } from './product-performance.output'

// `cursor` here encodes an *offset*, not a row id, unlike every other
// connection in the codebase — a deliberate, documented deviation:
// Prisma's `groupBy` (this report is grouped by productVariantId, summing
// OrderItem.quantity/lineTotal) has no `cursor` parameter, only `skip`/
// `take`. See ReportsService.encodeOffsetCursor/decodeOffsetCursor for the
// implementation and docs/graphql.md's pagination convention for the
// id-cursor norm this departs from. Accepted risk: a row inserted mid-list
// during pagination could shift results — acceptable for a ranked,
// period-scoped report, not for a live feed (which this isn't).
@ObjectType('ProductPerformanceEdge')
export class ProductPerformanceEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => ProductPerformanceOutput)
  node!: ProductPerformanceOutput
}

@ObjectType('ProductPerformanceConnection')
export class ProductPerformanceConnectionOutput {
  @Field(() => [ProductPerformanceEdgeOutput])
  edges!: ProductPerformanceEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
