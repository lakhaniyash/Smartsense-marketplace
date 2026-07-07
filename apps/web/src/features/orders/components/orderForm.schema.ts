import { z } from 'zod'

const MAX_QUANTITY = 1_000_000

// An optional UUID text field: empty string means "not provided" (RHF gives
// '' for an untouched text input, never undefined) — see OrderFormPage's
// submit mapping, which already treats '' the same as omitted.
const optionalUuid = (message: string) =>
  z.union([z.literal(''), z.string().trim().uuid(message)]).optional()

// Validates before the mutation is sent — a UX optimization, not the
// security/correctness boundary (class-validator on CreateOrderInput,
// server-side, is that). Kept beside OrderForm per docs/architecture.md § Forms.
const orderItemSchema = z.object({
  productVariantId: z.string().uuid('Select a product'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Quantity is required')
    .refine(
      (value) =>
        Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= MAX_QUANTITY,
      { message: `Quantity must be a whole number between 1 and ${MAX_QUANTITY.toLocaleString()}` },
    ),
})

export const orderFormSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Add at least one item'),
  // No customer/address browse query exists yet (only Order-level ids are
  // exposed today) — these stay raw optional id inputs until a future
  // milestone adds one, same gap noted for shippingAddressId in the plan.
  customerId: optionalUuid('Customer ID must be a valid UUID'),
  shippingAddressId: optionalUuid('Shipping address ID must be a valid UUID'),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>
