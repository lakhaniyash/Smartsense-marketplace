import { Field, ID, InputType } from '@nestjs/graphql'
import { ArrayMinSize, IsArray, IsString, IsUUID } from 'class-validator'

@InputType()
export class UpdateRolePermissionsInput {
  @Field(() => ID)
  @IsUUID()
  id!: string

  @Field(() => [String], {
    description:
      "Replaces the Role's entire granted-Permission set — a Role must retain at least one " +
      '(docs/domain-model.md § Role). Rejected for a system Role (Admin/Partner/Customer).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissionKeys!: string[]
}
