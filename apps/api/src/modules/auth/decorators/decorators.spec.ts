import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY, Public } from './public.decorator'
import { PERMISSIONS_KEY, Permissions } from './permissions.decorator'

describe('metadata decorators', () => {
  const reflector = new Reflector()

  it('@Public() sets isPublic metadata to true', () => {
    class Target {
      @Public()
      handler(): void {}
    }
    expect(reflector.get(IS_PUBLIC_KEY, new Target().handler)).toBe(true)
  })

  it('@Permissions() stores the declared permission keys', () => {
    class Target {
      @Permissions('catalog:write')
      handler(): void {}
    }
    expect(reflector.get(PERMISSIONS_KEY, new Target().handler)).toEqual(['catalog:write'])
  })
})
