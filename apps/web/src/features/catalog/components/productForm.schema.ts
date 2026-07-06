import { z } from 'zod'
import { ProductStatus } from '@lib/graphql/__generated__/graphql'

// Validates user input before a mutation is even sent — a UX optimization,
// not the security/correctness boundary (that's class-validator on the
// generated Input DTO, server-side). Kept beside ProductForm per
// docs/architecture.md § Forms. Empty optional fields map to `undefined`
// at the submit-handler boundary, never sent as `''` to the mutation.
export const productFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  categoryId: z.string().min(1, 'Category is required'),
  sku: z.string().trim().min(1, 'SKU is required').max(64, 'SKU is too long'),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  brand: z.string().trim().max(100, 'Brand is too long').optional(),
  // Only ever shown/submitted in edit mode — a new Product always starts
  // DRAFT (docs/domain-model.md § Catalog Management), so create mode omits
  // this field from the rendered form entirely.
  status: z.nativeEnum(ProductStatus).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
