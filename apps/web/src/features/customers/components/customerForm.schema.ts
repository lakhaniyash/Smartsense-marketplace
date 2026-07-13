import { z } from 'zod'
import { CustomerType } from '@lib/graphql/__generated__/graphql'

// Validates before the mutation is sent — a UX optimization, not the
// security/correctness boundary (that's class-validator on CreateCustomerInput/
// UpdateCustomerInput, server-side). Kept beside CustomerForm per
// docs/architecture.md § Forms. Unlike ProductForm, no field is mode-specific
// here, so one schema covers both create and edit.
export const customerFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(200, 'Display name is too long'),
  type: z.nativeEnum(CustomerType),
  billingEmail: z.string().trim().email('Enter a valid email address'),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
