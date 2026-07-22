import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PartnerStatus, Prisma, ProductStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { SortDirection } from '../../common/graphql/sort-direction.enum'
import { AuditLogService } from '../../common/services/audit-log.service'
import { decodeCursor, encodeCursor } from '../../common/utils/cursor.util'
import { CategoryOutput } from './dto/category.output'
import { CreateProductInput } from './dto/create-product.input'
import { ProductConnectionOutput, ProductEdgeOutput } from './dto/product-connection.output'
import { ProductFilterInput } from './dto/product-filter.input'
import { ProductSortField } from './dto/product-sort.enum'
import { ProductSortInput } from './dto/product-sort.input'
import { ProductOutput } from './dto/product.output'
import { UpdateProductInput } from './dto/update-product.input'
import { mapVariantToOutput } from './mappers/product-variant.mapper'

const DEFAULT_PAGE_SIZE = 20

const PRODUCT_INCLUDE = {
  category: true,
  // Every Product has at least one ProductVariant (docs/domain-model.md
  // § Product Variant); the default one surfaces as ProductOutput.sku, the
  // full list as ProductOutput.variants. Soft-deleted Variants are excluded.
  variants: {
    where: { deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    include: { inventory: true },
  },
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>

export interface FindProductsArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: ProductFilterInput | undefined
  sort?: ProductSortInput | undefined
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  getStatus(): string {
    return 'catalog module initialized'
  }

  /** Active categories in the global taxonomy, flat — see CategoryOutput. */
  findCategories(): Promise<CategoryOutput[]> {
    return this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, parentCategoryId: true, displayOrder: true },
    })
  }

  async findProducts(
    user: AuthenticatedUser,
    args: FindProductsArgs,
  ): Promise<ProductConnectionOutput> {
    // A nullable GraphQL arg an untyped/JS client omits commonly arrives as
    // `null`, not `undefined` (TypeScript clients under exactOptionalPropertyTypes
    // send `null` explicitly rather than omitting the key) — normalize once here
    // so the rest of this method only ever reasons about "cursor present or not."
    const after = args.after ?? undefined

    const first = args.first ?? DEFAULT_PAGE_SIZE
    const where = this.buildWhere(user, args.filter)
    const orderBy = this.buildOrderBy(args.sort)

    const rows = await this.prisma.product.findMany({
      where,
      orderBy,
      take: first + 1,
      ...(after !== undefined && {
        cursor: { id: decodeCursor(after) },
        skip: 1,
      }),
      include: PRODUCT_INCLUDE,
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: ProductEdgeOutput[] = page.map((product) => ({
      cursor: encodeCursor(product.id),
      node: this.mapProductToOutput(product),
    }))

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: after !== undefined,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    }
  }

  async findProductById(user: AuthenticatedUser, id: string): Promise<ProductOutput> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: PRODUCT_INCLUDE,
    })

    // Ownership miss reads as NOT_FOUND, never FORBIDDEN — an id outside the
    // caller's scope must be indistinguishable from one that doesn't exist
    // (docs/authorization.md § Ownership Rules). For a Customer (no owning
    // Partner) that floor is publish status, not ownership: an unpublished
    // product is invisible to them by direct id lookup too, the same as it
    // is via findProducts' buildWhere.
    if (
      product === null ||
      (user.partnerId !== null && product.partnerId !== user.partnerId) ||
      (user.partnerId === null &&
        user.customerId !== null &&
        product.status !== ProductStatus.PUBLISHED)
    ) {
      throw new NotFoundException('Product not found')
    }

    return this.mapProductToOutput(product)
  }

  /**
   * Creates a Product owned by the caller's own Partner, transactionally
   * alongside its initial, default ProductVariant + zero-quantity Inventory
   * row (docs/domain-model.md: "even a product with no real variation...
   * still has exactly one ProductVariant row"). Further Variants are added
   * via createProductVariant. Ownership is never client-supplied — it's
   * always the caller's own partnerId (docs/authorization.md § Ownership Rules).
   */
  async createProduct(user: AuthenticatedUser, input: CreateProductInput): Promise<ProductOutput> {
    const partnerId = user.partnerId
    if (partnerId === null) {
      throw new BadRequestException('Only a Partner-scoped user can create a product')
    }

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } })
    if (partner === null || partner.status !== PartnerStatus.ACTIVE) {
      // docs/domain-model.md § Partner: "cannot list Products... while status != Active."
      throw new BadRequestException('Partner must be Active to create products')
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            partnerId,
            categoryId: input.categoryId,
            title: input.title,
            description: input.description ?? null,
            brand: input.brand ?? null,
          },
        })
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            partnerId,
            sku: input.sku,
            price: input.price,
            isDefault: true,
          },
        })
        await tx.inventory.create({ data: { productVariantId: variant.id } })
        return product
      })
      return await this.findProductById(user, created.id)
    } catch (error) {
      this.translatePrismaError(error)
    }
  }

  /**
   * Partial update. Ownership is verified before any write, in the same
   * method as the write itself (docs/authorization.md § Ownership Rules).
   * SKU/price/variant-level fields are managed via VariantService, not here.
   */
  async updateProduct(user: AuthenticatedUser, input: UpdateProductInput): Promise<ProductOutput> {
    const existing = await this.prisma.product.findFirst({
      where: { id: input.id, deletedAt: null },
    })
    if (existing === null || (user.partnerId !== null && existing.partnerId !== user.partnerId)) {
      throw new NotFoundException('Product not found')
    }

    try {
      await this.prisma.product.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.brand !== undefined && { brand: input.brand }),
          ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
          ...(input.status !== undefined && {
            status: input.status,
            ...(input.status === ProductStatus.PUBLISHED && { publishedAt: new Date() }),
          }),
        },
      })
    } catch (error) {
      this.translatePrismaError(error)
    }

    return this.findProductById(user, input.id)
  }

  /**
   * "Delete Product" per the product requirement — implemented as the
   * ARCHIVED status transition, not a row/soft-delete
   * (docs/domain-model.md § Product: "Archiving a Product archives
   * visibility only"; docs/api-conventions.md's naming convention reserves
   * `delete` for genuinely hard-deletable rows).
   */
  async archiveProduct(user: AuthenticatedUser, id: string): Promise<ProductOutput> {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null } })
    if (existing === null || (user.partnerId !== null && existing.partnerId !== user.partnerId)) {
      throw new NotFoundException('Product not found')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } })
      await this.auditLogService.record(tx, {
        actorUserId: user.id,
        action: 'PRODUCT_ARCHIVED',
        entityType: 'Product',
        entityId: id,
        metadata: { title: existing.title },
      })
    })
    return this.findProductById(user, id)
  }

  private translatePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') throw new ConflictException('SKU already exists for this Partner')
      if (error.code === 'P2025') throw new NotFoundException('Product not found')
      if (error.code === 'P2003')
        throw new BadRequestException('Referenced category does not exist')
    }
    throw error
  }

  /**
   * Ownership derives from the caller's own provisioned organization, never
   * a role-name check (docs/authorization.md § Ownership Rules) — a user
   * with no owning Partner (Admin's ownerType is NONE) sees every Partner's
   * catalog; a Partner-scoped user sees only their own.
   */
  private buildWhere(
    user: AuthenticatedUser,
    filter: ProductFilterInput | undefined,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { deletedAt: null }

    // Every ProductFilterInput field is `nullable: true` in the GraphQL
    // schema, so a well-formed client (not just one under
    // exactOptionalPropertyTypes) can legitimately send `null` rather than
    // omitting the key — `?? undefined` normalizes both to "not provided"
    // once, here, rather than every branch re-deriving it (same reasoning as
    // findProducts' `after` normalization above). Skipping this crashed on
    // `filter.search.trim()` when `search` arrived as `null`.
    const status = filter?.status ?? undefined
    const categoryId = filter?.categoryId ?? undefined
    const search = filter?.search ?? undefined

    if (user.partnerId !== null) {
      // Partner: scoped to their own catalog, any status (they can browse
      // their own Drafts) — unchanged from before.
      where.partnerId = user.partnerId
      if (status !== undefined) where.status = status
    } else if (user.customerId !== null) {
      // Customer: never scoped by ownership, but a client-supplied status
      // is ignored rather than trusted — a Customer only ever sees the
      // published catalog, never Draft/Archived by requesting it directly
      // (docs/authorization.md § Ownership Rules).
      where.status = ProductStatus.PUBLISHED
    } else if (status !== undefined) {
      // Admin (no partnerId, no customerId): unrestricted, same explicit
      // status filter support as a Partner gets for their own catalog.
      where.status = status
    }
    if (categoryId !== undefined) where.categoryId = categoryId
    if (search !== undefined && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    return where
  }

  // `id` breaks ties: two rows sharing the exact same title/createdAt could
  // otherwise skip or repeat across cursor-paginated pages, since Prisma's
  // cursor pagination requires orderBy to fully determine a total order.
  private buildOrderBy(
    sort: ProductSortInput | undefined,
  ): Prisma.ProductOrderByWithRelationInput[] {
    const direction = sort?.direction === SortDirection.ASC ? 'asc' : 'desc'
    if (sort?.field === ProductSortField.NAME) return [{ title: direction }, { id: 'asc' }]
    return [{ createdAt: direction }, { id: 'asc' }]
  }

  private mapProductToOutput(product: ProductWithRelations): ProductOutput {
    const defaultVariant =
      product.variants.find((variant) => variant.isDefault) ?? product.variants[0]
    if (defaultVariant === undefined) {
      // Fail loud: every Product this service creates gets a default variant
      // in the same transaction (see createProduct), and archiveProductVariant
      // refuses to remove a Product's last one — a Product with none means
      // that invariant was violated, not a normal miss.
      throw new Error(`Product ${product.id} has no ProductVariant`)
    }
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      brand: product.brand,
      sku: defaultVariant.sku,
      status: product.status,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        parentCategoryId: product.category.parentCategoryId,
        displayOrder: product.category.displayOrder,
      },
      variants: product.variants.map(mapVariantToOutput),
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
    }
  }
}
