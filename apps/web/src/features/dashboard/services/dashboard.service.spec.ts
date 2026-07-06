import { describe, expect, it } from 'vitest'
import { buildQuickActions, buildStatCards, canViewRevenuePlaceholder } from './dashboard.service'

const STATS = { totalProducts: 128, totalOrders: 342, totalCustomers: 56 }

describe('dashboard.service', () => {
  describe('buildStatCards', () => {
    it('includes only cards the caller has permission for', () => {
      const can = (permission: string) => permission === 'catalog:read'

      const cards = buildStatCards(STATS, can)

      expect(cards).toEqual([
        expect.objectContaining({ key: 'totalProducts', value: 128, permission: 'catalog:read' }),
      ])
    })

    it('returns all cards for a caller with every permission', () => {
      const cards = buildStatCards(STATS, () => true)

      expect(cards.map((card) => card.key)).toEqual([
        'totalProducts',
        'totalOrders',
        'totalCustomers',
      ])
      expect(cards.map((card) => card.value)).toEqual([128, 342, 56])
    })

    it('returns no cards for a caller with no permissions', () => {
      expect(buildStatCards(STATS, () => false)).toEqual([])
    })
  })

  describe('buildQuickActions', () => {
    it('filters quick actions by permission', () => {
      const can = (permission: string) => permission === 'orders:read'

      const actions = buildQuickActions(can)

      expect(actions).toHaveLength(1)
      expect(actions[0]).toMatchObject({ key: 'orders', permission: 'orders:read' })
    })
  })

  describe('canViewRevenuePlaceholder', () => {
    it('is true only when the caller holds billing:read', () => {
      expect(canViewRevenuePlaceholder((permission) => permission === 'billing:read')).toBe(true)
      expect(canViewRevenuePlaceholder(() => false)).toBe(false)
    })
  })
})
