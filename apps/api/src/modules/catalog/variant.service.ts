import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, ProductVariantStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateProductVariantInput } from './dto/create-product-variant.input'
import { ProductVariantOutput } from './dto/product-variant.output'
import { UpdateProductVariantInput } from './dto/update-product-variant.input'
import { attributesToJson, mapVariantToOutput } from './mappers/product-variant.mapper'

const VARIANT_INCLUDE = { inventory: true } satisfies Prisma.ProductVariantInclude

@Injectable()
export class VariantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds a Variant to an existing Product owned by the caller. Setting
   * `isDefault: true` unsets the Product's previous default inside the same
   * transaction — the partial unique index (docs/database-schema.md) still
   * guards this at the database level.
   */
  async createProductVariant(
    user: AuthenticatedUser,
    input: CreateProductVariantInput,
  ): Promise<ProductVariantOutput> {
    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, deletedAt: null },
    })
    if (product === null || (user.partnerId !== null && product.partnerId !== user.partnerId)) {
      throw new NotFoundException('Product not found')
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        if (input.isDefault === true) {
          await tx.productVariant.updateMany({
            where: { productId: product.id, isDefault: true },
            data: { isDefault: false },
          })
        }
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            partnerId: product.partnerId,
            sku: input.sku,
            attributes: attributesToJson(input.attributes),
            price: input.price,
            isDefault: input.isDefault ?? false,
          },
        })
        await tx.inventory.create({ data: { productVariantId: variant.id } })
        return tx.productVariant.findUniqueOrThrow({
          where: { id: variant.id },
          include: VARIANT_INCLUDE,
        })
      })
      return mapVariantToOutput(created)
    } catch (error) {
      this.translatePrismaError(error)
    }
  }

  /**
   * Partial update. `status` may only be set to DISCONTINUED directly —
   * ACTIVE/OUT_OF_STOCK are derived from Inventory (docs/domain-model.md
   * § Product Variant) and are rejected here, not silently accepted.
   */
  async updateProductVariant(
    user: AuthenticatedUser,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariantOutput> {
    const existing = await this.findOwnedVariant(user, input.id)

    if (input.status !== undefined && input.status !== ProductVariantStatus.DISCONTINUED) {
      throw new BadRequestException(
        'status can only be set to DISCONTINUED directly; ACTIVE/OUT_OF_STOCK are derived from inventory',
      )
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (input.isDefault === true) {
          await tx.productVariant.updateMany({
            where: { productId: existing.productId, isDefault: true },
            data: { isDefault: false },
          })
        }
        await tx.productVariant.update({
          where: { id: input.id },
          data: {
            ...(input.sku !== undefined && { sku: input.sku }),
            ...(input.attributes !== undefined && {
              attributes: attributesToJson(input.attributes),
            }),
            ...(input.price !== undefined && { price: input.price }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
          },
        })
        return tx.productVariant.findUniqueOrThrow({
          where: { id: input.id },
          include: VARIANT_INCLUDE,
        })
      })
      return mapVariantToOutput(updated)
    } catch (error) {
      this.translatePrismaError(error)
    }
  }

  /**
   * Soft-deletes a Variant. Rejected if it is the Product's default (set a
   * new default first) or its only remaining non-deleted Variant — a
   * Product must always have at least one (docs/domain-model.md § Product).
   *
   * The "at least one remains" check and the archive write are one atomic
   * conditional `updateMany` — a separate count-then-update here would be
   * the same TOCTOU race the inventory reservation fix closes elsewhere
   * (two concurrent archives on a product's last two Variants could each
   * read "1 remaining" and both succeed). Expressing "a sibling Variant
   * exists" as a relation filter turns it into a single `EXISTS` subquery
   * inside one `UPDATE`, which Postgres evaluates and applies atomically —
   * no separate read step for a concurrent writer to race against.
   */
  async archiveProductVariant(user: AuthenticatedUser, id: string): Promise<ProductVariantOutput> {
    const existing = await this.findOwnedVariant(user, id)

    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot archive the default variant — set another variant as default first',
      )
    }

    const { count } = await this.prisma.productVariant.updateMany({
      where: {
        id,
        deletedAt: null,
        product: { variants: { some: { id: { not: id }, deletedAt: null } } },
      },
      data: { deletedAt: new Date() },
    })
    if (count === 0) {
      throw new BadRequestException('A Product must have at least one ProductVariant')
    }

    const archived = await this.prisma.productVariant.findUniqueOrThrow({
      where: { id },
      include: VARIANT_INCLUDE,
    })
    return mapVariantToOutput(archived)
  }

  /** Marks a Variant as its Product's default, unsetting the previous one. */
  async setDefaultProductVariant(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ProductVariantOutput> {
    const existing = await this.findOwnedVariant(user, id)

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.productVariant.updateMany({
        where: { productId: existing.productId, isDefault: true },
        data: { isDefault: false },
      })
      return tx.productVariant.update({
        where: { id },
        data: { isDefault: true },
        include: VARIANT_INCLUDE,
      })
    })
    return mapVariantToOutput(updated)
  }

  /**
   * Ownership derives from the caller's own provisioned organization, never
   * client input (docs/authorization.md § Ownership Rules). A mismatch or
   * missing row is NOT_FOUND, never FORBIDDEN.
   */
  private async findOwnedVariant(user: AuthenticatedUser, id: string) {
    const variant = await this.prisma.productVariant.findFirst({ where: { id, deletedAt: null } })
    if (variant === null || (user.partnerId !== null && variant.partnerId !== user.partnerId)) {
      throw new NotFoundException('Product variant not found')
    }
    return variant
  }

  private translatePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') throw new ConflictException('SKU already exists for this Partner')
      if (error.code === 'P2025') throw new NotFoundException('Product variant not found')
      if (error.code === 'P2003') throw new BadRequestException('Referenced product does not exist')
    }
    throw error
  }
}
