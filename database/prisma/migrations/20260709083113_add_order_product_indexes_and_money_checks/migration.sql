-- CreateIndex
CREATE INDEX "order_status_history_changed_by_user_id_idx" ON "order_status_history"("changed_by_user_id");

-- CreateIndex
CREATE INDEX "orders_total_idx" ON "orders"("total");

-- CreateIndex
CREATE INDEX "products_title_idx" ON "products"("title");

-- =============================================================================
-- Hand-written additions below this line.
-- These enforce business rules from docs/domain-model.md that Prisma's schema
-- language cannot express (no CHECK-constraint syntax). See
-- docs/database-schema.md for the full rationale behind each one.
-- `prisma migrate dev` will not regenerate or overwrite this section on
-- future schema changes to unrelated models.
-- =============================================================================

-- CheckConstraint: Order money fields must never be negative
-- (docs/domain-model.md, Order business rules). Mirrors the
-- product_variants_price_positive_check pattern.
ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_non_negative_check" CHECK ("subtotal" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_tax_non_negative_check" CHECK ("tax" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_cost_non_negative_check" CHECK ("shipping_cost" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_non_negative_check" CHECK ("total" >= 0);

-- CheckConstraint: Invoice.amountDue must never be negative
-- (docs/domain-model.md, Invoice business rules).
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_amount_due_non_negative_check" CHECK ("amount_due" >= 0);

-- CheckConstraint: Payment.amount must never be negative
-- (docs/domain-model.md, Payment business rules).
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_non_negative_check" CHECK ("amount" >= 0);
