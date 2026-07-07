import type { Inventory, Prisma, ProductVariant } from '@prisma/client'
import type { ProductVariantOutput } from '../dto/product-variant.output'

export type VariantWithInventory = ProductVariant & { inventory: Inventory | null }

// Shared by CatalogService (Product.variants) and VariantService/InventoryService
// (variant CRUD/adjustment) so the Prisma-row → GraphQL-type mapping exists in
// exactly one place (docs/coding-standards.md § 15: don't re-implement the same
// mapping in two services).
export function mapVariantToOutput(variant: VariantWithInventory): ProductVariantOutput {
  if (variant.inventory === null) {
    // Every ProductVariant gets its Inventory row created in the same
    // transaction as the Variant itself (docs/domain-model.md § Inventory) —
    // a variant with none means that invariant was violated, not a normal miss.
    throw new Error(`ProductVariant ${variant.id} has no Inventory row`)
  }

  const attributes = variant.attributes as Prisma.JsonObject

  return {
    id: variant.id,
    sku: variant.sku,
    attributes: Object.entries(attributes).map(([key, value]) => ({ key, value: String(value) })),
    price: variant.price,
    status: variant.status,
    isDefault: variant.isDefault,
    inventory: {
      quantityOnHand: variant.inventory.quantityOnHand,
      quantityReserved: variant.inventory.quantityReserved,
      sellableQuantity: variant.inventory.quantityOnHand - variant.inventory.quantityReserved,
      reorderThreshold: variant.inventory.reorderThreshold,
      updatedAt: variant.inventory.updatedAt,
    },
    createdAt: variant.createdAt,
  }
}

export function attributesToJson(
  attributes: Array<{ key: string; value: string }> | undefined,
): Prisma.JsonObject {
  if (attributes === undefined) return {}
  return Object.fromEntries(attributes.map((attribute) => [attribute.key, attribute.value]))
}
