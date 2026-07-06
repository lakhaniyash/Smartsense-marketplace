import { describe, expect, it } from 'vitest'
import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { productFormSchema } from './productForm.schema'

describe('productFormSchema', () => {
  const validInput = {
    title: 'Wireless Mouse',
    categoryId: 'cat-1',
    sku: 'SKU-1',
  }

  it('accepts a minimal valid product', () => {
    const result = productFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts optional description and brand', () => {
    const result = productFormSchema.safeParse({
      ...validInput,
      description: 'A great mouse',
      brand: 'Acme',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a blank title', () => {
    const result = productFormSchema.safeParse({ ...validInput, title: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing category', () => {
    const result = productFormSchema.safeParse({ ...validInput, categoryId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a blank SKU', () => {
    const result = productFormSchema.safeParse({ ...validInput, sku: '  ' })
    expect(result.success).toBe(false)
  })

  it('rejects a title over 200 characters', () => {
    const result = productFormSchema.safeParse({ ...validInput, title: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from title and sku', () => {
    const result = productFormSchema.safeParse({
      ...validInput,
      title: '  Wireless Mouse  ',
      sku: '  SKU-1  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Wireless Mouse')
      expect(result.data.sku).toBe('SKU-1')
    }
  })

  it('accepts an optional status matching the ProductStatus enum', () => {
    const result = productFormSchema.safeParse({ ...validInput, status: ProductStatus.Published })
    expect(result.success).toBe(true)
  })

  it('rejects a status outside the ProductStatus enum', () => {
    const result = productFormSchema.safeParse({ ...validInput, status: 'NOT_A_STATUS' })
    expect(result.success).toBe(false)
  })
})
