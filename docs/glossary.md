# SmartSense Marketplace — Business & Technical Glossary

Version: 1.0

---

## Purpose

One canonical definition per term, so every document, PR, and conversation means the same thing by the same word. Definitions here are **summaries with a pointer** — the owning document linked in each term's Context is authoritative for detail; if this glossary and an owning document ever disagree, the owning document wins and this file gets corrected ([contributing.md § Documentation Expectations](./contributing.md#documentation-expectations)).

**Assumption made explicit.** Business-entity definitions restate [domain-model.md](./domain-model.md) in one sentence each, deliberately — that document remains the source of truth for lifecycles, rules, and relationships.

Terms are grouped by domain; use your editor's search to jump to a term.

---

## Business & Domain Terms

### Marketplace

- **Definition:** The platform itself — a multi-sided commerce system where Partners sell to Customers under Admin operation.
- **Context:** The product vision and its evolution live in [roadmap.md § Product Vision](./roadmap.md#product-vision); functional scope in [requirements.md](./requirements.md).
- **Related terms:** Partner, Customer, Admin, Catalog, Order.

### Partner

- **Definition:** A vendor organization that sells on the marketplace — owns its own catalog, fulfills its own orders, and is invoiced/paid for them.
- **Context:** The primary user of the platform ([roadmap.md § Target Users](./roadmap.md#product-vision)); lifecycle (pending approval → active → suspended/deactivated) in [domain-model.md § Partner](./domain-model.md#partner). Everything a Partner touches is ownership-scoped to their `partnerId` ([authorization.md § Ownership Rules](./authorization.md#ownership-rules)).
- **Related terms:** Customer, Admin, Catalog, Order, Invoice, Role.

### Admin

- **Definition:** The platform-operator role — approves Partners, administers users/roles, oversees the catalog, and manages billing, with unscoped (but always audit-logged) access.
- **Context:** One of the three system roles ([authorization.md § System Roles](./authorization.md#system-roles)); "Admin" is simultaneously a Keycloak realm role and a Postgres `Role` row joined by exact name ([authentication.md § Role Mapping](./authentication.md#role-mapping)).
- **Related terms:** Role, Permission, Partner, Audit Log.

### Customer

- **Definition:** A buyer — an individual or an organization — who places Orders; read-mostly access scoped to their own records.
- **Context:** [domain-model.md § Customer](./domain-model.md#customer) (INDIVIDUAL vs. ORGANIZATION types); role grants in [authorization.md § The Seeded Catalog](./authorization.md#permission-model).
- **Related terms:** Partner, Order, Role.

### Catalog

- **Definition:** The full set of things offered for sale — Categories, Products, Variants, and their Inventory — plus the module (`catalog`) that manages them.
- **Context:** Management workflows in [domain-model.md § Catalog Management](./domain-model.md#catalog-management); delivered by milestone M12 ([milestones.md](./milestones.md#milestone-details)).
- **Related terms:** Category, Product, Variant, Inventory.

### Category

- **Definition:** A node in the marketplace's product taxonomy tree (self-referencing parent/children), maintained by Admins, to which Products are assigned.
- **Context:** [domain-model.md § Category](./domain-model.md#category); cannot be deleted while it has children or active Products ([database-schema.md § Catalog](./database-schema.md#catalog)).
- **Related terms:** Catalog, Product.

### Product

- **Definition:** The conceptual sellable item a Partner lists (name, description, category, status lifecycle: draft → published → archived) — not directly purchasable; its Variants are.
- **Context:** [domain-model.md § Product](./domain-model.md#product); the conceptual/sellable split is deliberate ([domain-model.md](./domain-model.md#scope--assumptions), Assumption 5).
- **Related terms:** Variant, Category, Partner, SKU.

### Variant

- **Definition:** The concretely purchasable form of a Product (a specific size/color/configuration, carried as `jsonb` attributes) — the unit that has a SKU, a price, and Inventory.
- **Context:** `ProductVariant` in [domain-model.md § Product Variant](./domain-model.md#product-variant); carries a denormalized `partnerId` to make per-Partner SKU uniqueness a database constraint ([database-schema.md § Catalog](./database-schema.md#catalog)).
- **Related terms:** Product, SKU, Inventory, Order Item.

### SKU

- **Definition:** Stock Keeping Unit — the Partner-assigned identifier for one Variant, unique **within that Partner's catalog** (not globally).
- **Context:** Enforced as `@@unique([partnerId, sku])` ([database-schema.md § Catalog](./database-schema.md#catalog)).
- **Related terms:** Variant, Inventory, Partner.

### Inventory

- **Definition:** The stock record for exactly one Variant: `quantityOnHand` (physically available) and `quantityReserved` (committed to placed-but-unfulfilled Orders).
- **Context:** [domain-model.md § Inventory](./domain-model.md#inventory); non-negativity and reserved ≤ on-hand are database `CHECK` constraints ([database-schema.md § Constraints Added by Hand](./database-schema.md#constraints-added-by-hand-to-the-migration)).
- **Related terms:** Stock, Variant, Order.

### Stock

- **Definition:** Informal synonym for Inventory quantity — "in stock" means `quantityOnHand − quantityReserved > 0`.
- **Context:** Prefer the precise Inventory field names in code and schema; "stock" appears in UI copy and conversation ("low-stock alert," [roadmap.md § Inventory](./roadmap.md#feature-roadmap)).
- **Related terms:** Inventory, Variant.

### Order

- **Definition:** A Customer's purchase from **exactly one Partner** — a set of Order Items plus totals and a status lifecycle (placement through fulfillment or cancellation).
- **Context:** Lifecycle in [domain-model.md § Order Lifecycle](./domain-model.md#order-lifecycle); the single-Partner scoping is a core domain assumption ([roadmap.md § Risks](./roadmap.md#risks--assumptions), #2). Never hard- or soft-deleted — status is its lifecycle signal ([database-schema.md § Soft Delete Strategy](./database-schema.md#soft-delete-strategy)).
- **Related terms:** Order Item, Customer, Partner, Invoice.

### Order Item

- **Definition:** One line of an Order — a Variant, a quantity, and a price **snapshot taken at purchase time**; immutable once written.
- **Context:** [domain-model.md § Order Item](./domain-model.md#order-item); immutability is expressed in the schema by omitting `updatedAt` ([database-schema.md § Design Conventions](./database-schema.md#design-conventions)).
- **Related terms:** Order, Variant, Invoice.

### Invoice

- **Definition:** The financial document generated for a completed Order (exactly one per Order), tracking the amount due and its payment status.
- **Context:** [domain-model.md § Invoice](./domain-model.md#invoice); a ledger record — never deleted, status-machine-driven, `partnerId` denormalized for report queries.
- **Related terms:** Order, Payment, Billing, Report.

### Billing

- **Definition:** The module and domain covering Invoices, Payments, and Billing Reports — how money owed becomes money tracked.
- **Context:** [domain-model.md § Billing Flow](./domain-model.md#billing-flow); delivered by M14–M15; in v1.0 payments are _recorded_, not _processed_ ([roadmap.md § Risks](./roadmap.md#risks--assumptions), #3).
- **Related terms:** Invoice, Payment, Report.

### Payment

- **Definition:** A recorded settlement against one Invoice; multiple Payments may settle one Invoice (partial/installment payments).
- **Context:** [domain-model.md § Payment](./domain-model.md#payment); the canonical idempotency case — a retried `createPayment` must never charge twice ([api-conventions.md § Idempotency](./api-conventions.md#idempotency)).
- **Related terms:** Invoice, Billing.

### Report

- **Definition:** In this project, specifically a **Billing Report** — a periodic, per-Partner aggregation of billing activity over a non-overlapping date range — plus the broader Reports module (M15).
- **Context:** [domain-model.md § Billing Report](./domain-model.md#billing-report); period non-overlap is a GiST exclusion constraint ([database-schema.md](./database-schema.md#constraints-added-by-hand-to-the-migration)).
- **Related terms:** Billing, Invoice, Partner, Dashboard.

### Dashboard

- **Definition:** The role-appropriate landing module showing overview statistics and recent activity — the first vertical feature slice (M11).
- **Context:** [requirements.md § Modules](./requirements.md#modules); its per-card progressive loading is the reference pattern ([ui-guidelines.md § Loading Experience](./ui-guidelines.md#loading-experience)).
- **Related terms:** Report, Feature Module.

### Notification

- **Definition:** A user-directed message about a domain event (order placed, low stock) delivered in-app or by email — distinct from a Toast (transient UI feedback about the user's own just-completed action).
- **Context:** Planned for v1.1/M16, built on a domain-event model ([backend-architecture.md § Event Architecture](./backend-architecture.md#event-architecture-future)); the Toast/Alert/Notification distinction is in [ui-guidelines.md § Feedback Components](./ui-guidelines.md#feedback-components).
- **Related terms:** Dashboard, Order, Inventory.

---

## Access & Identity Terms

### Role

- **Definition:** A named bundle of Permissions assigned to Users. System roles (`Admin`, `Partner`, `Customer`) exist in both Keycloak (as realm roles, for transport) and Postgres (as `Role` rows, the source of truth); future custom roles are Postgres-only compositions.
- **Context:** [authorization.md § RBAC Model](./authorization.md#rbac-model); the Keycloak↔Postgres name-join and sync in [authentication.md § Role Mapping](./authentication.md#role-mapping).
- **Related terms:** Permission, Realm, Admin, Partner, Customer.

### Permission

- **Definition:** An atomic capability string `resource:action` (e.g. `catalog:write`) — the unit both backend guards and frontend `canX()` helpers evaluate; deny-by-default.
- **Context:** The nine-key seeded catalog and the coarse verb strategy (`view`/`read`/`write`/`manage`, deliberately not full CRUD) in [authorization.md § Permission Model](./authorization.md#permission-model).
- **Related terms:** Role, Resolver, Audit Log.

### Realm

- **Definition:** Keycloak's isolation unit — a self-contained set of users, roles, groups, and clients. This project uses one: `smartsense-marketplace`.
- **Context:** Auto-imported from `infrastructure/keycloak/realm-export/` ([keycloak-setup.md § Realm Configuration](./keycloak-setup.md#realm-configuration)); the `master` realm is Keycloak's own administration, not the application's.
- **Related terms:** Client, Role, JWT.

### Client

- **Definition:** In Keycloak, a registered application that authenticates through the realm — here `smartsense-web` (public, PKCE, no secret) and `smartsense-api` (confidential, holds a secret).
- **Context:** [authentication.md § Keycloak Realm & Client Topology](./authentication.md#keycloak-realm--client-topology). Not to be confused with Apollo Client (below) — "client" unqualified should be avoided where both could apply.
- **Related terms:** Realm, JWT, Apollo Client.

### JWT

- **Definition:** JSON Web Token — the signed (RS256) bearer credential Keycloak issues; carried as an `Authorization: Bearer` header and fully validated (signature via JWKS, `exp`, `iss`, `aud`) on every API request.
- **Context:** Validation rules in [authentication.md § JWT Validation](./authentication.md#jwt-validation); hardening (algorithm confinement, key rotation, never logged) in [security.md § JWT Security](./security.md#jwt-security).
- **Related terms:** Client, Realm, Role.

---

## API & Data Layer Terms

### GraphQL

- **Definition:** The API query language and runtime — the platform's single application API surface (the REST `/health` endpoint being the one exception), where clients select exactly the fields they need from one typed schema.
- **Context:** Why it was chosen, and all schema/operation conventions: [graphql.md](./graphql.md).
- **Related terms:** Query, Mutation, Resolver, Apollo Client.

### Resolver

- **Definition:** The NestJS class method that backs one GraphQL field/operation — declaratively thin: it delegates to a Service and contains no business logic.
- **Context:** Layer contract in [api-conventions.md § Layer Responsibilities](./api-conventions.md#layer-responsibilities); code-first decorators (`@Query`, `@Mutation`) per [graphql.md § 2](./graphql.md#2-architecture-overview).
- **Related terms:** Query, Mutation, GraphQL, NestJS.

### Query

- **Definition:** A read-only GraphQL operation, named as a noun (`orders`, `orderById`) — never has side effects.
- **Context:** Naming and design rules in [graphql.md § 5 Queries](./graphql.md#5-queries).
- **Related terms:** Mutation, Resolver, GraphQL.

### Mutation

- **Definition:** A state-changing GraphQL operation, named `verbNoun` present tense (`createOrder`, `cancelOrder`), taking a single `Input` object.
- **Context:** [graphql.md § 6 Mutations](./graphql.md#6-mutations); validation and error behavior per [api-conventions.md](./api-conventions.md).
- **Related terms:** Query, Resolver, GraphQL.

### Prisma

- **Definition:** The TypeScript ORM — generates a fully typed database client from `database/prisma/schema.prisma` (the single source of truth for the data model) and manages Migrations.
- **Context:** Schema conventions in [database-schema.md](./database-schema.md) and [coding-standards.md § 7](./coding-standards.md#7-prisma-standards); the client must be regenerated after every schema change ([developer-setup.md § Prisma](./developer-setup.md#prisma)).
- **Related terms:** Migration, GraphQL, NestJS.

### Migration

- **Definition:** A versioned SQL change-set generated from the Prisma schema (plus hand-written constraint SQL where Prisma's language can't express a rule), applied in order to evolve the database.
- **Context:** Generated via `prisma migrate dev`, deployed via `prisma migrate deploy`; expand→migrate→contract for backward compatibility ([deployment.md § Database Deployment](./deployment.md#database-deployment)).
- **Related terms:** Prisma, Deployment.

---

## Frontend & Tooling Terms

### Apollo Client

- **Definition:** The frontend GraphQL client — executes operations, and maintains the normalized in-memory cache that keeps every rendered view of an entity consistent.
- **Context:** Configuration, fetch/error policies, and cache strategy in [graphql.md § 9](./graphql.md#9-apollo-client-strategy); its cache is the frontend's highest-leverage performance feature ([performance.md § Apollo Cache](./performance.md#apollo-cache)).
- **Related terms:** GraphQL, Query, Mutation, Client.

### NestJS

- **Definition:** The backend framework — a module-based, dependency-injection-driven Node.js framework hosting the GraphQL API (via Apollo Server) and the guard/pipe/filter request machinery.
- **Context:** Structural composition in [backend-architecture.md](./backend-architecture.md); per-request conventions in [api-conventions.md](./api-conventions.md).
- **Related terms:** Resolver, Feature Module, Prisma.

### Playwright

- **Definition:** The end-to-end testing framework — drives real browsers (Chromium, Firefox) through full user journeys against the running application.
- **Context:** Configured in `apps/web`, suites planned per module for M18 ([testing.md § End-to-End Testing](./testing.md#end-to-end-testing)).
- **Related terms:** Deployment, Health Check.

---

## Repository & Structure Terms

### Monorepo

- **Definition:** One Git repository containing all deployable applications and shared packages, orchestrated by Turborepo's task graph.
- **Context:** Why, and the layout: [folder-structure.md § Root Layout](./folder-structure.md#root-layout).
- **Related terms:** Workspace, Package, Feature Module.

### Workspace

- **Definition:** An npm-workspaces member — a directory under `apps/*` or `packages/*` with its own `package.json`, installed and cross-linked by the single root `npm install`.
- **Context:** Referenced by name (`npm run dev -w @smartsense/api`); one root lockfile, never per-workspace lockfiles ([developer-setup.md](./developer-setup.md#install-dependencies)).
- **Related terms:** Monorepo, Package.

### Package

- **Definition:** A shared workspace under `packages/*` (`@smartsense/tsconfig`, `eslint-config`, `ui`, `shared-types`, `graphql`, `config`) — code consumed by more than one app, published only within the monorepo.
- **Context:** Promotion rule ("code moves into `packages/*` once both apps need it") and current scaffold status: [folder-structure.md § packages](./folder-structure.md#packages--shared-workspace-packages).
- **Related terms:** Workspace, Shared Module, Monorepo.

### Feature Module

- **Definition:** The unit of business capability, in both apps: on the frontend, a `features/<name>/` folder with the fixed internal anatomy (pages/components/hooks/graphql/services/types/utils/constants); on the backend, a `modules/<name>/` NestJS module (resolver + service + dto). Features/modules never import each other's internals.
- **Context:** Frontend anatomy in [folder-structure.md § features](./folder-structure.md#features--feature-modules); backend in [backend-architecture.md § Module Organization](./backend-architecture.md#module-organization).
- **Related terms:** Shared Module, NestJS, Catalog, Dashboard.

### Shared Module

- **Definition:** Cross-cutting, domain-agnostic code: `shared/` on the frontend (components/hooks/utils used by 2+ features), `common/` on the backend (global providers), and `packages/*` across apps. Dependency-terminal — shared code never imports from features/app.
- **Context:** Placement and promotion rules in [folder-structure.md § shared](./folder-structure.md#shared--cross-feature-reusable-code); the dependency-terminal constraint in [frontend-architecture.md § Shared Module Architecture](./frontend-architecture.md#shared-module-architecture).
- **Related terms:** Feature Module, Package.

---

## Operations Terms

### Environment

- **Definition:** A named, isolated instance of the full stack with its own configuration and data: Local Development (the only one existing today), then shared Development, QA, Staging, and Production.
- **Context:** Purpose of each, and the config-not-code rule that differentiates them: [deployment.md § Supported Environments](./deployment.md#supported-environments).
- **Related terms:** Deployment, Health Check.

### Deployment

- **Definition:** The act (and pipeline) of building release artifacts — one immutable Docker image + frontend bundle per release — and promoting them through environments with migrations applied before traffic.
- **Context:** [deployment.md](./deployment.md) end to end; release/rollback/hotfix policy in its § Release Strategy; git mechanics in [git-workflow.md](./git-workflow.md).
- **Related terms:** Environment, Migration, Health Check.

### Health Check

- **Definition:** A binary liveness/readiness probe — the API's REST `GET /health` endpoint and the Compose containers' healthchecks — consumed by orchestration to gate startup ordering and restarts.
- **Context:** [deployment.md § Health Checks](./deployment.md#health-checks), including the known gap that the endpoint currently verifies no dependencies (TD-4). Deliberately REST, outside the GraphQL guard envelope ([backend-architecture.md § Health Checks](./backend-architecture.md#health-checks)).
- **Related terms:** Deployment, Observability, Environment.

### Observability

- **Definition:** The practice and tooling of understanding the running system through three signals — logs, metrics, traces — joined per request by a correlation ID, measured against SLOs.
- **Context:** [observability.md](./observability.md) owns it all: structured log schema, metric set, alerting rules, SLI/SLO definitions.
- **Related terms:** Health Check, Deployment, Audit Log.

### Audit Log

- **Definition:** The immutable, actor-attributed database record (`AuditLog`) of business-relevant actions — who did what to which entity, when. A permanent business record, **not** operational logging and never subject to log retention.
- **Context:** Entity in [domain-model.md § Audit Log](./domain-model.md#audit-log); audit-vs-log distinction in [api-conventions.md § Logging](./api-conventions.md#logging); the security obligation (privileged actions must audit) in [authorization.md § Security Considerations](./authorization.md#security-considerations).
- **Related terms:** Observability, Admin, Permission.
