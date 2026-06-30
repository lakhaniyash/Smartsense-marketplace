import { Query, Resolver } from '@nestjs/graphql'
import { type CatalogService } from './catalog.service'

@Resolver()
export class CatalogResolver {
  constructor(private readonly catalogService: CatalogService) {}

  @Query(() => String, { name: 'catalogStatus', description: 'Catalog module status' })
  catalogStatus(): string {
    return this.catalogService.getStatus()
  }
}
