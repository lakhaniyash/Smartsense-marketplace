import { describe, expect, it } from 'vitest'
import { orderFormSchema } from './orderForm.schema'

const VALID_VARIANT_ID = '11111111-1111-4111-8111-111111111111'
const VALID_CUSTOMER_ID = '22222222-2222-4222-8222-222222222222'

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ productVariantId: VALID_VARIANT_ID, quantity: '2' }],
    customerId: '',
    shippingAddressId: '',
    ...overrides,
  }
}

describe('orderFormSchema', () => {
  it('accepts a minimal valid order', () => {
    expect(orderFormSchema.safeParse(validInput()).success).toBe(true)
  })

  it('requires at least one item', () => {
    expect(orderFormSchema.safeParse(validInput({ items: [] })).success).toBe(false)
  })

  it('rejects a line item whose productVariantId is not a UUID (e.g. an unselected placeholder)', () => {
    const result = orderFormSchema.safeParse(
      validInput({ items: [{ productVariantId: '', quantity: '1' }] }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects a non-integer or non-positive quantity', () => {
    expect(
      orderFormSchema.safeParse(
        validInput({ items: [{ productVariantId: VALID_VARIANT_ID, quantity: '0' }] }),
      ).success,
    ).toBe(false)
    expect(
      orderFormSchema.safeParse(
        validInput({ items: [{ productVariantId: VALID_VARIANT_ID, quantity: '1.5' }] }),
      ).success,
    ).toBe(false)
  })

  it('rejects a quantity above the backend cap of 1,000,000', () => {
    const result = orderFormSchema.safeParse(
      validInput({ items: [{ productVariantId: VALID_VARIANT_ID, quantity: '1000001' }] }),
    )
    expect(result.success).toBe(false)
  })

  it('accepts a quantity at the backend cap', () => {
    const result = orderFormSchema.safeParse(
      validInput({ items: [{ productVariantId: VALID_VARIANT_ID, quantity: '1000000' }] }),
    )
    expect(result.success).toBe(true)
  })

  it('treats an empty customerId/shippingAddressId as "not provided"', () => {
    const result = orderFormSchema.safeParse(validInput({ customerId: '', shippingAddressId: '' }))
    expect(result.success).toBe(true)
  })

  it('accepts a valid customerId UUID', () => {
    const result = orderFormSchema.safeParse(validInput({ customerId: VALID_CUSTOMER_ID }))
    expect(result.success).toBe(true)
  })

  it('rejects a customerId that is not a UUID', () => {
    const result = orderFormSchema.safeParse(validInput({ customerId: 'not-a-uuid' }))
    expect(result.success).toBe(false)
  })

  it('rejects a shippingAddressId that is not a UUID', () => {
    const result = orderFormSchema.safeParse(validInput({ shippingAddressId: 'not-a-uuid' }))
    expect(result.success).toBe(false)
  })
})
