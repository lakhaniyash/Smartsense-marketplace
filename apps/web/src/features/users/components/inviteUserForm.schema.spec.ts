import { describe, expect, it } from 'vitest'
import { UserOwnerType } from '@lib/graphql/__generated__/graphql'
import { inviteUserFormSchema } from './inviteUserForm.schema'

const UUID = '11111111-1111-1111-1111-111111111111'
const base = {
  email: 'yash.lakhani+invitee@smartsensesolutions.com',
  fullName: 'Riley Morgan',
  partnerId: '',
  customerId: '',
}

describe('inviteUserFormSchema', () => {
  it('accepts a platform-staff (NONE) user with no org ids', () => {
    const result = inviteUserFormSchema.safeParse({ ...base, ownerType: UserOwnerType.None })
    expect(result.success).toBe(true)
  })

  it('rejects a PARTNER user with no partnerId', () => {
    const result = inviteUserFormSchema.safeParse({ ...base, ownerType: UserOwnerType.Partner })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'partnerId')).toBe(true)
    }
  })

  it('accepts a PARTNER user with a valid partnerId', () => {
    const result = inviteUserFormSchema.safeParse({
      ...base,
      ownerType: UserOwnerType.Partner,
      partnerId: UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a NONE user that carries a partnerId', () => {
    const result = inviteUserFormSchema.safeParse({
      ...base,
      ownerType: UserOwnerType.None,
      partnerId: UUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email', () => {
    const result = inviteUserFormSchema.safeParse({
      ...base,
      email: 'not-an-email',
      ownerType: UserOwnerType.None,
    })
    expect(result.success).toBe(false)
  })
})
