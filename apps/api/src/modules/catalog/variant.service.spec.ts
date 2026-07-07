import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { Prisma, ProductVariantStatus, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { VariantService } from './variant.service'

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('mock', { code, clientVersion: '6.0.0' })
}

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
    isDefault: false,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    inventory: {
      quantityOnHand: 0,
      quantityReserved: 0,
      reorderThreshold: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    ...overrides,
  }
}

describe('VariantService', () => {
  let service: VariantService
  let prisma: {
    product: { findFirst: jest.Mock }
    productVariant: {
      findFirst: jest.Mock
      findUniqueOrThrow: jest.Mock
      create: jest.Mock
      update: jest.Mock
      updateMany: jest.Mock
      count: jest.Mock
    }
    inventory: { create: jest.Mock }
    $transaction: jest.Mock
  }

  beforeEach(() => {
    prisma = {
      product: { findFirst: jest.fn() },
      productVariant: {
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      inventory: { create: jest.fn() },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    service = new VariantService(prisma as never)
  })

  describe('createProductVariant', () => {
    const input = { productId: 'product-1', sku: 'NEW-SKU', price: '9.99' }

    it('throws NOT_FOUND when the product does not belong to the caller', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({
        id: 'product-1',
        partnerId: 'other-partner',
      })

      await expect(service.createProductVariant(user(), input)).rejects.toThrow(NotFoundException)
      expect(prisma.productVariant.create).not.toHaveBeenCalled()
    })

    it('creates the variant and its Inventory row, denormalizing partnerId from the Product', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: 'product-1', partnerId: 'partner-1' })
      prisma.productVariant.create.mockResolvedValueOnce({ id: 'variant-2' })
      prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(
        variantFixture({ id: 'variant-2' }),
      )

      await service.createProductVariant(user(), input)

      expect(prisma.productVariant.create).toHaveBeenCalledWith({
        data: {
          productId: 'product-1',
          partnerId: 'partner-1',
          sku: 'NEW-SKU',
          attributes: {},
          price: input.price,
          isDefault: false,
        },
      })
      expect(prisma.inventory.create).toHaveBeenCalledWith({
        data: { productVariantId: 'variant-2' },
      })
    })

    it('unsets the previous default before creating a new default variant', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: 'product-1', partnerId: 'partner-1' })
      prisma.productVariant.create.mockResolvedValueOnce({ id: 'variant-2' })
      prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(
        variantFixture({ id: 'variant-2' }),
      )

      await service.createProductVariant(user(), { ...input, isDefault: true })

      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
        where: { productId: 'product-1', isDefault: true },
        data: { isDefault: false },
      })
    })

    it('translates a duplicate SKU (P2002) into ConflictException', async () => {
      prisma.product.findFirst.mockResolvedValueOnce({ id: 'product-1', partnerId: 'partner-1' })
      prisma.productVariant.create.mockRejectedValueOnce(knownRequestError('P2002'))

      await expect(service.createProductVariant(user(), input)).rejects.toThrow(ConflictException)
    })
  })

  describe('updateProductVariant', () => {
    it('throws NOT_FOUND when the variant does not belong to the caller', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture({ partnerId: 'other' }))

      await expect(
        service.updateProductVariant(user(), { id: 'variant-1', sku: 'X' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('rejects setting status to anything other than DISCONTINUED', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture())

      await expect(
        service.updateProductVariant(user(), {
          id: 'variant-1',
          status: ProductVariantStatus.OUT_OF_STOCK,
        }),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.productVariant.update).not.toHaveBeenCalled()
    })

    it('allows setting status to DISCONTINUED', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture())
      prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(
        variantFixture({ status: ProductVariantStatus.DISCONTINUED }),
      )

      await service.updateProductVariant(user(), {
        id: 'variant-1',
        status: ProductVariantStatus.DISCONTINUED,
      })

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-1' },
        data: { status: ProductVariantStatus.DISCONTINUED },
      })
    })

    it('applies only the fields provided', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture())
      prisma.productVariant.findUniqueOrThrow.mockResolvedValueOnce(
        variantFixture({ sku: 'RENAMED' }),
      )

      await service.updateProductVariant(user(), { id: 'variant-1', sku: 'RENAMED' })

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-1' },
        data: { sku: 'RENAMED' },
      })
    })
  })

  describe('archiveProductVariant', () => {
    it('throws NOT_FOUND when the variant does not belong to the caller', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture({ partnerId: 'other' }))

      await expect(service.archiveProductVariant(user(), 'variant-1')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('rejects archiving the default variant', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture({ isDefault: true }))

      await expect(service.archiveProductVariant(user(), 'variant-1')).rejects.toThrow(
        BadRequestException,
      )
      expect(prisma.productVariant.update).not.toHaveBeenCalled()
    })

    it("rejects archiving a Product's only remaining variant", async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture({ isDefault: false }))
      prisma.productVariant.count.mockResolvedValueOnce(0)

      await expect(service.archiveProductVariant(user(), 'variant-1')).rejects.toThrow(
        BadRequestException,
      )
      expect(prisma.productVariant.update).not.toHaveBeenCalled()
    })

    it('soft-deletes a non-default variant when another remains', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture({ isDefault: false }))
      prisma.productVariant.count.mockResolvedValueOnce(1)
      prisma.productVariant.update.mockResolvedValueOnce(variantFixture({ deletedAt: new Date() }))

      await service.archiveProductVariant(user(), 'variant-1')

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-1' },
        data: { deletedAt: expect.any(Date) },
        include: { inventory: true },
      })
    })
  })

  describe('setDefaultProductVariant', () => {
    it('unsets the previous default and sets the new one in the same transaction', async () => {
      prisma.productVariant.findFirst.mockResolvedValueOnce(variantFixture())
      prisma.productVariant.update.mockResolvedValueOnce(variantFixture({ isDefault: true }))

      await service.setDefaultProductVariant(user(), 'variant-1')

      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
        where: { productId: 'product-1', isDefault: true },
        data: { isDefault: false },
      })
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-1' },
        data: { isDefault: true },
        include: { inventory: true },
      })
    })
  })
})
