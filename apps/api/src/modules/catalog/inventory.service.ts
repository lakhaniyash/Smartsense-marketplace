import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
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

  /**
   * Increments `quantityReserved` for each item, within the caller's own
   * transaction (`tx`) — this method never opens its own, per
   * docs/api-conventions.md § Transactions ("only the outermost Service
   * method that owns the multi-step write opens $transaction"). Called by
   * OrdersService on the DRAFT→CONFIRMED transition (docs/domain-model.md
   * § Order Lifecycle: "inventory is decremented reserved→committed at
   * Confirmed, not at Draft"). Rejects if any item would exceed available
   * stock (`quantityOnHand - quantityReserved`) — the DB CHECK
   * `quantityReserved <= quantityOnHand` is a backstop, not the primary
   * validation.
   */
  async reserve(
    tx: Prisma.TransactionClient,
    items: Array<{ productVariantId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      await this.adjustReservation(tx, item.productVariantId, item.quantity)
    }
  }

  /**
   * Inverse of reserve() — decrements `quantityReserved` for each item, same
   * caller-owns-the-transaction contract. Called on any transition into
   * CANCELLED from a status that already reserved stock (CONFIRMED,
   * PROCESSING); a DRAFT→CANCELLED transition never reserved anything, so
   * OrdersService never calls this for it.
   */
  async release(
    tx: Prisma.TransactionClient,
    items: Array<{ productVariantId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      await this.adjustReservation(tx, item.productVariantId, -item.quantity)
    }
  }

  /**
   * Applies `delta` to `quantityReserved` as an optimistic compare-and-swap:
   * read the current value, compute the target, then write it back gated on
   * the row still holding the value just read (`updateMany`'s `where` can
   * carry that extra equality check; a unique-keyed `update` cannot). Two
   * concurrent callers reading the same starting value can no longer both
   * "win" — Postgres's row lock during the `UPDATE` serializes them, and the
   * loser's `where` no longer matches once the winner has committed, so it
   * retries against the now-current row instead of silently overwriting it.
   * Bounded at 5 attempts as a safety valve against pathological contention;
   * ordinary traffic never needs more than one.
   */
  private async adjustReservation(
    tx: Prisma.TransactionClient,
    productVariantId: string,
    delta: number,
  ): Promise<void> {
    const MAX_ATTEMPTS = 5
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { productVariantId } })
      const newQuantityReserved = Math.max(0, inventory.quantityReserved + delta)
      if (delta > 0 && newQuantityReserved > inventory.quantityOnHand) {
        throw new BadRequestException(
          `Insufficient available stock for product variant ${productVariantId}`,
        )
      }
      const { count } = await tx.inventory.updateMany({
        where: { productVariantId, quantityReserved: inventory.quantityReserved },
        data: { quantityReserved: newQuantityReserved },
      })
      if (count === 1) {
        return
      }
    }
    throw new ConflictException(
      `Could not update stock reservation for product variant ${productVariantId} — too many concurrent updates`,
    )
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
