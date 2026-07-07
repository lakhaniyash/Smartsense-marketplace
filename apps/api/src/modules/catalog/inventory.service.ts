import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, ProductVariantStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { AdjustInventoryInput } from './dto/adjust-inventory.input'
import { InventoryAdjustmentType } from './dto/inventory-adjustment-type.enum'
import { ProductVariantOutput } from './dto/product-variant.output'
import { mapVariantToOutput } from './mappers/product-variant.mapper'

const VARIANT_WITH_INVENTORY_INCLUDE = { inventory: true } satisfies Prisma.ProductVariantInclude

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adjusts a Variant's `quantityOnHand` and returns the updated Variant.
   * Rejects a result that would go negative or drop below the quantity
   * already reserved (docs/domain-model.md § Inventory) with a clear error —
   * the equivalent DB CHECK constraints remain a backstop, not the primary
   * validation (docs/api-conventions.md § Database Validation).
   *
   * `status` is recomputed here (never independently editable, per
   * docs/domain-model.md § Product Variant) unless the Variant is already
   * DISCONTINUED, which is terminal.
   */
  async adjustInventory(
    user: AuthenticatedUser,
    input: AdjustInventoryInput,
  ): Promise<ProductVariantOutput> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: input.productVariantId, deletedAt: null },
      include: VARIANT_WITH_INVENTORY_INCLUDE,
    })
    if (
      variant === null ||
      variant.inventory === null ||
      (user.partnerId !== null && variant.partnerId !== user.partnerId)
    ) {
      throw new NotFoundException('Product variant not found')
    }

    const newQuantityOnHand = this.computeNewQuantity(variant.inventory.quantityOnHand, input)
    if (newQuantityOnHand < 0) {
      throw new BadRequestException('Adjustment would result in negative stock')
    }
    if (newQuantityOnHand < variant.inventory.quantityReserved) {
      throw new BadRequestException('Cannot reduce stock below the quantity currently reserved')
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { productVariantId: variant.id },
        data: { quantityOnHand: newQuantityOnHand },
      })
      if (variant.status !== ProductVariantStatus.DISCONTINUED) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            status:
              newQuantityOnHand === 0
                ? ProductVariantStatus.OUT_OF_STOCK
                : ProductVariantStatus.ACTIVE,
          },
        })
      }
      return tx.productVariant.findUniqueOrThrow({
        where: { id: variant.id },
        include: VARIANT_WITH_INVENTORY_INCLUDE,
      })
    })

    return mapVariantToOutput(updated)
  }

  private computeNewQuantity(current: number, input: AdjustInventoryInput): number {
    switch (input.adjustmentType) {
      case InventoryAdjustmentType.INCREASE:
        return current + input.quantity
      case InventoryAdjustmentType.DECREASE:
        return current - input.quantity
      case InventoryAdjustmentType.SET:
        return input.quantity
    }
  }
}
