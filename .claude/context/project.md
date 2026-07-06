# Project Context — SmartSense Marketplace

## Vision

An enterprise multi-vendor marketplace where **Partners** run their entire selling operation —
catalog, inventory, orders, billing, insight — in one place, operated by **Admins**, purchased
from by **Customers**. Evolution: Operate (v1.x) → Optimize (v2.x) → Extend (v3.x, public APIs).
Source: [docs/roadmap.md](../../docs/roadmap.md).

## Business Goals

- **Operational consolidation** — one system of record for products, inventory, orders, billing.
- **Trustworthy commerce** — ledger-grade integrity for every Order/Invoice/Payment.
- **Scalable partner growth** — onboarding a Partner is configuration, not engineering.

## Core Modules

| Module                             | Scope                                                 | Release        |
| ---------------------------------- | ----------------------------------------------------- | -------------- |
| Dashboard                          | Role-scoped overview, statistics, recent activity     | v1.0 (M11)     |
| Catalog                            | Products, variants, categories, inventory, search     | v1.0 (M12)     |
| Orders                             | Placement, lifecycle, timeline, fulfillment           | v1.0 (M13)     |
| Billing                            | Invoices, payments (recorded, not processed), exports | v1.0 (M14)     |
| Reports / Notifications / Settings | Insight & awareness                                   | v1.1 (M15–M17) |

Roles: `Admin` (unscoped, audit-logged), `Partner` (ownership-scoped), `Customer` (read-mostly).

## Repository Overview

Turborepo monorepo, **npm workspaces** (not pnpm): `apps/web` (React SPA), `apps/api`
(NestJS GraphQL API), `packages/*` (shared configs, mostly scaffolds), `database/prisma`
(schema is the contract, outside any app), `infrastructure/` (Docker + Keycloak realm),
`docs/` (authoritative documentation). See [docs/folder-structure.md](../../docs/folder-structure.md).

## Current Status (see docs/milestones.md for live state)

- ✅ M1–M11: monorepo, both app shells, database (16 entities, verified constraints, seed),
  auth design, Keycloak infrastructure, backend + frontend authentication, GraphQL codegen
  pipeline, shared component library, and the Dashboard vertical slice (mock stats, no
  revenue field pending a real Decimal/Money scalar).
- ⬜ Next: M12 Catalog, M13 Orders, M14 Billing (v1.0 feature slices).
- GraphQL schema exposes `me`, `dashboardStats`, and placeholder `xStatus` queries for the
  not-yet-built modules; `packages/ui` remains a scaffold (Dashboard's UI lives in
  `apps/web/src/features/dashboard` + `shared/`, per folder-structure.md's promote-don't-
  pre-share rule). `main` trails `development`; no release tags yet.
- Known debt: TD-1 Docker build-context fix unmerged, TD-2 CI runs no tests — register in
  [docs/TASKS.md](../../docs/TASKS.md#technical-debt). TD-3 (no frontend test tooling)
  resolved at M10 (Vitest + RTL + jest-axe).

## Documentation Map (read the owner before touching an area)

| Area                  | Owning doc                                                               |
| --------------------- | ------------------------------------------------------------------------ |
| What/why/when         | requirements.md, roadmap.md, milestones.md, TASKS.md                     |
| Where files go        | folder-structure.md                                                      |
| Principles & layering | architecture.md, frontend-architecture.md, backend-architecture.md       |
| Domain & data         | domain-model.md, database-schema.md                                      |
| API implementation    | api-conventions.md, graphql.md                                           |
| Auth                  | authentication.md, authorization.md, keycloak-setup.md                   |
| How code is written   | coding-standards.md, ui-guidelines.md                                    |
| Quality & ops         | testing.md, security.md, performance.md, observability.md, deployment.md |
| Process               | contributing.md, git-workflow.md, developer-setup.md, glossary.md        |
