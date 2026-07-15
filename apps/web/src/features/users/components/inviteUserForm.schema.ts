import { z } from 'zod'
import { UserOwnerType } from '@lib/graphql/__generated__/graphql'

// Mirrors the server's InviteUserInput rules (client-side UX layer only — the
// class-validator DTO + UsersService are the real boundary). The
// ownerType↔partnerId/customerId coupling is conditional-required, which a
// plain object can't express, so it's enforced in superRefine.
export const inviteUserFormSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address').max(255),
    fullName: z.string().trim().min(1, 'Full name is required').max(200),
    ownerType: z.nativeEnum(UserOwnerType),
    partnerId: z.string().trim().uuid('Enter a valid partner id').or(z.literal('')),
    customerId: z.string().trim().uuid('Enter a valid customer id').or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (values.ownerType === UserOwnerType.Partner) {
      if (values.partnerId === '')
        ctx.addIssue({ path: ['partnerId'], code: 'custom', message: 'Partner id is required' })
    } else if (values.partnerId !== '') {
      ctx.addIssue({
        path: ['partnerId'],
        code: 'custom',
        message: 'Only a partner user can have a partner id',
      })
    }
    if (values.ownerType === UserOwnerType.Customer) {
      if (values.customerId === '')
        ctx.addIssue({ path: ['customerId'], code: 'custom', message: 'Customer id is required' })
    } else if (values.customerId !== '') {
      ctx.addIssue({
        path: ['customerId'],
        code: 'custom',
        message: 'Only a customer user can have a customer id',
      })
    }
  })

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>
