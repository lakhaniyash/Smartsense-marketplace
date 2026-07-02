import { Query, Resolver } from '@nestjs/graphql'
import { Public } from '../auth/decorators/public.decorator'
import { CatalogService } from './catalog.service'

@Resolver()
export class CatalogResolver {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Query(() => String, { name: 'catalogStatus', description: 'Catalog module status' })
  catalogStatus(): string {
    return this.catalogService.getStatus()
  }
}
