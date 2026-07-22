-- CreateIndex
CREATE INDEX "billing_reports_partner_id_generated_at_idx" ON "billing_reports"("partner_id", "generated_at");

-- CreateIndex
CREATE INDEX "customers_deleted_at_created_at_idx" ON "customers"("deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "invoices_partner_id_created_at_idx" ON "invoices"("partner_id", "created_at");

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

-- CreateIndex
CREATE INDEX "invoices_partner_id_issued_at_idx" ON "invoices"("partner_id", "issued_at");

-- CreateIndex
CREATE INDEX "invoices_issued_at_idx" ON "invoices"("issued_at");

-- CreateIndex
CREATE INDEX "orders_partner_id_created_at_idx" ON "orders"("partner_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_customer_id_created_at_idx" ON "orders"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "products_deleted_at_created_at_idx" ON "products"("deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_created_at_idx" ON "users"("deleted_at", "created_at");
