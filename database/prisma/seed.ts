/**
 * Development seed data: system Roles, Permissions, an Admin User, one
 * sample Partner (with a staff User), and a starter Category tree.
 *
 * Idempotent by design — every write is an `upsert` keyed on a unique
 * field (or, where no natural unique field exists, a fixed seed UUID), so
 * running this script repeatedly never creates duplicates.
 *
 * `keycloakSubjectId` values below are placeholders. Real values are
 * provisioned by Keycloak once the auth integration lands (out of scope
 * for this milestone) — swap them out rather than relying on these in
 * any environment beyond local development.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fixed UUIDs for rows with no natural unique business key (Partner has
// no unique column other than `id`), so re-running this script is a no-op.
const SAMPLE_PARTNER_ID = '00000000-0000-0000-0000-000000000010';
// Version nibble must be 1-5 (a real v4 shape here) — class-validator's
// @IsUUID() on CreateOrderInput.customerId rejects a version-0 literal like
// SAMPLE_PARTNER_ID's pattern above, and this id IS submitted as client
// input (Partner/Admin placing an order on a Customer's behalf), unlike
// SAMPLE_PARTNER_ID which is always derived server-side from auth context.
const SAMPLE_CUSTOMER_ID = '00000000-0000-4000-8000-000000000020';

const PERMISSIONS = [
  { key: 'dashboard:view', domain: 'dashboard', description: 'View dashboard analytics and summaries' },
  { key: 'catalog:read', domain: 'catalog', description: 'View products, variants, and categories' },
  { key: 'catalog:write', domain: 'catalog', description: 'Create and edit products, variants, and inventory' },
  { key: 'orders:read', domain: 'orders', description: 'View orders and order history' },
  // Deliberately distinct from `orders:write`: a Customer places (and may
  // cancel) their own order, but never drives fulfillment. See
  // docs/authorization.md § Orders for the full transition/permission matrix.
  { key: 'orders:create', domain: 'orders', description: 'Place a new order and cancel an own order before fulfillment' },
  { key: 'orders:write', domain: 'orders', description: 'Update order status and manage fulfillment' },
  { key: 'billing:read', domain: 'billing', description: 'View invoices and payments' },
  {
    key: 'billing:manage',
    domain: 'billing',
    description: 'Issue invoices and record payments',
  },
  { key: 'users:read', domain: 'users', description: 'View platform users' },
  {
    key: 'users:manage',
    domain: 'users',
    description: 'Invite, suspend, and manage platform users and roles',
  },
  // Single key covers both viewing and generating every report type
  // (billing reports, revenue, orders, inventory, product performance,
  // notification activity) and the reports dashboard — docs/authorization.md
  // § Reports. Admin sees all Partners; Partner sees only its own
  // (enforced in ReportsService, not just here); Customer has no access.
  {
    key: 'reports:read',
    domain: 'reports',
    description:
      'View and generate reports (billing reports, revenue, orders, inventory, product ' +
      'performance, notification activity) and the reports dashboard',
  },
] as const;

const SYSTEM_ROLES = [
  { name: 'Admin', description: 'Platform operator with full system access', permissionKeys: PERMISSIONS.map((p) => p.key) },
  {
    name: 'Partner',
    description: 'Vendor organization staff — manages catalog, orders, and billing for their own Partner',
    permissionKeys: [
      'dashboard:view',
      'catalog:read',
      'catalog:write',
      'orders:read',
      'orders:create',
      'orders:write',
      'billing:read',
      'reports:read',
    ],
  },
  {
    name: 'Customer',
    description: 'Buyer organization or individual — browses the catalog, places and reads their own orders, no fulfillment access',
    // catalog:read is required to browse products when placing an order
    // (M13's Create Order line-item picker calls the same `products` query
    // Partners use to manage their catalog) — a Customer sees every
    // Partner's PUBLISHED products, same unscoped read CatalogService
    // already gives Admin, since Customers aren't tied to one Partner.
    permissionKeys: ['dashboard:view', 'catalog:read', 'orders:read', 'orders:create'],
  },
] as const;

const CATEGORY_TREE = [
  {
    name: 'Electronics',
    slug: 'electronics',
    children: [
      { name: 'Computers & Laptops', slug: 'computers-laptops' },
      { name: 'Mobile Phones', slug: 'mobile-phones' },
    ],
  },
  { name: 'Home & Kitchen', slug: 'home-kitchen', children: [] },
  { name: 'Apparel', slug: 'apparel', children: [] },
] as const;

async function seedPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description, domain: permission.domain },
      create: permission,
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

async function seedRolesWithPermissions() {
  for (const role of SYSTEM_ROLES) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, isSystemRole: true },
      create: { name: role.name, description: role.description, isSystemRole: true },
    });

    for (const permissionKey of role.permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: createdRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: createdRole.id, permissionId: permission.id },
      });
    }
  }
  console.log(`Seeded ${SYSTEM_ROLES.length} system roles and their permission grants.`);
}

async function seedCategories() {
  for (const category of CATEGORY_TREE) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { name: category.name, slug: category.slug },
    });

    for (const child of category.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentCategoryId: parent.id },
        create: { name: child.name, slug: child.slug, parentCategoryId: parent.id },
      });
    }
  }
  console.log('Seeded starter category tree.');
}

async function seedAdminUser() {
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Admin' } });

  // Email matches the admin user seeded in the Keycloak realm export
  // (infrastructure/keycloak/realm-export/) so first login attaches this
  // pending row's placeholder keycloakSubjectId to the real one.
  const adminUser = await prisma.user.upsert({
    where: { email: 'yash.lakhani+admin@smartsensesolutions.com' },
    update: { status: 'ACTIVE' },
    create: {
      keycloakSubjectId: 'seed-admin-0000-0000-0000',
      email: 'yash.lakhani+admin@smartsensesolutions.com',
      fullName: 'Platform Admin',
      status: 'ACTIVE',
      ownerType: 'NONE',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  console.log(`Seeded Admin user (${adminUser.email}).`);
}

async function seedSamplePartner() {
  const partnerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Partner' } });

  const partner = await prisma.partner.upsert({
    where: { id: SAMPLE_PARTNER_ID },
    update: { status: 'ACTIVE' },
    create: {
      id: SAMPLE_PARTNER_ID,
      legalName: 'Acme Supplies Pvt Ltd',
      displayName: 'Acme Supplies',
      status: 'ACTIVE',
      contactEmail: 'yash.lakhani+acme-contact@smartsensesolutions.com',
      taxId: 'ACME-TAX-0001',
      registrationNumber: 'ACME-REG-0001',
      commissionRate: '15.00',
      approvedAt: new Date(),
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'yash.lakhani+partner@smartsensesolutions.com' },
    update: { status: 'ACTIVE', partnerId: partner.id },
    create: {
      keycloakSubjectId: 'seed-partner-staff-0000-0001',
      email: 'yash.lakhani+partner@smartsensesolutions.com',
      fullName: 'Acme Supplies Staff',
      status: 'ACTIVE',
      ownerType: 'PARTNER',
      partnerId: partner.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: staffUser.id, roleId: partnerRole.id } },
    update: {},
    create: { userId: staffUser.id, roleId: partnerRole.id },
  });

  console.log(`Seeded sample Partner (${partner.displayName}) with staff user (${staffUser.email}).`);
}

async function seedSampleCustomer() {
  const customerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Customer' } });

  const customer = await prisma.customer.upsert({
    where: { id: SAMPLE_CUSTOMER_ID },
    update: { status: 'ACTIVE' },
    create: {
      id: SAMPLE_CUSTOMER_ID,
      displayName: 'Jordan Rivera',
      type: 'INDIVIDUAL',
      status: 'ACTIVE',
      billingEmail: 'yash.lakhani+customer-billing@smartsensesolutions.com',
    },
  });

  const buyerUser = await prisma.user.upsert({
    where: { email: 'yash.lakhani+customer@smartsensesolutions.com' },
    update: { status: 'ACTIVE', customerId: customer.id },
    create: {
      keycloakSubjectId: 'seed-customer-buyer-0000-0001',
      email: 'yash.lakhani+customer@smartsensesolutions.com',
      fullName: 'Jordan Rivera',
      status: 'ACTIVE',
      ownerType: 'CUSTOMER',
      customerId: customer.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: buyerUser.id, roleId: customerRole.id } },
    update: {},
    create: { userId: buyerUser.id, roleId: customerRole.id },
  });

  console.log(`Seeded sample Customer (${customer.displayName}) with buyer user (${buyerUser.email}).`);
}

async function main() {
  await seedPermissions();
  await seedRolesWithPermissions();
  await seedCategories();
  await seedAdminUser();
  await seedSamplePartner();
  await seedSampleCustomer();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
