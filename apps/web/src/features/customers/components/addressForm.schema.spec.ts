import { describe, expect, it } from 'vitest'
import { AddressType } from '@lib/graphql/__generated__/graphql'
import { addressFormSchema } from './addressForm.schema'

describe('addressFormSchema', () => {
  const validInput = {
    type: AddressType.Shipping,
    line1: '1 Market St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US',
    isDefault: false,
  }

  it('accepts a valid address', () => {
    const result = addressFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts an optional line2', () => {
    const result = addressFormSchema.safeParse({ ...validInput, line2: 'Suite 400' })
    expect(result.success).toBe(true)
  })

  it('rejects a blank line1', () => {
    const result = addressFormSchema.safeParse({ ...validInput, line1: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a blank city, state, postal code, or country', () => {
    expect(addressFormSchema.safeParse({ ...validInput, city: '' }).success).toBe(false)
    expect(addressFormSchema.safeParse({ ...validInput, state: '' }).success).toBe(false)
    expect(addressFormSchema.safeParse({ ...validInput, postalCode: '' }).success).toBe(false)
    expect(addressFormSchema.safeParse({ ...validInput, country: '' }).success).toBe(false)
  })

  it('rejects a type outside the AddressType enum', () => {
    const result = addressFormSchema.safeParse({ ...validInput, type: 'NOT_A_TYPE' })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from address fields', () => {
    const result = addressFormSchema.safeParse({ ...validInput, city: '  San Francisco  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.city).toBe('San Francisco')
    }
  })
})
