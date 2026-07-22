-- Hand-written addition (see docs/database-schema.md): the four GIN indexes
-- below use the `gin_trgm_ops` operator class, which is provided by the
-- pg_trgm extension. Prisma's schema language declares the indexes (the
-- `@@index([...(ops: raw("gin_trgm_ops"))], type: Gin)` entries on User and
-- Customer) but cannot manage the extension itself without the
-- `postgresqlExtensions` preview feature, so — exactly as btree_gist was
-- added by hand for the BillingReport exclusion constraint in
-- 20260701110512_init — the extension is created here in raw SQL. It must
-- exist before the CREATE INDEX statements run (v1.0 Release Readiness Audit
-- finding F-H5).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "customers_display_name_idx" ON "customers" USING GIN ("display_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "customers_billing_email_idx" ON "customers" USING GIN ("billing_email" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users" USING GIN ("email" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "users_full_name_idx" ON "users" USING GIN ("full_name" gin_trgm_ops);
