import { Field, ObjectType } from '@nestjs/graphql'
import { PageInfoOutput } from '../../../common/graphql/page-info.output'
import { UserOutput } from './user.output'

@ObjectType('UserEdge')
export class UserEdgeOutput {
  @Field()
  cursor!: string

  @Field(() => UserOutput)
  node!: UserOutput
}

@ObjectType('UserConnection')
export class UserConnectionOutput {
  @Field(() => [UserEdgeOutput])
  edges!: UserEdgeOutput[]

  @Field(() => PageInfoOutput)
  pageInfo!: PageInfoOutput
}
