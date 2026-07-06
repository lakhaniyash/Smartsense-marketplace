import { describe, expect, it } from 'vitest'
import { buildCategoryOptions } from './buildCategoryOptions'

describe('buildCategoryOptions', () => {
  it('orders top-level categories before their children, indenting each depth level', () => {
    const options = buildCategoryOptions([
      { id: 'electronics', name: 'Electronics', parentCategoryId: null },
      { id: 'laptops', name: 'Computers & Laptops', parentCategoryId: 'electronics' },
      { id: 'home', name: 'Home & Kitchen', parentCategoryId: null },
    ])

    expect(options).toEqual([
      { value: 'electronics', label: 'Electronics' },
      { value: 'laptops', label: '— Computers & Laptops' },
      { value: 'home', label: 'Home & Kitchen' },
    ])
  })

  it('treats a missing parentCategoryId the same as null (top-level)', () => {
    const options = buildCategoryOptions([{ id: 'apparel', name: 'Apparel' }])

    expect(options).toEqual([{ value: 'apparel', label: 'Apparel' }])
  })

  it('returns an empty list for no categories', () => {
    expect(buildCategoryOptions([])).toEqual([])
  })
})
