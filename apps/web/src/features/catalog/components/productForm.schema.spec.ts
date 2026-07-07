import { describe, expect, it } from 'vitest'
import { ProductStatus } from '@lib/graphql/__generated__/graphql'
import { buildProductFormSchema } from './productForm.schema'

describe('buildProductFormSchema', () => {
  describe('create mode', () => {
    const schema = buildProductFormSchema('create')
    const validInput = {
      title: 'Wireless Mouse',
      categoryId: '11111111-1111-4111-8111-111111111111',
      sku: 'SKU-1',
      price: '19.99',
    }

    it('accepts a minimal valid product', () => {
      const result = schema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('accepts optional description and brand', () => {
      const result = schema.safeParse({
        ...validInput,
        description: 'A great mouse',
        brand: 'Acme',
      })
      expect(result.success).toBe(true)
    })

    it('rejects a blank title', () => {
      const result = schema.safeParse({ ...validInput, title: '   ' })
      expect(result.success).toBe(false)
    })

    it('rejects a missing category', () => {
      const result = schema.safeParse({ ...validInput, categoryId: '' })
      expect(result.success).toBe(false)
    })

    it('rejects a category id that is not a UUID', () => {
      const result = schema.safeParse({ ...validInput, categoryId: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('rejects a blank SKU', () => {
      const result = schema.safeParse({ ...validInput, sku: '  ' })
      expect(result.success).toBe(false)
    })

    it('rejects a missing price', () => {
      const result = schema.safeParse({ ...validInput, price: undefined })
      expect(result.success).toBe(false)
    })

    it('rejects a zero or negative price', () => {
      expect(schema.safeParse({ ...validInput, price: '0' }).success).toBe(false)
      expect(schema.safeParse({ ...validInput, price: '-5' }).success).toBe(false)
    })

    it('rejects a price with more than two decimal places', () => {
      const result = schema.safeParse({ ...validInput, price: '19.999' })
      expect(result.success).toBe(false)
    })

    it('accepts a price with up to two decimal places', () => {
      expect(schema.safeParse({ ...validInput, price: '19' }).success).toBe(true)
      expect(schema.safeParse({ ...validInput, price: '19.9' }).success).toBe(true)
      expect(schema.safeParse({ ...validInput, price: '19.99' }).success).toBe(true)
    })

    it('rejects a title over 200 characters', () => {
      const result = schema.safeParse({ ...validInput, title: 'x'.repeat(201) })
      expect(result.success).toBe(false)
    })

    it('trims whitespace from title and sku', () => {
      const result = schema.safeParse({
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
  })

  describe('edit mode', () => {
    const schema = buildProductFormSchema('edit')
    const validInput = {
      title: 'Wireless Mouse',
      categoryId: '11111111-1111-4111-8111-111111111111',
    }

    it('accepts a minimal valid product with no sku/price', () => {
      const result = schema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('accepts an optional status matching the ProductStatus enum', () => {
      const result = schema.safeParse({ ...validInput, status: ProductStatus.Published })
      expect(result.success).toBe(true)
    })

    it('rejects a status outside the ProductStatus enum', () => {
      const result = schema.safeParse({ ...validInput, status: 'NOT_A_STATUS' })
      expect(result.success).toBe(false)
    })
  })
})
