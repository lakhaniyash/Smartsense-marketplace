import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PartnerStatus, Prisma, ProductStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { CategoryOutput } from './dto/category.output'
import { CreateProductInput } from './dto/create-product.input'
import { ProductConnectionOutput, ProductEdgeOutput } from './dto/product-connection.output'
import { ProductFilterInput } from './dto/product-filter.input'
import { ProductSortField, SortDirection } from './dto/product-sort.enum'
import { ProductSortInput } from './dto/product-sort.input'
import { ProductOutput } from './dto/product.output'
import { UpdateProductInput } from './dto/update-product.input'

const DEFAULT_PAGE_SIZE = 20

// Internal placeholder only — ProductVariant.price is a required, non-null
// column, but this milestone's API deliberately never exposes price at all
// (Product Foundation defers pricing to M14/Billing, per the confirmed scope
// decision — see docs/milestones.md M12 and ProductOutput's description).
// Nothing reads this value; M14 replaces this write with a real price input.
const INTERNAL_VARIANT_PLACEHOLDER_PRICE = 0

const PRODUCT_LIST_INCLUDE = {
  category: true,
  // Every Product has exactly one internal ProductVariant, created and
  // maintained by this service (Variants/Inventory are not modeled in the
  // API this milestone — see ProductOutput's description). `take: 1` is
  // defensive, not load-bearing: nothing else can ever create a second one.
  variants: { take: 1 },
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>

export interface FindProductsArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: ProductFilterInput | undefined
  sort?: ProductSortInput | undefined
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

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
        cursor: { id: this.decodeCursor(after) },
        skip: 1,
      }),
      include: PRODUCT_LIST_INCLUDE,
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: ProductEdgeOutput[] = page.map((product) => ({
      cursor: this.encodeCursor(product.id),
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
      include: PRODUCT_LIST_INCLUDE,
    })

    // Ownership miss reads as NOT_FOUND, never FORBIDDEN — an id outside the
    // caller's scope must be indistinguishable from one that doesn't exist
    // (docs/authorization.md § Ownership Rules).
    if (product === null || (user.partnerId !== null && product.partnerId !== user.partnerId)) {
      throw new NotFoundException('Product not found')
    }

    return this.mapProductToOutput(product)
  }

  /**
   * Creates a Product owned by the caller's own Partner, transactionally
   * alongside its internal singleton ProductVariant + zero-quantity
   * Inventory row (docs/domain-model.md: "even a product with no real
   * variation... still has exactly one ProductVariant row"). Ownership is
   * never client-supplied — it's always the caller's own partnerId
   * (docs/authorization.md § Ownership Rules).
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
            price: INTERNAL_VARIANT_PLACEHOLDER_PRICE,
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
   * A supplied `sku` updates the internal singleton variant, not the Product.
   */
  async updateProduct(user: AuthenticatedUser, input: UpdateProductInput): Promise<ProductOutput> {
    const existing = await this.prisma.product.findFirst({
      where: { id: input.id, deletedAt: null },
    })
    if (existing === null || (user.partnerId !== null && existing.partnerId !== user.partnerId)) {
      throw new NotFoundException('Product not found')
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
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
        if (input.sku !== undefined) {
          await tx.productVariant.updateMany({
            where: { productId: input.id },
            data: { sku: input.sku },
          })
        }
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

    await this.prisma.product.update({ where: { id }, data: { status: ProductStatus.ARCHIVED } })
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

    if (user.partnerId !== null) where.partnerId = user.partnerId
    if (filter?.status !== undefined) where.status = filter.status
    if (filter?.categoryId !== undefined) where.categoryId = filter.categoryId
    if (filter?.search !== undefined && filter.search.trim() !== '') {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: filter.search, mode: 'insensitive' } } } },
      ]
    }

    return where
  }

  private buildOrderBy(sort: ProductSortInput | undefined): Prisma.ProductOrderByWithRelationInput {
    const direction = sort?.direction === SortDirection.ASC ? 'asc' : 'desc'
    if (sort?.field === ProductSortField.NAME) return { title: direction }
    return { createdAt: direction }
  }

  private mapProductToOutput(product: ProductWithRelations): ProductOutput {
    const [variant] = product.variants
    if (variant === undefined) {
      // Fail loud: every Product this service creates gets exactly one
      // variant in the same transaction (see createProduct) — a Product
      // with none means that invariant was violated, not a normal miss.
      throw new Error(`Product ${product.id} has no internal ProductVariant`)
    }
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      brand: product.brand,
      sku: variant.sku,
      status: product.status,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        parentCategoryId: product.category.parentCategoryId,
        displayOrder: product.category.displayOrder,
      },
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
    }
  }

  private encodeCursor(id: string): string {
    return Buffer.from(id, 'utf8').toString('base64')
  }

  private decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('utf8')
  }
}
