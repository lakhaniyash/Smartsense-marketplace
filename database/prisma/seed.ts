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

const PERMISSIONS = [
  { key: 'dashboard:view', domain: 'dashboard', description: 'View dashboard analytics and summaries' },
  { key: 'catalog:read', domain: 'catalog', description: 'View products, variants, and categories' },
  { key: 'catalog:write', domain: 'catalog', description: 'Create and edit products, variants, and inventory' },
  { key: 'orders:read', domain: 'orders', description: 'View orders and order history' },
  { key: 'orders:write', domain: 'orders', description: 'Update order status and manage fulfillment' },
  { key: 'billing:read', domain: 'billing', description: 'View invoices, payments, and billing reports' },
  {
    key: 'billing:manage',
    domain: 'billing',
    description: 'Issue invoices, record payments, and finalize billing reports',
  },
  { key: 'users:read', domain: 'users', description: 'View platform users' },
  {
    key: 'users:manage',
    domain: 'users',
    description: 'Invite, suspend, and manage platform users and roles',
  },
] as const;

const SYSTEM_ROLES = [
  { name: 'Admin', description: 'Platform operator with full system access', permissionKeys: PERMISSIONS.map((p) => p.key) },
  {
    name: 'Partner',
    description: 'Vendor organization staff — manages catalog, orders, and billing for their own Partner',
    permissionKeys: ['dashboard:view', 'catalog:read', 'catalog:write', 'orders:read', 'orders:write', 'billing:read'],
  },
  {
    name: 'Customer',
    description: 'Buyer organization or individual — mostly read-only access to their own orders',
    permissionKeys: ['dashboard:view', 'orders:read'],
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

async function main() {
  await seedPermissions();
  await seedRolesWithPermissions();
  await seedCategories();
  await seedAdminUser();
  await seedSamplePartner();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
