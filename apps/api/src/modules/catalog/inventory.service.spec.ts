import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma, ProductVariantStatus, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { InventoryAdjustmentType } from './dto/inventory-adjustment-type.enum'
import { InventoryService } from './inventory.service'

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'Test User',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions: ['catalog:write'],
    partnerId: 'partner-1',
    customerId: null,
    ...overrides,
  }
}

function variantFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'variant-1',
    productId: 'product-1',
    partnerId: 'partner-1',
    sku: 'SKU-1',
    attributes: {},
    price: new Prisma.Decimal(19.99),
    status: ProductVariantStatus.ACTIVE,
    isDefault: true,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    inventory: {
      quantityOnHand: 10,
      quantityReserved: 2,
      reorderThreshold: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    ...overrides,
  }
}

describe('InventoryService', () => {
  let service: InventoryService
  let prisma: {
    productVariant: { findFirst: jest.Mock; findUniqueOrThrow: jest.Mock; update: jest.Mock }
    inventory: { update: jest.Mock }
    $transaction: jest.Mock
  }

  beforeEach(() => {
    prisma = {
      productVariant: { findFirst: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
      inventory: { update: jest.fn() },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    service = new InventoryService(prisma as never)
  })

  it('throws NOT_FOUND when the variant does not belong to the caller', async () => {
    prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture({ partnerId: 'other' }))

    await expect(
      service.adjustInventory(user(), {
        productVariantId: 'variant-1',
        adjustmentType: InventoryAdjustmentType.INCREASE,
        quantity: 5,
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('increases quantityOnHand and recomputes status to ACTIVE', async () => {
    prisma.productVariant.findFirst.mockResolvedValueOnce(
      variantFixture({
        inventory: { quantityOnHand: 0, quantityReserved: 0, reorderThreshold: null },
      }),
    )
    prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(variantFixture())

    await service.adjustInventory(user(), {
      productVariantId: 'variant-1',
      adjustmentType: InventoryAdjustmentType.INCREASE,
      quantity: 10,
    })

    expect(prisma.inventory.update).toHaveBeenCalledWith({
      where: { productVariantId: 'variant-1' },
      data: { quantityOnHand: 10 },
    })
    expect(prisma.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'variant-1' },
      data: { status: ProductVariantStatus.ACTIVE },
    })
  })

  it('decreasing to zero recomputes status to OUT_OF_STOCK', async () => {
    prisma.productVariant.findFirst.mockResolvedValueOnce(
      variantFixture({
        inventory: { quantityOnHand: 5, quantityReserved: 0, reorderThreshold: null },
      }),
    )
    prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(
      variantFixture({ status: ProductVariantStatus.OUT_OF_STOCK }),
    )

    await service.adjustInventory(user(), {
      productVariantId: 'variant-1',
      adjustmentType: InventoryAdjustmentType.DECREASE,
      quantity: 5,
    })

    expect(prisma.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'variant-1' },
      data: { status: ProductVariantStatus.OUT_OF_STOCK },
    })
  })

  it('SET replaces quantityOnHand outright', async () => {
    prisma.productVariant.findFirst.mockResolvedValueOnce(
      variantFixture({
        inventory: { quantityOnHand: 5, quantityReserved: 0, reorderThreshold: null },
      }),
    )
    prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(variantFixture())

    await service.adjustInventory(user(), {
      productVariantId: 'variant-1',
      adjustmentType: InventoryAdjustmentType.SET,
      quantity: 100,
    })

    expect(prisma.inventory.update).toHaveBeenCalledWith({
      where: { productVariantId: 'variant-1' },
      data: { quantityOnHand: 100 },
    })
  })

  it('rejects a DECREASE that would go negative', async () => {
    prisma.productVariant.findFirst.mockResolvedValueOnce(
      variantFixture({
        inventory: { quantityOnHand: 3, quantityReserved: 0, reorderThreshold: null },
      }),
    )

    await expect(
      service.adjustInventory(user(), {
        productVariantId: 'variant-1',
        adjustmentType: InventoryAdjustmentType.DECREASE,
        quantity: 5,
      }),
    ).rejects.toThrow(BadRequestException)
    expect(prisma.inventory.update).not.toHaveBeenCalled()
  })

  it('rejects a result that would drop stock below the reserved quantity', async () => {
    prisma.productVariant.findFirst.mockResolvedValueOnce(
      variantFixture({
        inventory: { quantityOnHand: 10, quantityReserved: 8, reorderThreshold: null },
      }),
    )

    await expect(
      service.adjustInventory(user(), {
        productVariantId: 'variant-1',
        adjustmentType: InventoryAdjustmentType.SET,
        quantity: 5,
      }),
    ).rejects.toThrow(BadRequestException)
    expect(prisma.inventory.update).not.toHaveBeenCalled()
  })

  it('never recomputes status for a DISCONTINUED variant', async () => {
    prisma.productVariant.findFirst.mockResolvedValueOnce(
      variantFixture({
        status: ProductVariantStatus.DISCONTINUED,
        inventory: { quantityOnHand: 5, quantityReserved: 0, reorderThreshold: null },
      }),
    )
    prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(
      variantFixture({ status: ProductVariantStatus.DISCONTINUED }),
    )

    await service.adjustInventory(user(), {
      productVariantId: 'variant-1',
      adjustmentType: InventoryAdjustmentType.SET,
      quantity: 0,
    })

    expect(prisma.productVariant.update).not.toHaveBeenCalled()
  })
})
