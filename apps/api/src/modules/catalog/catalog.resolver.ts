import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { CatalogService } from './catalog.service'
import { CategoryOutput } from './dto/category.output'
import { CreateProductInput } from './dto/create-product.input'
import { ProductConnectionOutput } from './dto/product-connection.output'
import { ProductFilterInput } from './dto/product-filter.input'
import { ProductSortInput } from './dto/product-sort.input'
import { ProductOutput } from './dto/product.output'
import { UpdateProductInput } from './dto/update-product.input'

@Resolver()
export class CatalogResolver {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Query(() => String, { name: 'catalogStatus', description: 'Catalog module status' })
  catalogStatus(): string {
    return this.catalogService.getStatus()
  }

  @Permissions('catalog:read')
  @Query(() => [CategoryOutput], {
    name: 'categories',
    description: 'Active categories in the global taxonomy, flat.',
  })
  categories(): Promise<CategoryOutput[]> {
    return this.catalogService.findCategories()
  }

  @Permissions('catalog:read')
  @Query(() => ProductConnectionOutput, {
    name: 'products',
    description: "A page of the caller's visible products (Admin: all; Partner: own).",
  })
  products(
    @CurrentUser() user: AuthenticatedUser,
    // Nullable GraphQL args arrive as `null` from a TS client under
    // exactOptionalPropertyTypes (it sends `null` rather than omitting the
    // key) as readily as `undefined` from a client that omits it — every
    // param here is typed to admit both, and CatalogService.findProducts
    // normalizes them once rather than each call site re-deriving it.
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput | null,
    @Args('sort', { type: () => ProductSortInput, nullable: true }) sort?: ProductSortInput | null,
  ): Promise<ProductConnectionOutput> {
    return this.catalogService.findProducts(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
      sort: sort ?? undefined,
    })
  }

  @Permissions('catalog:read')
  @Query(() => ProductOutput, {
    name: 'productById',
    description:
      'A single product by id, scoped to the caller (Admin: any; Partner: own). ' +
      'Throws NOT_FOUND rather than returning null on a missing or out-of-scope id.',
  })
  productById(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProductOutput> {
    return this.catalogService.findProductById(user, id)
  }

  @Permissions('catalog:write')
  @Mutation(() => ProductOutput, {
    name: 'createProduct',
    description: "Creates a Product under the caller's own Partner.",
  })
  createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateProductInput,
  ): Promise<ProductOutput> {
    return this.catalogService.createProduct(user, input)
  }

  @Permissions('catalog:write')
  @Mutation(() => ProductOutput, {
    name: 'updateProduct',
    description: 'Updates a Product owned by the caller.',
  })
  updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateProductInput,
  ): Promise<ProductOutput> {
    return this.catalogService.updateProduct(user, input)
  }

  @Permissions('catalog:write')
  @Mutation(() => ProductOutput, {
    name: 'archiveProduct',
    description: 'Transitions a Product owned by the caller to ARCHIVED status.',
  })
  archiveProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProductOutput> {
    return this.catalogService.archiveProduct(user, id)
  }
}
