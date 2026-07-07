import { Module } from '@nestjs/common'
import { CatalogResolver } from './catalog.resolver'
import { CatalogService } from './catalog.service'
import { InventoryService } from './inventory.service'
import { VariantResolver } from './variant.resolver'
import { VariantService } from './variant.service'

@Module({
  providers: [CatalogResolver, CatalogService, VariantResolver, VariantService, InventoryService],
})
export class CatalogModule {}
