import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { NotificationOutput } from './notification.output'

@ObjectType('NotificationEdge')
export class NotificationEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => NotificationOutput)
  node!: NotificationOutput
}

@ObjectType('NotificationConnection')
export class NotificationConnectionOutput {
  @Field(() => [NotificationEdgeOutput])
  edges!: NotificationEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
