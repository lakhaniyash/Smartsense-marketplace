import { Field, InputType } from '@nestjs/graphql'
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

@InputType()
export class CreateRoleInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @Field(() => [String], {
    description:
      'Existing seeded Permission keys to grant this Role — a Role must retain at least one ' +
      '(docs/domain-model.md § Role). Creating new Permission definitions is out of v1 scope.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissionKeys!: string[]
}
