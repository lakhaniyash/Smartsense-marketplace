import { UserOwnerType } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'

// UserOwnerType is already registered as a GraphQL enum by
// dto/user.output.ts — this file only imports and references it (same
// re-registration-would-be-redundant reasoning as UserFilterInput).
@InputType()
export class InviteUserInput {
  @Field()
  @IsEmail()
  @MaxLength(255)
  email!: string

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string

  @Field(() => UserOwnerType, {
    description:
      'Which organization, if any, this User acts on behalf of. NONE for platform staff; ' +
      'PARTNER/CUSTOMER requires the matching partnerId/customerId (docs/domain-model.md § User).',
  })
  @IsEnum(UserOwnerType)
  ownerType!: UserOwnerType

  @Field(() => ID, {
    nullable: true,
    description: 'Required when ownerType is PARTNER; must be null otherwise.',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string

  @Field(() => ID, {
    nullable: true,
    description: 'Required when ownerType is CUSTOMER; must be null otherwise.',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string

  @Field(() => [ID], {
    description:
      'Roles to grant the invited User — at least one. Granting the Admin role requires the ' +
      'caller to already hold it (docs/authorization.md § User Role Assignment Guardrails).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  roleIds!: string[]
}
