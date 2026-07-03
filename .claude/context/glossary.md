# Glossary Context — SmartSense Marketplace

Short definitions only. Authoritative versions with context and links:
[docs/glossary.md](../../docs/glossary.md); entity rules: [docs/domain-model.md](../../docs/domain-model.md).

## Business Terms

- **Partner** — vendor organization that sells on the marketplace; owns catalog, fulfills
  orders, is invoiced/paid. Everything it touches is scoped to its `partnerId`.
- **Catalog** — everything offered for sale (Categories, Products, Variants, Inventory)
  and the module that manages it. Category taxonomy is Admin-owned and global.
- **Order** — a Customer's purchase from **exactly one** Partner; status-machine lifecycle
  (Draft → … → Completed/Cancelled/Refunded); never deleted.
- **Billing** — the Invoices/Payments/Reports domain; payments are _recorded_, not processed, in v1.0.
- **Invoice** — financial document for one completed Order (1:1); ledger record, never deleted.
- **SKU** — Partner-assigned identifier for one Product Variant; unique per Partner
  (`@@unique([partnerId, sku])`), not globally.
- **Inventory** — per-Variant stock record: `quantityOnHand` and `quantityReserved`
  (sellable = onHand − reserved, DB-constrained non-negative).

## Access & Identity

- **Realm** — Keycloak isolation unit; this project uses one: `smartsense-marketplace`.
- **Role** — named bundle of Permissions; system roles `Admin`/`Partner`/`Customer` exist in
  Keycloak (transport) and Postgres (source of truth), joined by exact name.
- **Permission** — atomic capability string `resource:action` (e.g. `catalog:write`);
  the unit guards and frontend `canX()` helpers evaluate; deny-by-default. Nine seeded keys.

## API & Data

- **GraphQL** — the single application API surface (REST only for `/health`); typed,
  additive-only schema.
- **Resolver** — NestJS method backing one GraphQL operation; thin — delegates to a service,
  never holds logic or calls Prisma.
- **Query** — read-only GraphQL operation, noun-named (`orders`, `orderById`); no side effects.
- **Mutation** — state-changing operation, `verbNoun` present tense (`createOrder`),
  taking a single `Input` object.
- **Apollo (Client/Server)** — Apollo Client is the frontend GraphQL client with the
  normalized cache; Apollo Server (via `@nestjs/apollo`) serves the API.
- **Prisma** — TypeScript ORM; generates a typed client from `database/prisma/schema.prisma`
  and manages migrations (`migrate dev` locally, `migrate deploy` in environments).

## Platform

- **NestJS** — backend framework: module-based DI, guards/pipes/filters request machinery.
- **Monorepo** — one Turborepo repository holding `apps/*` and `packages/*` npm workspaces,
  one root lockfile.
