import { Args, ID, Mutation, Resolver } from '@nestjs/graphql'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { AdjustInventoryInput } from './dto/adjust-inventory.input'
import { CreateProductVariantInput } from './dto/create-product-variant.input'
import { ProductVariantOutput } from './dto/product-variant.output'
import { UpdateProductVariantInput } from './dto/update-product-variant.input'
import { InventoryService } from './inventory.service'
import { VariantService } from './variant.service'

@Resolver()
export class VariantResolver {
  constructor(
    private readonly variantService: VariantService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Permissions('catalog:write')
  @Mutation(() => ProductVariantOutput, {
    name: 'createProductVariant',
    description: 'Adds a ProductVariant to a Product owned by the caller.',
  })
  createProductVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateProductVariantInput,
  ): Promise<ProductVariantOutput> {
    return this.variantService.createProductVariant(user, input)
  }

  @Permissions('catalog:write')
  @Mutation(() => ProductVariantOutput, {
    name: 'updateProductVariant',
    description: 'Updates a ProductVariant owned by the caller.',
  })
  updateProductVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateProductVariantInput,
  ): Promise<ProductVariantOutput> {
    return this.variantService.updateProductVariant(user, input)
  }

  @Permissions('catalog:write')
  @Mutation(() => ProductVariantOutput, {
    name: 'archiveProductVariant',
    description:
      "Soft-deletes a ProductVariant. Rejected if it is the Product's default Variant or " +
      'its only remaining Variant.',
  })
  archiveProductVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProductVariantOutput> {
    return this.variantService.archiveProductVariant(user, id)
  }

  @Permissions('catalog:write')
  @Mutation(() => ProductVariantOutput, {
    name: 'setDefaultProductVariant',
    description: "Marks a ProductVariant as its Product's default, unsetting any previous default.",
  })
  setDefaultProductVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProductVariantOutput> {
    return this.variantService.setDefaultProductVariant(user, id)
  }

  @Permissions('catalog:write')
  @Mutation(() => ProductVariantOutput, {
    name: 'adjustInventory',
    description: "Adjusts a ProductVariant's stock on hand and returns the updated Variant.",
  })
  adjustInventory(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: AdjustInventoryInput,
  ): Promise<ProductVariantOutput> {
    return this.inventoryService.adjustInventory(user, input)
  }
}
