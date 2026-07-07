-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- Hand-written additions below this line.
-- These enforce business rules from docs/domain-model.md that Prisma's schema
-- language cannot express (no CHECK-constraint syntax, no partial/filtered
-- unique indexes). See docs/database-schema.md for the full rationale behind
-- each one. `prisma migrate dev` will not regenerate or overwrite this
-- section on future schema changes to unrelated models.
-- =============================================================================

-- UniqueIndex (partial): at most one default ProductVariant per Product,
-- among its non-deleted Variants (docs/domain-model.md, Product Variant
-- business rules). Mirrors the addresses_partner_default_unique pattern.
CREATE UNIQUE INDEX "product_variants_one_default_per_product" ON "product_variants"("product_id") WHERE "is_default" = true AND "deleted_at" IS NULL;

-- CheckConstraint: ProductVariant.price must be strictly positive
-- (docs/domain-model.md, Product Variant business rules).
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_price_positive_check" CHECK ("price" > 0);
