import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { PartnerStatus, Prisma, ProductStatus, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { CatalogService } from './catalog.service'
import { ProductSortField } from './dto/product-sort.enum'

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
    permissions: ['catalog:read'],
    partnerId: null,
    customerId: null,
    ...overrides,
  }
}

function variantFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'variant-1',
    sku: 'SKU-1',
    attributes: {},
    price: new Prisma.Decimal(19.99),
    status: 'ACTIVE',
    isDefault: true,
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

function productFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    partnerId: 'partner-1',
    categoryId: 'cat-1',
    title: 'Wireless Mouse',
    description: null,
    brand: null,
    status: ProductStatus.DRAFT,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    publishedAt: null,
    category: {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      parentCategoryId: null,
      displayOrder: 0,
    },
    variants: [variantFixture()],
    ...overrides,
  }
}

describe('CatalogService', () => {
  let service: CatalogService
  let prisma: {
    category: { findMany: jest.Mock }
    product: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock }
    productVariant: { create: jest.Mock; updateMany: jest.Mock }
    inventory: { create: jest.Mock }
    partner: { findUnique: jest.Mock }
    $transaction: jest.Mock
  }
  let auditLogService: { record: jest.Mock }

  beforeEach(() => {
    prisma = {
      category: { findMany: jest.fn() },
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productVariant: { create: jest.fn(), updateMany: jest.fn() },
      inventory: { create: jest.fn() },
      partner: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    }
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma))
    auditLogService = { record: jest.fn() }
    service = new CatalogService(prisma as never, auditLogService as never)
  })

  describe('getStatus', () => {
    it('reports the module as initialized', () => {
      expect(service.getStatus()).toBe('catalog module initialized')
    })
  })

  describe('findCategories', () => {
    it('queries only active, non-deleted categories ordered by displayOrder then name', async () => {
      prisma.category.findMany.mockResolvedValueOnce([])

      await service.findCategories()

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, parentCategoryId: true, displayOrder: true },
      })
    })

    it('returns the categories from Prisma unchanged', async () => {
      const categories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          parentCategoryId: null,
          displayOrder: 0,
        },
      ]
      prisma.category.findMany.mockResolvedValueOnce(categories)

      expect(await service.findCategories()).toEqual(categories)
    })
  })

  describe('findProducts', () => {
    it("scopes to the caller's own partnerId for a Partner-owned user", async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user({ partnerId: 'partner-1' }), {})

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, partnerId: 'partner-1' },
        }),
      )
    })

    it('does not scope by partnerId for a user with no owning organization (Admin)', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user({ partnerId: null }), {})

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      )
    })

    it('forces status: PUBLISHED for a Customer caller, ignoring a client-supplied status', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user({ partnerId: null, customerId: 'customer-1' }), {
        filter: { status: ProductStatus.DRAFT },
      })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, status: ProductStatus.PUBLISHED },
        }),
      )
    })

    it('maps status and categoryId filters onto the where clause', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user(), {
        filter: { status: ProductStatus.PUBLISHED, categoryId: 'cat-1' },
      })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ProductStatus.PUBLISHED,
            categoryId: 'cat-1',
          }),
        }),
      )
    })

    it('maps a non-blank search term to a title/SKU OR filter', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user(), { filter: { search: 'mouse' } })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'mouse', mode: 'insensitive' } },
              { variants: { some: { sku: { contains: 'mouse', mode: 'insensitive' } } } },
            ],
          }),
        }),
      )
    })

    it('ignores a blank search term', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user(), { filter: { search: '   ' } })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      )
    })

    it('defaults to sorting by createdAt descending', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user(), {})

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      )
    })

    it('sorts by title when NAME is requested, honoring direction', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])

      await service.findProducts(user(), {
        sort: { field: ProductSortField.NAME, direction: SortDirection.ASC },
      })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { title: 'asc' } }),
      )
    })

    it('requests one extra row to compute hasNextPage, and trims it from the page', async () => {
      const rows = [
        productFixture({ id: 'p1' }),
        productFixture({ id: 'p2' }),
        productFixture({ id: 'p3' }),
      ]
      prisma.product.findMany.mockResolvedValueOnce(rows)

      const result = await service.findProducts(user(), { first: 2 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 3 }))
      expect(result.edges).toHaveLength(2)
      expect(result.pageInfo.hasNextPage).toBe(true)
    })

    it('reports hasNextPage false when Prisma returns no extra row', async () => {
      prisma.product.findMany.mockResolvedValueOnce([productFixture()])

      const result = await service.findProducts(user(), { first: 20 })

      expect(result.pageInfo.hasNextPage).toBe(false)
      expect(result.pageInfo.startCursor).toBe(result.pageInfo.endCursor)
    })

    it('decodes the after cursor back to a plain id for Prisma', async () => {
      prisma.product.findMany.mockResolvedValueOnce([])
      const cursor = Buffer.from('product-1', 'utf8').toString('base64')

      await service.findProducts(user(), { after: cursor })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 'product-1' }, skip: 1 }),
      )
    })

    it('flattens the SKU from the default variant onto each node', async () => {
      prisma.product.findMany.mockResolvedValueOnce([
        productFixture({ variants: [variantFixture({ sku: 'ABC-123' })] }),
      ])

      const result = await service.findProducts(user(), {})

      expect(result.edges[0]?.node.sku).toBe('ABC-123')
      expect(result.edges[0]?.node.category.slug).toBe('electronics')
    })
  })

  describe('findProductById', () => {
    it('returns the mapped product when it exists and is visible to the caller', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(productFixture())

      const result = await service.findProductById(user({ partnerId: null }), 'product-1')

      expect(result.id).toBe('product-1')
      expect(result.sku).toBe('SKU-1')
    })

    it('throws NOT_FOUND when no product matches the id', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(null)

      await expect(service.findProductById(user(), 'missing')).rejects.toThrow(NotFoundException)
    })

    it("throws NOT_FOUND (never FORBIDDEN) when a Partner requests another Partner's product", async () => {
      prisma.product.findFirst.mockResolvedValueOnce(productFixture({ partnerId: 'other-partner' }))

      await expect(
        service.findProductById(user({ partnerId: 'partner-1' }), 'product-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it("allows a user with no owning organization (Admin) to fetch any partner's product", async () => {
      prisma.product.findFirst.mockResolvedValueOnce(productFixture({ partnerId: 'other-partner' }))

      await expect(
        service.findProductById(user({ partnerId: null }), 'product-1'),
      ).resolves.toMatchObject({ id: 'product-1' })
    })

    it('throws NOT_FOUND when a Customer requests an unpublished product by id', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(
        productFixture({ status: ProductStatus.DRAFT }),
      )

      await expect(
        service.findProductById(user({ partnerId: null, customerId: 'customer-1' }), 'product-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('allows a Customer to fetch a published product by id', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(
        productFixture({ status: ProductStatus.PUBLISHED }),
      )

      await expect(
        service.findProductById(user({ partnerId: null, customerId: 'customer-1' }), 'product-1'),
      ).resolves.toMatchObject({ id: 'product-1' })
    })

    it('fails loudly if a Product is missing its default variant', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(productFixture({ variants: [] }))

      await expect(service.findProductById(user(), 'product-1')).rejects.toThrow(
        'has no ProductVariant',
      )
    })
  })

  describe('createProduct', () => {
    const createInput = {
      title: 'New Mouse',
      categoryId: 'cat-1',
      sku: 'NEW-SKU',
      price: '19.99',
    }

    it('rejects a caller with no owning Partner', async () => {
      await expect(service.createProduct(user({ partnerId: null }), createInput)).rejects.toThrow(
        BadRequestException,
      )
      expect(prisma.partner.findUnique).not.toHaveBeenCalled()
    })

    it("rejects when the caller's Partner is not Active", async () => {
      prisma.partner.findUnique.mockResolvedValueOnce({ status: PartnerStatus.SUSPENDED })

      await expect(
        service.createProduct(user({ partnerId: 'partner-1' }), createInput),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.product.create).not.toHaveBeenCalled()
    })

    it('creates the Product, its default variant, and Inventory in one transaction', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce({ status: PartnerStatus.ACTIVE })
      prisma.product.create.mockResolvedValueOnce({ id: 'product-1' })
      prisma.productVariant.create.mockResolvedValueOnce({ id: 'variant-1' })
      prisma.product.findFirst.mockResolvedValueOnce(productFixture())

      await service.createProduct(user({ partnerId: 'partner-1' }), createInput)

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-1',
          categoryId: 'cat-1',
          title: 'New Mouse',
          description: null,
          brand: null,
        },
      })
      expect(prisma.productVariant.create).toHaveBeenCalledWith({
        data: {
          productId: 'product-1',
          partnerId: 'partner-1',
          sku: 'NEW-SKU',
          price: createInput.price,
          isDefault: true,
        },
      })
      expect(prisma.inventory.create).toHaveBeenCalledWith({
        data: { productVariantId: 'variant-1' },
      })
    })

    it('never derives partnerId from client input, only from the caller', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce({ status: PartnerStatus.ACTIVE })
      prisma.product.create.mockResolvedValueOnce({ id: 'product-1' })
      prisma.productVariant.create.mockResolvedValueOnce({ id: 'variant-1' })
      prisma.product.findFirst.mockResolvedValueOnce(productFixture())

      await service.createProduct(user({ partnerId: 'partner-1' }), {
        ...createInput,
        // @ts-expect-error -- CreateProductInput has no partnerId field; this
        // simulates a malicious/buggy client trying to smuggle one in anyway.
        partnerId: 'someone-elses-partner',
      })

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ partnerId: 'partner-1' }) }),
      )
    })

    it('translates a duplicate SKU (P2002) into ConflictException', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce({ status: PartnerStatus.ACTIVE })
      prisma.product.create.mockRejectedValueOnce(knownRequestError('P2002'))

      await expect(
        service.createProduct(user({ partnerId: 'partner-1' }), createInput),
      ).rejects.toThrow(ConflictException)
    })

    it('translates an invalid category (P2003) into BadRequestException', async () => {
      prisma.partner.findUnique.mockResolvedValueOnce({ status: PartnerStatus.ACTIVE })
      prisma.product.create.mockRejectedValueOnce(knownRequestError('P2003'))

      await expect(
        service.createProduct(user({ partnerId: 'partner-1' }), createInput),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('updateProduct', () => {
    it('throws NOT_FOUND when the product does not belong to the caller', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(productFixture({ partnerId: 'other-partner' }))

      await expect(
        service.updateProduct(user({ partnerId: 'partner-1' }), { id: 'product-1', title: 'x' }),
      ).rejects.toThrow(NotFoundException)
      expect(prisma.product.update).not.toHaveBeenCalled()
    })

    it('applies only the fields provided, leaving others untouched', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce(productFixture())
        .mockResolvedValueOnce(productFixture())

      await service.updateProduct(user({ partnerId: 'partner-1' }), {
        id: 'product-1',
        title: 'Renamed Mouse',
      })

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { title: 'Renamed Mouse' },
      })
    })

    it('stamps publishedAt when the status transitions to PUBLISHED', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce(productFixture())
        .mockResolvedValueOnce(productFixture())

      await service.updateProduct(user({ partnerId: 'partner-1' }), {
        id: 'product-1',
        status: ProductStatus.PUBLISHED,
      })

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { status: ProductStatus.PUBLISHED, publishedAt: expect.any(Date) },
      })
    })

    it('translates a duplicate SKU (P2002) into ConflictException', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(productFixture())
      prisma.product.update.mockRejectedValueOnce(knownRequestError('P2002'))

      await expect(
        service.updateProduct(user({ partnerId: 'partner-1' }), { id: 'product-1', title: 'x' }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('archiveProduct', () => {
    it('throws NOT_FOUND when the product does not belong to the caller', async () => {
      prisma.product.findFirst.mockResolvedValueOnce(productFixture({ partnerId: 'other-partner' }))

      await expect(
        service.archiveProduct(user({ partnerId: 'partner-1' }), 'product-1'),
      ).rejects.toThrow(NotFoundException)
      expect(prisma.product.update).not.toHaveBeenCalled()
    })

    it('transitions status to ARCHIVED and records an audit log entry, atomically', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce(productFixture())
        .mockResolvedValueOnce(productFixture({ status: ProductStatus.ARCHIVED }))

      await service.archiveProduct(user({ partnerId: 'partner-1' }), 'product-1')

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { status: ProductStatus.ARCHIVED },
      })
      expect(auditLogService.record).toHaveBeenCalledWith(prisma, {
        actorUserId: 'user-1',
        action: 'PRODUCT_ARCHIVED',
        entityType: 'Product',
        entityId: 'product-1',
        metadata: { title: 'Wireless Mouse' },
      })
    })
  })
})
