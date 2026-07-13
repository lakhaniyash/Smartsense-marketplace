import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType('AuditLogEntry', {
  description:
    'One AuditLog row (docs/database-schema.md § Audit Log), read-only and scoped to a single ' +
    'entity — the first GraphQL exposure of this model, added for the Customer activity timeline.',
})
export class AuditLogEntryOutput {
  @Field(() => ID)
  id!: string

  @Field()
  action!: string

  @Field()
  entityType!: string

  @Field(() => ID)
  entityId!: string

  @Field(() => String, {
    nullable: true,
    description:
      'JSON-encoded metadata, if any — transported as a string rather than adding a new ' +
      'GraphQL JSON scalar dependency for this one field.',
  })
  metadata!: string | null

  @Field()
  occurredAt!: Date

  @Field(() => ID)
  actorId!: string

  @Field()
  actorName!: string

  @Field()
  actorEmail!: string
}
