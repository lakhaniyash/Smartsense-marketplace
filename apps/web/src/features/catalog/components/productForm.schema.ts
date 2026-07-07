import { z } from 'zod'
import { ProductStatus } from '@lib/graphql/__generated__/graphql'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

// Validates user input before a mutation is even sent — a UX optimization,
// not the security/correctness boundary (that's class-validator on the
// generated Input DTO, server-side). Kept beside ProductForm per
// docs/architecture.md § Forms. Empty optional fields map to `undefined`
// at the submit-handler boundary, never sent as `''` to the mutation.
const baseProductFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  categoryId: z.string().uuid('Select a valid category'),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  brand: z.string().trim().max(100, 'Brand is too long').optional(),
  // `sku`/`price` seed the Product's initial default ProductVariant and are
  // only ever shown/required in create mode — editing them afterward goes
  // through Variant management (VariantFormDrawer), not this form, since a
  // Product can have more than one Variant. `status` is the inverse: only
  // shown/submitted in edit mode, since a new Product always starts DRAFT
  // (docs/domain-model.md § Catalog Management).
  sku: z.string().trim().max(64, 'SKU is too long').optional(),
  price: z.string().trim().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
})

// `mode` decides which of sku/price are actually required — buildProductFormSchema(mode)
// so ProductForm can select the right validation without two near-duplicate schemas.
export function buildProductFormSchema(mode: 'create' | 'edit') {
  return baseProductFormSchema.superRefine((values, ctx) => {
    if (mode !== 'create') return

    if (values.sku === undefined || values.sku === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sku'], message: 'SKU is required' })
    }

    if (values.price === undefined || values.price === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Price is required' })
    } else if (!DECIMAL_PATTERN.test(values.price) || Number(values.price) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Price must be a positive number (up to 2 decimal places)',
      })
    }
  })
}

export type ProductFormValues = z.infer<typeof baseProductFormSchema>
