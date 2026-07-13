import { z } from 'zod'
import { AddressType } from '@lib/graphql/__generated__/graphql'

// Validates before the mutation is sent — a UX optimization, not the
// security/correctness boundary (that's class-validator on
// AddCustomerAddressInput/UpdateCustomerAddressInput, server-side). Kept
// beside AddressForm per docs/architecture.md § Forms.
export const addressFormSchema = z.object({
  type: z.nativeEnum(AddressType),
  line1: z.string().trim().min(1, 'Address line 1 is required').max(200, 'Too long'),
  line2: z.string().trim().max(200, 'Too long').optional(),
  city: z.string().trim().min(1, 'City is required').max(100, 'Too long'),
  state: z.string().trim().min(1, 'State is required').max(100, 'Too long'),
  postalCode: z.string().trim().min(1, 'Postal code is required').max(20, 'Too long'),
  country: z.string().trim().min(1, 'Country is required').max(100, 'Too long'),
  isDefault: z.boolean(),
})

export type AddressFormValues = z.infer<typeof addressFormSchema>
