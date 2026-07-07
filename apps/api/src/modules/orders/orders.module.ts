import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { OrderEventsListener } from './listeners/order-events.listener'
import { OrdersResolver } from './orders.resolver'
import { OrdersService } from './orders.service'

@Module({
  // CatalogModule is imported for its exported InventoryService — inventory
  // reservation on Order confirmation/cancellation (M13) is a cross-module
  // call through the owning module's exported service (docs/folder-structure.md).
  imports: [CatalogModule],
  providers: [OrdersResolver, OrdersService, OrderEventsListener],
})
export class OrdersModule {}
