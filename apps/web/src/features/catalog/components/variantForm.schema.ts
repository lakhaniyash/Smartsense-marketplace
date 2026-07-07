import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

// Validates user input before a mutation is even sent — a UX optimization,
// not the security/correctness boundary (that's class-validator on the
// generated Input DTO, server-side). Kept beside VariantForm per
// docs/architecture.md § Forms.
export const variantFormSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').max(64, 'SKU is too long'),
  price: z
    .string()
    .trim()
    .min(1, 'Price is required')
    .regex(DECIMAL_PATTERN, 'Price must be a positive number (up to 2 decimal places)')
    .refine((value) => Number(value) > 0, 'Price must be greater than zero'),
  isDefault: z.boolean(),
  attributes: z.array(
    z.object({
      key: z.string().trim().min(1, 'Key is required').max(50, 'Key is too long'),
      value: z.string().trim().min(1, 'Value is required').max(200, 'Value is too long'),
    }),
  ),
})

export type VariantFormValues = z.infer<typeof variantFormSchema>
