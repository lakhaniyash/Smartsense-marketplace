import { InvoiceStatus } from '@prisma/client'
import { Field, ID, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

@InputType()
export class InvoiceFilterInput {
  @Field(() => InvoiceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus

  @Field(() => ID, {
    nullable: true,
    description: "Narrows within the caller's own scope; only Admin can broaden beyond it.",
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string
}
