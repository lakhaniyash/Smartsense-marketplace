import { Module } from '@nestjs/common'
import { CatalogResolver } from './catalog.resolver'
import { CatalogService } from './catalog.service'
import { InventoryService } from './inventory.service'
import { VariantResolver } from './variant.resolver'
import { VariantService } from './variant.service'

@Module({
  providers: [CatalogResolver, CatalogService, VariantResolver, VariantService, InventoryService],
  // InventoryService is consumed by OrdersModule for reservation on Order
  // confirmation/cancellation (M13) — cross-module calls go through the
  // owning module's exported service, never its internals (docs/folder-structure.md).
  exports: [InventoryService],
})
export class CatalogModule {}
