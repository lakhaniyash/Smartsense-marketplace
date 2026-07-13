import { describe, expect, it } from 'vitest'
import { CustomerType } from '@lib/graphql/__generated__/graphql'
import { customerFormSchema } from './customerForm.schema'

describe('customerFormSchema', () => {
  const validInput = {
    displayName: 'Acme Corp',
    type: CustomerType.Organization,
    billingEmail: 'yash.lakhani+acme@smartsensesolutions.com',
  }

  it('accepts a valid customer', () => {
    const result = customerFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects a blank display name', () => {
    const result = customerFormSchema.safeParse({ ...validInput, displayName: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a display name over 200 characters', () => {
    const result = customerFormSchema.safeParse({ ...validInput, displayName: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects a type outside the CustomerType enum', () => {
    const result = customerFormSchema.safeParse({ ...validInput, type: 'NOT_A_TYPE' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid billing email', () => {
    const result = customerFormSchema.safeParse({ ...validInput, billingEmail: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from display name and billing email', () => {
    const result = customerFormSchema.safeParse({
      ...validInput,
      displayName: '  Acme Corp  ',
      billingEmail: '  yash.lakhani+acme@smartsensesolutions.com  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayName).toBe('Acme Corp')
      expect(result.data.billingEmail).toBe('yash.lakhani+acme@smartsensesolutions.com')
    }
  })
})
