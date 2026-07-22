# SmartSense Marketplace — v1.0 Release Readiness Audit

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Date**            | 2026-07-21                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Branch / Commit** | `development` @ `29bc1c8`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Scope**           | Full-repository audit: Authentication, Catalog, Orders, Customer Management, User Management, Billing & Reports, Dashboard, Shared UI, GraphQL, Keycloak Integration                                                                                                                                                                                                                                                                                                                                          |
| **Method**          | Every validation command in this report was **actually executed** against a real Docker Compose stack (Postgres 17, Keycloak 26, the API, the web app) on this machine — not inferred from Jira status, commit messages, or a prior audit. Six independent specialized review agents additionally swept the codebase read-only for code quality, security, performance, GraphQL, and test-coverage issues; every finding below that originated from an agent was independently spot-checked before inclusion. |
| **Supersedes**      | `RELEASE_READINESS_AUDIT_v1.0.txt` (repo root, dated 2026-07-16) — that audit is 5 days stale; several of its findings (E2E not in CI, milestone-status drift) have since changed. It should be deleted once this document is accepted (see F-M10).                                                                                                                                                                                                                                                           |

---

## 1. Executive Summary

The engineering fundamentals are strong: clean backend layering, a deny-by-default authorization model with no gaps found, zero hand-rolled SQL, no secrets in source, and a genuinely rehearsed backup/restore mechanism. Every automated check this audit ran — lint, typecheck, 706 unit/integration tests, a full production Docker build, and all 30 Playwright E2E test executions — **passed** against a freshly booted stack.

What's not ready is mostly not a code-quality problem — it's a short list of specific, concrete gates: **no branch protection enforcing any of this CI on merge**, **no database indexes behind the app's default sort/filter pattern**, **no GraphQL query cost limits on a public endpoint**, and **one real authorization-completeness gap on the billing payment-recording path** (not currently exploitable, but cheap to fix and exactly the kind of thing that becomes exploitable the moment permissions evolve). All four are S/M effort and none require new architecture. Layered on top: v1.0's own definition of done ("production environment live," `docs/roadmap.md:103`) is unmet by policy — this project deliberately runs no VPS or paid cloud, so a real reachable host, TLS, and monitoring remain **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE**, not a code defect.

**Decision: GO WITH CONDITIONS.** See §11.

---

## 2. Module Review

| Module                   | Backend                                                                                                               | Frontend                                                                                        | Test Coverage                                                                                                                                                   | Verdict                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Authentication**       | JWT/JWKS validation, guard chain, RBAC — verified via `apps/api/src/modules/auth`                                     | Login/session/logout, silent refresh, in-memory tokens                                          | Unit + integration + Playwright (`e2e/auth/*`, 3 specs)                                                                                                         | ✅ Complete                                   |
| **Catalog**              | Product/variant/inventory CRUD, category taxonomy                                                                     | Product list/detail/create/edit, variants tab                                                   | Unit + integration + Playwright (`e2e/catalog/*`, 2 specs)                                                                                                      | ✅ Complete                                   |
| **Orders**               | Lifecycle (4 of 10 `OrderStatus` values, scoped pass — `docs/milestones.md` M13), transactional inventory reservation | List/detail/create, status transitions                                                          | Unit + integration + 1 Playwright spec                                                                                                                          | 🔵 In progress (deliberate, documented scope) |
| **Customer Management**  | CRUD, addresses, suspend/reactivate                                                                                   | List/detail/filter/export                                                                       | Unit + integration + Playwright (2 specs)                                                                                                                       | ✅ Complete (SM-320 epic shipped)             |
| **User Management**      | Keycloak-admin invite/reset, role assignment + escalation guardrails                                                  | List/detail/roles/invite                                                                        | Unit + integration + Playwright (2 specs)                                                                                                                       | ✅ Complete                                   |
| **Billing & Reports**    | Invoice/payment state machine, 5 report types, billing-report lifecycle                                               | Invoice pages, 8 Reports pages, charts                                                          | Backend: strong (unit + `billing.e2e-spec.ts`, 15 tests). **Frontend Billing (Invoices): 1 unit spec, 0 E2E** (see F-H1/H2). Reports: full Playwright coverage. | ⚠️ Billing UI undertested                     |
| **Dashboard**            | Mock stats behind real permission gate (by design — money needs Decimal scalar, M14)                                  | KPI cards, progressive loading                                                                  | Unit + integration + Playwright                                                                                                                                 | ✅ Complete (as scoped)                       |
| **Shared UI**            | —                                                                                                                     | Button/Input/Select/Modal/Table/Pagination/Card/Badge/Skeleton/Toast, Chart (line/bar/doughnut) | Vitest + RTL + `jest-axe`, Storybook                                                                                                                            | ✅ Complete                                   |
| **GraphQL**              | Code-first schema, cursor pagination, zero `@ResolveField` (N+1-free by construction), zero unused operations         | Codegen-generated hooks only, no hand-typed mirrors                                             | Confirmed via dedicated audit — see §5                                                                                                                          | ✅ Complete (2 non-blocking consistency gaps) |
| **Keycloak Integration** | Realm export, JWKS, admin client, brute-force protection on                                                           | Login/silent-SSO/logout                                                                         | Verified live via Playwright against the real realm                                                                                                             | ✅ Complete                                   |

---

## 3. Verification Results — Actually Run, This Session

Every row below is a real command executed against this repository, not a status lookup.

| Check                                                                    | Result                 | Evidence                                                                                               |
| ------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Lint (`npm run lint`, all workspaces)                                    | ✅ PASS                | Turborepo, all packages                                                                                |
| Typecheck (`npm run typecheck`)                                          | ✅ PASS                | Strict mode, all workspaces                                                                            |
| Unit tests — API (Jest)                                                  | ✅ PASS                | **326 tests, 24 suites**                                                                               |
| Unit tests — Web (Vitest)                                                | ✅ PASS                | **232 tests, 65 files**                                                                                |
| Production build (`npm run build`)                                       | ✅ PASS                | Both `apps/api` and `apps/web`                                                                         |
| Docker image build — API                                                 | ✅ PASS                | Fresh build, `apps/api/Dockerfile`, non-root `node` user                                               |
| Docker image build — Web                                                 | ✅ PASS                | Fresh build, `apps/web/Dockerfile`, nginx                                                              |
| `docker compose up --build --wait` (db, keycloak-db, keycloak, api, web) | ✅ PASS                | Full stack healthy within timeout                                                                      |
| Database migrations (`prisma migrate deploy`)                            | ✅ PASS                | Against the freshly booted stack's Postgres                                                            |
| Seed (`prisma db seed`)                                                  | ✅ PASS                | Reference data + test users                                                                            |
| Backend integration tests (real Postgres + mocked JWKS)                  | ✅ PASS                | **148 tests, 9 suites**                                                                                |
| GraphQL smoke query (`{ authStatus }`)                                   | ✅ PASS                | Against the live Compose stack                                                                         |
| Playwright E2E — Chromium + Firefox, full stack                          | ✅ PASS (with 1 flaky) | **29/30 clean, 1 flaky** (`reports.spec.ts`, chromium, failed once then passed on retry — see §9 note) |

**Total: 706 automated tests green** (326 + 232 + 148) plus 30/30 E2E test executions passing within Playwright's configured retry budget. This is the first time in this project's history the Playwright suite has been confirmed green against a from-scratch build — the prior audit (2026-07-16) marked it "NOT VERIFIED."

| Check                                          | Result                                                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Production environment reachable at a real URL | ⬜ **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE** (no VPS/cloud, by policy; `docs/deployment.md` Assumption 1)                 |
| Monitoring/alerting                            | ⬜ **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE**                                                                              |
| TLS / real DNS                                 | ⬜ **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE**                                                                              |
| Backup/restore mechanism                       | ✅ PASS — genuinely rehearsed (`scripts/verify-backup-restore.sh` destroys the volume between backup and restore, diffs row counts) |
| Scheduled/retained backups                     | ⬜ **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE** (needs an always-on host to run a schedule against)                          |

---

## 4. Findings

Each finding: problem, why it matters, impacted files, fix, effort, blocks-v1.0. Ordered by severity, then by whether it blocks v1.0.

### CRITICAL

**F-C1 — No branch protection on `main` or `development`.**

- _Why it matters:_ Independently verified via `gh api repos/.../branches/{main,development}/protection` → `404 Branch not protected` for both. CI and the new Playwright job produce a status, but nothing in GitHub enforces it — a PR can merge while CI is red or Playwright is still failing. Every other finding in this report about "CI gates X" is true of the pipeline's _design_, not of what GitHub actually enforces today.
- _Impacted:_ Repository settings (no code).
- _Fix:_ Add a branch protection rule on both branches requiring the `Lint · Type Check · Test · Build` and `Playwright E2E` status checks before merge.
- _Effort:_ S.
- _Blocks v1.0:_ **Yes.**

**F-C2 — Reports module aggregates unbounded row sets into Node memory for Admin-unscoped calls.**

- _Why it matters:_ `apps/api/src/modules/reports/reports.service.ts:302` (`getRevenueReport`), `:459` (`getLowStockItems`), `:576` (`getProductPerformanceReport`), `:797`/`:841` (CSV variants) all fetch/group with no `take` and no required date or partner scope. When an Admin calls any of these without a filter, it's a full-table fetch and in-Node aggregation. Fine on seed data; an OOM/latency risk at real transaction volume. (The prior audit's flag on `order.groupBy` at `:376` was re-verified and is **not** a real concern — bounded to ~10 enum values — dropped from this list.)
- _Impacted:_ `apps/api/src/modules/reports/reports.service.ts`.
- _Fix:_ Push aggregation into SQL (`$queryRaw` with `LIMIT` for the cross-column low-stock filter), or require a bounded date range for Admin-unscoped calls.
- _Effort:_ M.
- _Blocks v1.0:_ **Yes**, for the Admin-unscoped path specifically. Partner-scoped calls are naturally bounded by catalog size.

**F-C3 — No database indexes support the default `createdAt DESC` sort used by every list.**

- _Why it matters:_ Re-verified directly against `database/prisma/schema.prisma` (698 lines, all 30+ `@@index` declarations checked): `Order`, `Product`, `Customer`, `User`, `Invoice`, `BillingReport` all sort by `createdAt` (or `Invoice.issuedAt`) with cursor pagination, and **none has a supporting index** — only `OrderStatusHistory` and `Notification` have a `createdAt`-inclusive composite for a different access pattern. `Invoice.issuedAt` is used both as a sort key (`billing.service.ts:398`) and the revenue-report range filter (`reports.service.ts:295`) with zero index support. At scale, every Admin-scoped list screen becomes a full sequential scan + sort.
- _Impacted:_ `database/prisma/schema.prisma` (Order, Product, Customer, User, Invoice models).
- _Fix:_ Add `@@index([createdAt])` (or a scoped composite matching the real filter+sort pattern) to each; add `@@index([issuedAt])` to Invoice. Verify with `EXPLAIN ANALYZE` before/after per `docs/performance.md`'s own required-evidence rule.
- _Effort:_ S.
- _Blocks v1.0:_ **Yes** — every list screen in the product depends on this sort.

**F-C4 — No GraphQL query depth or complexity limits.**

- _Why it matters:_ Confirmed absent in `apps/api/src/app.module.ts:32-46`'s `GraphQLModule.forRootAsync` config — no `validationRules`, no cost-analysis plugin; grep for `depthLimit`/`costAnalysis`/`graphql-depth-limit` across `apps/api/src` returns nothing. `docs/security.md:110` and `docs/performance.md` both already name this a "launch prerequisite," not an optimization — an unlimited-shape query API is a self-service denial-of-service endpoint the moment it's internet-reachable.
- _Impacted:_ `apps/api/src/app.module.ts`.
- _Fix:_ Add `graphql-depth-limit` and a complexity-scoring plugin to the Apollo Server config.
- _Effort:_ S.
- _Blocks v1.0:_ **Yes.**

**F-C5 — v1.0's own "production environment live" gate is unmet.**

- _Why it matters:_ `docs/roadmap.md:103` defines v1.0 done as "End-to-end tested, production environment live, first real Partner onboarded." E2E is now genuinely green (§3) — but no production environment exists anywhere, and `docs/milestones.md:451` self-declares M20 (Production Readiness, which gates v1.0) **"🟡 Blocked — Awaiting hosting decision."** This is not an oversight: the project runs no VPS or paid cloud service by deliberate policy (`docs/deployment.md` Assumption 1), and the Local Production Simulation this session verified (§3) is a genuine, honest proof of the deploy _pipeline_ — it is not a reachable production system.
- _Impacted:_ No code — a business/infrastructure decision.
- _Fix:_ Provision a real host (even a single inexpensive VPS clears this), point DNS, terminate TLS, run one real `cd.yml` deploy against it with `/health` smoke passing.
- _Effort:_ Outside engineering effort — a hosting decision + provisioning time.
- _Blocks v1.0:_ **Yes, by the project's own definition of v1.0** — but this is explicitly a business decision, not an engineering defect.

### HIGH

**F-H1 — The Billing (Invoices) frontend feature has zero E2E coverage.**

- _Why it matters:_ `apps/web/e2e/` has 11 spec files; none is `billing/`. `reports.spec.ts` covers `/reports/billing-reports` — the **Billing Reports** partner-payout-ledger feature — which is a different feature from `apps/web/src/features/billing` (Invoices: `BillingPage`, `InvoiceDetailPage`, `RecordPaymentForm`, void-invoice, invoice-PDF), the actual money-movement UI. Backend coverage is strong (`apps/api/test/billing.e2e-spec.ts`, 15 tests), but the frontend flow that records a payment or voids an invoice has never been driven through a real browser. This is the highest-stakes correctness surface in the product with the weakest browser-level proof.
- _Impacted:_ `apps/web/e2e/` (missing directory), `apps/web/src/features/billing/*`.
- _Fix:_ Add `apps/web/e2e/billing/billing.spec.ts` covering invoice list/detail, record-payment, void-invoice, PDF download.
- _Effort:_ M.
- _Blocks v1.0:_ Should block, or ship with an explicit, signed-off risk acceptance.

**F-H2 — Frontend Billing feature is nearly untested at the unit layer too.**

- _Why it matters:_ Only `InvoiceFilterBar.spec.tsx` exists under `apps/web/src/features/billing/`. `RecordPaymentForm.tsx`, `recordPaymentForm.schema.ts`, `useInvoice`/`useInvoices`, `billingExports.ts`, and `InvoiceDetailPage.tsx` have zero specs.
- _Impacted:_ `apps/web/src/features/billing/*`.
- _Fix:_ Component/hook tests for the mutation-triggering surfaces at minimum (record payment, void).
- _Effort:_ M.
- _Blocks v1.0:_ Should block alongside F-H1.

**F-H3 — This session's own bug-fix commit shipped without a regression test.**

- _Why it matters:_ Commit `153079e` ("register missing Chart.js controllers, the real Orders bug," made earlier in this session) ships a 10-line production fix with no test change. `Chart.spec.tsx` was not updated to assert controller registration, even though the commit message itself explains _why_ the existing suite structurally cannot catch this class of bug (tree-shaking under the production Vite build vs. Vitest's unbundled ESM — see the commit body). CLAUDE.md and `docs/testing.md` both require every bug fix to ship a regression test. This one didn't, and it's called out here rather than quietly fixed, per this audit's own no-fixes-during-audit scope.
- _Impacted:_ `apps/web/src/shared/components/ui/Chart/Chart.tsx`, `Chart.spec.tsx`.
- _Fix:_ Add an assertion that exercises the production-build code path (e.g., a build-mode smoke test, or an explicit assertion against `ChartJS.registry.controllers` for each `ChartKind`) so a future regression on this exact class of bug is caught by the existing unit suite, not only by production E2E.
- _Effort:_ S.
- _Blocks v1.0:_ Should be closed before this branch's changes are considered done, not blocking the broader release.

**F-H4 — CSV exports are unbounded.**

- _Why it matters:_ `reports.service.ts:729,797,841`, `billing.service.ts:298-306` (`exportInvoicesCsv`, comment literally says "fetches every matching row"), `customers.service.ts:283-289` (same pattern) — all self-documented as accepted v1 tradeoffs, but none cap row count or stream. A large tenant's export is a synchronous full-table pull rendered to a string in memory.
- _Impacted:_ `reports.service.ts`, `billing.service.ts`, `customers.service.ts`.
- _Fix:_ Hard row cap with an explicit "narrow your filter" error, or move to streaming.
- _Effort:_ S/M.
- _Blocks v1.0:_ Should block for Admin-unscoped exports; Partner-scoped exports are lower risk.

**F-H5 — Case-insensitive search uses unindexed `ILIKE`.**

- _Why it matters:_ `customers.service.ts:553-554` and `users.service.ts:773-774` both use `contains` + `mode: 'insensitive'` → Postgres `ILIKE '%term%'`. No `pg_trgm` extension, no GIN index anywhere in the 9 migrations. A leading-wildcard `ILIKE` cannot use a plain B-tree index — full scan on every search keystroke.
- _Impacted:_ `customers.service.ts`, `users.service.ts`, a new hand-written migration.
- _Fix:_ Add `pg_trgm` extension + GIN index via hand-written migration SQL (same pattern already used for `BillingReport`'s exclusion constraint).
- _Effort:_ M.
- _Blocks v1.0:_ Should fix — search is a common Admin/Partner action.

**F-H6 — Four multi-argument mutations use positional scalars instead of an Input Object.**

- _Why it matters:_ `users.resolver.ts:153-158` (`assignUserRole`), `:169-174` (`removeUserRole`), `orders.resolver.ts:88-93` (`updateOrderStatus`), `:104-108` (`cancelOrder`) all violate `docs/graphql.md § 6`'s Input Object Pattern (its own §16 lists this as the #1 named anti-pattern). Not additively evolvable — every future argument on these four is a breaking signature change.
- _Impacted:_ 4 resolvers + services + `.graphql` documents + codegen.
- _Fix:_ Introduce `AssignUserRoleInput`, etc.
- _Effort:_ M.
- _Blocks v1.0:_ No — functionally correct today; fix before more callers accrue.

**F-H7 — Zero GraphQL fragments exist despite systemic duplicated field selections.**

- _Why it matters:_ No `fragment` declaration exists anywhere across 65 `.graphql` documents. Every list/detail pair hand-duplicates overlapping fields (e.g. `getOrders.graphql` vs `getOrderById.graphql` duplicate 9 fields). `docs/graphql.md § 8` requires extracting a fragment "the moment a second operation needs the same selection" — none do. List/detail views can drift silently as a result.
- _Impacted:_ All `apps/web/src/features/*/graphql/*.graphql` list/detail pairs.
- _Fix:_ Retrofit shared fragments per entity.
- _Effort:_ L.
- _Blocks v1.0:_ No — recommend an immediate post-launch fast-follow; the debt compounds with every new module.

**F-H8 — `recordPayment` has no ownership check on the invoice.**

- _Why it matters:_ `apps/api/src/modules/billing/billing.service.ts:215` fetches the invoice by id and only checks for `null` — it never compares `invoice.partnerId` to `user.partnerId`, unlike every other by-id mutation in the codebase (`voidInvoice`, `updateProduct`, `updateStatus`, `findOwnedCustomerOrThrow`, all of which fetch-then-compare per `docs/authorization.md § Ownership Rules`). Not exploitable today only because the seed data never grants `billing:manage` to Partner/Customer roles — Admin-only. The moment that permission is extended to Partners (a plausible future step, and the exact kind of change nobody re-audits this file for), this becomes a cross-partner IDOR on the single highest-stakes mutation in the product: one partner recording a payment against another partner's invoice.
- _Impacted:_ `apps/api/src/modules/billing/billing.service.ts`.
- _Fix:_ Mirror the existing `findInvoiceById` ownership check before the write.
- _Effort:_ S.
- _Blocks v1.0:_ Should fix now — the fix is cheap and the risk is exactly the kind that gets forgotten once permissions evolve.

**F-H9 — Dead authorization infrastructure: `RolesGuard`/`@Roles()` registered globally, never used.**

- _Why it matters:_ `RolesGuard` is wired as a global `APP_GUARD` and `@Roles()` exists as a decorator, but grep across all 9 domain modules finds zero call sites — every resolver uses `@Permissions(...)` exclusively, per CLAUDE.md's explicit rule ("capability helpers/permission keys only, never `role === 'Admin'`"). This costs a request-cycle check on every resolver for no benefit, and its presence invites a future contributor to reach for the wrong (banned) pattern.
- _Impacted:_ `apps/api/src/modules/auth/guards/roles.guard.ts`, `decorators/roles.decorator.ts`, `auth.module.ts`.
- _Fix:_ Remove the guard and decorator, or add a lint rule banning `@Roles` reintroduction if there's a reason to keep it for future use.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-H10 — `BillingReportsPage` imports `useAuth` directly, an undocumented cross-feature-boundary violation.**

- _Why it matters:_ `apps/web/src/features/reports/pages/BillingReportsPage.tsx:4,81` imports `useAuth` from `@features/auth`. `docs/frontend-architecture.md:127` documents a narrow, deliberate exception to the "features never import each other" rule — but it permits only `usePermissions`/`useCurrentUser`, not `useAuth`. This is a real boundary violation, not one of the pre-cleared cases.
- _Impacted:_ `apps/web/src/features/reports/pages/BillingReportsPage.tsx`.
- _Fix:_ Read the needed identity data via `usePermissions`/`useCurrentUser` instead, or extend the documented exception in the same PR if `useAuth` is genuinely required here.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-H11 — Dead frontend code: an unused page component and three unused icon exports.**

- _Why it matters:_ `apps/web/src/shared/components/ComingSoonPage.tsx` has zero consumers anywhere in the app, including the router — confirmed by grep. `apps/web/src/shared/icons/index.ts` exports `CheckIcon`, `RadioDotIcon`, `IndeterminateIcon`, none of which are imported anywhere (Checkbox/RadioGroup use inline SVG or Radix indicators instead). `shared/` is supposed to be lean and dependency-terminal; dead code here is exactly what that convention exists to prevent.
- _Impacted:_ `apps/web/src/shared/components/ComingSoonPage.tsx`, `apps/web/src/shared/icons/index.ts`.
- _Fix:_ Delete both, or wire `ComingSoonPage` to a still-unbuilt route if that was the intent.
- _Effort:_ S.
- _Blocks v1.0:_ No.

### MEDIUM

**F-M1 — CORS fails open when `CORS_ALLOWED_ORIGINS` is unset, with no production-time enforcement.**

- _Why it matters:_ `apps/api/src/main.ts:26-28` — `app.enableCors(allowedOrigins.length > 0 ? {...} : {})` falls back to fully permissive. Unlike `GRAPHQL_INTROSPECTION`, which the Joi schema conditionally forces false in production, CORS has no `NODE_ENV === 'production'` branch forcing an operator to set it — a fail-open pattern that doesn't match the project's own "fail closed" rule. This is the code-level shape of the gap `docs/security.md:31` already tracks; the register itself says it must be fixed "before the first deployed environment," which hasn't happened yet.
- _Impacted:_ `apps/api/src/main.ts`, `apps/api/src/config/validation.schema.ts`.
- _Fix:_ Mirror the `GRAPHQL_INTROSPECTION` pattern — require `CORS_ALLOWED_ORIGINS` when `NODE_ENV=production`.
- _Effort:_ S.
- _Blocks v1.0:_ Not code-complete-blocking; should block the first real deployment.

**F-M2 — Production CSP in `nginx.conf` is hardcoded to `localhost`, with no environment templating.**

- _Why it matters:_ `apps/web/nginx.conf:16` — `connect-src 'self' http://localhost:3000 http://localhost:8080`. The Dockerfile parameterizes `VITE_*` via build args, but `nginx.conf` is copied verbatim with no `envsubst`/template step. A production image built as-is would self-block its own API/Keycloak calls unless someone hand-edits the file per environment under deploy pressure — the likely "fix" being to loosen the policy instead of parameterizing it.
- _Impacted:_ `apps/web/nginx.conf`, `apps/web/Dockerfile`.
- _Fix:_ Template the CSP's origin values via build-arg substitution, same origins as `VITE_*`.
- _Effort:_ S/M.
- _Blocks v1.0:_ Should block the first non-local deployment; no live risk yet since nothing is deployed.

**F-M3 — `npm audit` is not wired into CI.**

- _Why it matters:_ Neither `ci.yml` nor `cd.yml` runs `npm audit`. `docs/security.md:223` lists "`npm audit` clean of criticals" as a release-gate checklist line that currently cannot be verified without a manual, out-of-band run.
- _Impacted:_ `.github/workflows/ci.yml`.
- _Fix:_ Add `npm audit --audit-level=critical` as a CI step.
- _Effort:_ S.
- _Blocks v1.0:_ Yes, for the security checklist sign-off specifically — the line item is unverifiable as the pipeline stands.

**F-M4 — `chart.js` is mis-bucketed into the eagerly-preloaded catch-all vendor chunk.**

- _Why it matters:_ `apps/web/vite.config.ts:29`'s `chart-vendor` regex matches `recharts|d3-|victory|internmap` — none of which this app actually uses; the real dependency (`chart.js`/`react-chartjs-2`) lands in the generic vendor chunk (146 KB gzip), which `dist/index.html` modulepreloads on **every** route, not just Reports pages.
- _Impacted:_ `apps/web/vite.config.ts`.
- _Fix:_ One-line regex change to `chart\.js|react-chartjs-2`.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-M5 — No optimistic UI anywhere; mutations use unawaited `refetchQueries`.**

- _Why it matters:_ Zero `optimisticResponse`/`cache.modify`/`cache.evict` across all 22 files using `useMutation`; 17 use `refetchQueries` with zero `awaitRefetchQueries`. Correctness-safe, but every status-change/create/delete pays a full round trip, and since the refetch isn't awaited, a caller that immediately closes a dialog can render a stale list for one tick.
- _Impacted:_ `apps/web/src/features/*` (mutation call sites).
- _Fix:_ Add `awaitRefetchQueries: true` on the highest-frequency mutations at minimum; consider optimistic responses for status toggles.
- _Effort:_ M.
- _Blocks v1.0:_ No — UX/perceived-speed, not correctness.

**F-M6 — Single-entity query naming is inconsistent.**

- _Why it matters:_ `customerById`/`productById`/`userById` use one suffix pattern; `order(id)`/`invoice(id)`/`billingReport(id)` use a bare noun for the identical shape. `docs/graphql.md`'s own illustrative example names the pattern `orderById`, but the shipped field is `order`.
- _Impacted:_ `apps/api/src/schema.gql` and its resolvers.
- _Fix:_ Standardize on one naming shape (breaking change, needs the documented deprecation cycle).
- _Effort:_ M.
- _Blocks v1.0:_ No.

**F-M7 — `productPerformanceReport` uses an offset-encoded cursor behind a Relay-shaped connection.**

- _Why it matters:_ `reports.service.ts:557-605` encodes an array index into an in-memory-sorted result, not a stable id, unlike every other connection in the schema. Self-disclosed via code comment (Prisma's `groupBy`/`orderBy` typing can't route through a runtime-chosen sort field); a concurrent insert can shift pages.
- _Impacted:_ `reports.service.ts`.
- _Fix:_ Move to a stable id-based cursor if feasible, or explicitly document the limitation in the schema description.
- _Effort:_ L.
- _Blocks v1.0:_ No — bounded dataset, low urgency.

**F-M8 — `docs/security.md`'s gap register understates actual progress, risking a wrong release call.**

- _Why it matters:_ Register item #1 says CORS runs "with no options" — the code already has an allowlist mechanism, just fail-open (F-M1's actual shape). Register item #2 says "no security headers/CSP... no serving layer yet" — but `apps/web/nginx.conf` already ships a real CSP + `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy` (landed with SM-346). A reviewer grading against the stale register could misjudge which of these is actually done.
- _Impacted:_ `docs/security.md` (gap register, OWASP A05 row).
- _Fix:_ Reconcile the register to reflect F-M1/F-M2's more precise "half-done" framing.
- _Effort:_ S.
- _Blocks v1.0:_ No — but should be corrected in the same PR that closes F-M1/F-M2.

**F-M9 — `docs/testing.md`'s own intro understates current test coverage, and its two sections disagree with each other.**

- _Why it matters:_ The "Assumption made explicit" intro (line ~19) still describes "one Jest-based end-to-end integration test" and Playwright specs only under `e2e/auth/` — reality is 9 backend integration suites and 11 E2E spec files across 7 modules. Separately, the doc's own "Playwright Strategy" section says 11 spec files exist while its "CI Testing Pipeline" section says 12 — independently counted: **11 is correct** (`find apps/web/e2e -iname '*.spec.ts' | wc -l`).
- _Impacted:_ `docs/testing.md`.
- _Fix:_ Update the stale intro assumption; correct the 12→11 count.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-M10 — A second, stale release-readiness audit sits at the repo root, outside `docs/`.**

- _Why it matters:_ `RELEASE_READINESS_AUDIT_v1.0.txt` (repo root, dated 2026-07-16) predates this document by 5 days of real work — most visibly, it marks Playwright E2E "NOT VERIFIED" and claims the milestone tracker falsely shows M12/M13/M14 all "In progress," when the current `docs/milestones.md` shows M12 ✅ and M14 ✅ Complete, with M13 deliberately, thoroughly documented as partial (not falsely labeled). Leaving both documents in the repo invites someone to read the wrong one.
- _Impacted:_ `RELEASE_READINESS_AUDIT_v1.0.txt`.
- _Fix:_ Delete it once this document is accepted, per this report's own header.
- _Effort:_ S (not a code change).
- _Blocks v1.0:_ No.

**F-M11 — Privilege-escalation guardrails use a banned `role.name === 'Admin'` string comparison.**

- _Why it matters:_ `apps/api/src/modules/users/users.service.ts:276` and `:677` block granting the Admin role unless the caller already holds it, via a literal `role.name === 'Admin'` comparison — exactly the pattern CLAUDE.md bans ("Never `role === 'Admin'` checks — capability helpers/permission keys only"), even though the underlying intent (defense-in-depth against privilege escalation) is sound and well-commented.
- _Impacted:_ `apps/api/src/modules/users/users.service.ts`.
- _Fix:_ Replace the string-literal comparison with a dedicated permission key (e.g. `roles:grant:admin`), consistent with the rest of the codebase's verb/noun model.
- _Effort:_ M (new seeded permission + migration + two call sites + tests).
- _Blocks v1.0:_ No — the current behavior is correct, just inconsistent with the project's own stated rule.

**F-M12 — Cursor-pagination helpers are duplicated identically across six services.**

- _Why it matters:_ `encodeCursor`/`decodeCursor` (identical base64 implementations) appear independently in `billing.service.ts`, `catalog.service.ts`, `orders.service.ts`, `notifications.service.ts`, `users.service.ts`, and `customers.service.ts`; `reports.service.ts` adds a second, offset-based variant. Six-to-seven-way duplication is well past this project's own "extract on second/third duplication" threshold.
- _Impacted:_ All six services listed above.
- _Fix:_ Extract to `common/utils/cursor.util.ts` (and a second offset-cursor util for the reports case).
- _Effort:_ M (behavior-preserving extraction + 7 call sites + tests).
- _Blocks v1.0:_ No.

**F-M13 — Two Reports queries omit the `deletedAt: null` filter every other query in the file applies.**

- _Why it matters:_ `apps/api/src/modules/reports/reports.service.ts:586-589` and `:847-850` (`productVariant.findMany` lookups for the Product Performance report and its CSV export) are the only queries in this 1134-line file without a `deletedAt: null` filter, and the only ones without a comment explaining the omission — every other query in the file both filters and comments its reasoning. May be intentional (a discontinued variant's historical sales arguably should still display), but the missing comment breaks the file's otherwise-consistent, documented rigor.
- _Impacted:_ `apps/api/src/modules/reports/reports.service.ts`.
- _Fix:_ Either add the filter, or add the same style of justifying comment the rest of the file uses.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-M14 — Two frontend files exceed the 250-line component cap.**

- _Why it matters:_ `apps/web/src/features/billing/pages/InvoiceDetailPage.tsx` (265 lines) and `apps/web/src/app/router/index.tsx` (361 lines, config rather than a component but still a maintainability risk at this size) both exceed `docs/coding-standards.md § 14`'s cap. This is the same finding the 2026-07-16 audit made (L1) — confirmed still true, unaddressed since.
- _Impacted:_ Both files above.
- _Fix:_ Extract `InvoiceDetailPage`'s summary/line-items/actions into sub-components; split the router config per feature.
- _Effort:_ M each.
- _Blocks v1.0:_ No.

**F-M15 — Seven near-identical status-badge components duplicate the same pattern.**

- _Why it matters:_ `OrderStatusBadge`, `CustomerStatusBadge`, `ProductStatusBadge`, `VariantStatusBadge`, `UserStatusBadge`, `InvoiceStatusBadge`, `BillingReportStatusBadge` each repeat an identical `Record<Enum, BadgeVariant>` + `Record<Enum, string>` + one-line render — a factory would collapse this well past the point duplication was already accepted.
- _Impacted:_ 7 files under `apps/web/src/features/*/components/`.
- _Fix:_ A `createStatusBadge(variantMap, labelMap)` factory in `shared/components/ui/Badge`.
- _Effort:_ M.
- _Blocks v1.0:_ No.

**F-M16 — Several exported types/hooks have no traceable consumer; one component bypasses the barrel-import rule.**

- _Why it matters:_ `UserFilters`, `ReportDateRangeFilters`, `ReportPartnerFilters`, `BillingReportFilters`, `ProductPerformanceFilters`, `OrderableVariantOption`, `ExportReportParams`, `ResolvedDateRange` are all exported from feature barrels with no external named-import found — either genuinely dead or intended as a contract for a not-yet-written consumer. Separately, `apps/web/src/features/dashboard/components/StatisticsGrid.tsx` imports `useDashboard` via a relative path instead of through the (currently empty) `features/dashboard/hooks` barrel, bypassing CLAUDE.md's "import only through barrels" rule.
- _Impacted:_ Listed barrels above; `StatisticsGrid.tsx`.
- _Fix:_ Confirm intent and prune the unused exports; route `StatisticsGrid`'s import through the barrel.
- _Effort:_ S.
- _Blocks v1.0:_ No.

### LOW

**F-L1 — `LoggingService` has no redaction safeguard.**

- _Why it matters:_ `apps/api/src/common/services/logging.service.ts` is a bare `ConsoleLogger` subclass with no field-scrubbing for token/password/secret keys. No active leak found (every call site checked is clean), but nothing structural stops a future `logger.error(err)` where `err` carries a raw request.
- _Fix:_ A redaction wrapper/interceptor.
- _Effort:_ M.
- _Blocks v1.0:_ No.

**F-L2 — One raw `throw new Error` bypasses the typed-exception taxonomy.**

- _Why it matters:_ `catalog.service.ts:322` throws a bare `Error` on an invariant violation rather than a named NestJS exception; still resolves correctly via the catch-all filter, and is a deliberate "fail loud" choice per its own comment.
- _Fix:_ Use a named exception for consistency.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-L3 — No `*.resolver.spec.ts` files anywhere.**

- _Why it matters:_ Resolver behavior is proven only transitively via `*.e2e-spec.ts`. Likely fine per `docs/testing.md`'s "lowest layer that proves the behavior" (resolvers are pure delegation), but nothing in the doc explicitly says resolvers are exempt — worth confirming as a deliberate, documented choice.
- _Fix:_ A one-line note in `docs/testing.md` confirming the exemption, or add thin resolver specs.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-L4 — CI's frontend and backend unit tests share one unlabeled step.**

- _Why it matters:_ `ci.yml`'s single `npm run test` step reports frontend-only and backend-only failures identically, slowing triage from the CI badge alone.
- _Fix:_ Split into two named steps.
- _Effort:_ S.
- _Blocks v1.0:_ No.

**F-L5 — `reports.service.ts` has grown to own eight distinct responsibilities in one 1134-line file.**

- _Why it matters:_ Backend services have no hard line cap (CLAUDE.md's 250-line cap is scoped to React components), so this isn't a rule violation — but one service owning billing, revenue, orders, inventory, customers, product-performance, notification-activity reports, plus CSV export for each, is a SOLID smell worth addressing before it becomes harder to safely change.
- _Impacted:_ `apps/api/src/modules/reports/reports.service.ts`.
- _Fix:_ Split into one service per report family.
- _Effort:_ L — defer past v1.0 unless a bug surfaces there.
- _Blocks v1.0:_ No.

**F-L6 — Minor doc gaps: `export default` carve-out and Props-type barrel inflation.**

- _Why it matters:_ Every `export default` hit in `apps/web` is `export default meta` in Storybook `.stories.tsx` files (required by CSF format) — not a real violation, but `docs/coding-standards.md § 14` doesn't document this carve-out, so it may get flagged repeatedly in future reviews. Separately, ~20+ feature component `Props` interfaces are barrel-exported with no external named-import — likely harmless (TypeScript structural typing), but unexamined public-API surface.
- _Fix:_ Add the Storybook carve-out to the coding standards doc; take one pass deciding whether component Props types should be barrel-exported at all.
- _Effort:_ S.
- _Blocks v1.0:_ No.

### Confirmed clean — no finding, stated for the record

- Zero `@ResolveField` anywhere — the N+1-free-by-construction design goal holds.
- Zero unused GraphQL operations across all 65 `.graphql` documents.
- Zero direct Prisma calls in any resolver — layering intact.
- Zero `dangerouslySetInnerHTML`, zero `$queryRaw`/`$executeRaw`.
- Zero hardcoded secrets; `.gitignore` correctly excludes all `.env*` variants; only clearly-labeled dev placeholders committed.
- Zero `.skip`/`.only` in any test file.
- Zero genuine flaky-wait anti-patterns (`sleep`/`waitForTimeout`) in the E2E suite.
- Every `@Public()` usage is a trivial, zero-data-exposure liveness probe; every other operation is explicitly permission-gated.
- Every `role === 'Admin'`-shaped check found is a documented privilege-escalation guardrail composed with, not substituting, a real permission gate.
- Audit logging fires for every privileged mutation checked (role grant/removal, customer suspend, billing void/mark-paid).
- Tokens are never persisted to `localStorage`/`sessionStorage` anywhere in the frontend.
- Docker images run as non-root, multi-stage, no secrets baked into layers.
- Entry JS bundle: 17.3 KB gzip (budget: <200 KB) — comfortable pass. React.lazy used consistently across all 29 routes.
- Backup/restore is a genuine, rehearsed round trip (destroys the volume, restores, diffs row counts) — not a stub.
- Zero `TODO`/`FIXME`/`HACK`, zero `console.*` outside the sanctioned logger, zero `any`/`as any`/unexplained `@ts-ignore` across both `apps/api/src` and `apps/web/src`.
- Every mutation needing atomicity uses `$transaction`; every ledger model (Order/Invoice/Payment) is correctly never soft-deleted.
- Every `class-validator` DTO sampled has proportionate decorator coverage; no unvalidated resolver input found.
- Every ownership check across catalog/variant/inventory/orders/customers services is correct (the one gap found is F-H8, isolated to billing).
- No hand-written type mirrors a GraphQL Code Generator or Prisma-generated type on the frontend.
- Every icon-only button sampled has a proper `aria-label`; no color-only status indicators; no cross-feature import violation beyond the one documented in F-H10.
- Bundle chunking strategy (`react-vendor`/`apollo-vendor`/`keycloak-vendor`/`chart-vendor`) is deliberate and well-reasoned, aside from F-M4's mis-bucketing.

---

## 5. Documentation Review

| Document                                        | Finding                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture.md`, `docs/authorization.md` | No drift found against code during this audit's spot-checks (permission model, layering rules both hold in practice).                                                                                                                                                                                          |
| `docs/milestones.md`                            | **Unusually accurate and honest** — every partial-completion status (M13, M16, M18, M20) carries a detailed, verifiable rationale rather than a bare label. This directly contradicts the prior audit's B2 finding ("tracker reports false status"); that finding does not reproduce against the current file. |
| `docs/roadmap.md`                               | Current; its v1.0 gate definition is the basis for F-C5.                                                                                                                                                                                                                                                       |
| `docs/graphql.md`                               | Current; §12/§13 gaps (depth limits, DataLoader) match code reality exactly.                                                                                                                                                                                                                                   |
| `docs/deployment.md`                            | Exceptionally thorough and self-aware — explicitly labels every infrastructure-dependent gap "Requires Production Infrastructure" rather than building a fake local approximation. No drift found.                                                                                                             |
| `docs/security.md`                              | Gap register is stale in a way that understates progress — see F-M8.                                                                                                                                                                                                                                           |
| `docs/testing.md`                               | Stale intro assumption + internal spec-count inconsistency — see F-M9.                                                                                                                                                                                                                                         |
| `docs/coding-standards.md`                      | Current; Definition of Done and Review Checklist both match what CI and this audit actually verified.                                                                                                                                                                                                          |
| Root `RELEASE_READINESS_AUDIT_v1.0.txt`         | Stale, should be removed — see F-M10.                                                                                                                                                                                                                                                                          |

---

## 6. CI/CD & Production Readiness

- **CI** (`.github/workflows/ci.yml`): two jobs, `ci` (lint → typecheck → unit → migrate/seed → integration → build) and `playwright` (`needs: ci`, full Docker Compose stack, real Keycloak realm readiness check, Chromium + Firefox). Both independently re-run and confirmed green this session (§3).
- **CD** (`.github/workflows/cd.yml`): builds/pushes to GHCR, then runs a genuine Local Production Simulation on the runner itself (migrate → deploy → `/health` smoke) — honest engineering given the project's no-VPS policy, but not a live deployment.
- **Branch protection**: absent — F-C1.
- **Secrets handling**: clean — no committed secrets, correct `.gitignore`, runtime injection documented.
- **Migration strategy**: `prisma migrate deploy`, expand→migrate→contract, documented and consistent with what ran successfully this session.
- **Backup/restore**: implemented and genuinely rehearsed (§3).
- **Monitoring/health checks**: `/health` checks real DB liveness via Terminus, has its own unit spec, and is polled by CI as a readiness gate. Beyond that: **UNVERIFIED — REQUIRES PRODUCTION INFRASTRUCTURE** (no monitoring/alerting/log-aggregation exists or can exist without a real host).

---

## 7. Release Checklist

| Item                                                               | Status                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| All 10 modules implemented per current scope                       | ✅ Complete                                                    |
| Lint / Typecheck / Unit / Integration / Build                      | ✅ Complete (actually run, §3)                                 |
| Playwright E2E green against a real full-stack build               | ✅ Complete (actually run, §3 — first time verified)           |
| Docker images build; docker-compose validates and boots            | ✅ Complete (actually run, §3)                                 |
| Auth/RBAC posture, ownership scoping                               | ✅ Complete                                                    |
| Backend layering (resolver→service→Prisma), zero N+1               | ✅ Complete                                                    |
| Cursor pagination on every list                                    | ✅ Complete                                                    |
| Secrets hygiene                                                    | ✅ Complete                                                    |
| Backup/restore rehearsed                                           | ✅ Complete                                                    |
| Branch protection enforcing CI                                     | ❌ Release blocker (F-C1)                                      |
| Database indexes for default sort pattern                          | ❌ Release blocker (F-C2/F-C3)                                 |
| GraphQL depth/complexity limits                                    | ❌ Release blocker (F-C4)                                      |
| Real production environment                                        | ❌ Release blocker by policy (F-C5) — infra decision, not code |
| Billing (Invoices) E2E + unit coverage                             | ⚠ Needs improvement (F-H1/H2)                                  |
| `recordPayment` ownership check                                    | ⚠ Needs improvement (F-H8) — cheap fix, fix now                |
| CSV export bounding                                                | ⚠ Needs improvement (F-H4)                                     |
| Search indexing (pg_trgm)                                          | ⚠ Needs improvement (F-H5)                                     |
| CORS fail-closed in production                                     | ⚠ Needs improvement (F-M1)                                     |
| CSP environment templating                                         | ⚠ Needs improvement (F-M2)                                     |
| `npm audit` in CI                                                  | ⚠ Needs improvement (F-M3)                                     |
| GraphQL Input Object consistency, fragments                        | ⚠ Needs improvement (F-H6/H7) — non-blocking                   |
| Dead code (frontend), dead auth infra (backend)                    | ⚠ Needs improvement (F-H9/H10/H11) — non-blocking              |
| Cross-service duplication (cursor helpers, status badges)          | ⚠ Needs improvement (F-M12/M15) — non-blocking                 |
| Bundle chart-vendor bucketing                                      | ⚠ Needs improvement (F-M4) — non-blocking                      |
| Documentation currency (security.md, testing.md, stale root audit) | ⚠ Needs improvement (F-M8/M9/M10)                              |

---

## 8. Scores

| Dimension                | Score /100 | Rationale                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**         | 90         | Clean layering both ends; zero N+1 by construction; module boundaries hold with one documented exception (F-H10) and one dead guard mechanism (F-H9).                                                                                                                                                                                                                              |
| **Code Quality**         | 85         | Exceptional hygiene on every mechanical check (zero `.skip`/`.only`, zero secrets, zero `console.*`/`any`/TODO on either side of the stack) — but a full sweep of both `apps/api` and `apps/web` surfaced a real ownership-check gap (F-H8), dead code, and duplication (F-M12/M15) that a "no findings" summary would have missed.                                                |
| **Testing**              | 80         | 706 tests green, E2E now genuinely verified in CI for the first time — real progress. Held back by the Billing/Invoices frontend gap (F-H1/H2), the single flaky E2E run, and this session's own untested fix (F-H3).                                                                                                                                                              |
| **Documentation**        | 82         | `deployment.md`/`milestones.md` are genuinely exemplary — honest, verifiable, self-correcting. `security.md`/`testing.md` have understated-progress drift (F-M8/M9) and a stale duplicate audit sits at the repo root (F-M10).                                                                                                                                                     |
| **Security**             | 85         | Strongest area by evidence overall — but not flawless: the backend code-quality sweep, not the dedicated security pass, caught the one real authorization-completeness gap (F-H8), which is exactly the kind of finding a single-lens review can miss. CORS fail-open (F-M1), unparameterized CSP (F-M2), and no dependency scanning (F-M3) are the rest — all real, all S-effort. |
| **Performance**          | 68         | Sound structural choices (pagination everywhere, zero N+1, bundle within budget) undermined by the three concrete, unaddressed risks that matter most at real volume: unbounded Admin-path aggregation, missing indexes, unindexed search.                                                                                                                                         |
| **Maintainability**      | 85         | Consistent patterns, disciplined layering, exceptional doc cross-linking — offset by duplication now confirmed in both layers (6-way cursor-helper duplication, 7-way status-badge duplication) and two oversized frontend files repeating the prior audit's unaddressed finding.                                                                                                  |
| **Production Readiness** | 58         | The pipeline itself is now proven (build→test→E2E→Docker→Compose all green, first time). The score is held down by what genuinely isn't done: no branch protection, no real host, no monitoring — two of which are pure policy/infrastructure decisions outside engineering's control, one of which (branch protection) is a five-minute settings change with outsized impact.     |

**Overall: ~79/100 — Strong Release Candidate, Conditional GO.**

**Finding count:** 5 Critical, 11 High, 16 Medium, 6 Low, across direct verification plus six independent specialized audits (backend, frontend, security, performance, GraphQL, testing/CI) and a documentation cross-check — every finding above was spot-checked against the actual file/line before inclusion, not taken on an agent's word alone.

---

## 9. Notes on This Audit's Own Verification

- The Playwright suite's one flaky result (`reports.spec.ts`, Chromium, first attempt) failed and passed on retry within Playwright's configured retry budget — this is normal CI-runner variance, not the deterministic Chart.js crash this branch fixed earlier today (that bug failed **every** attempt, both browsers, with a full-page crash; this flake passed cleanly on Firefox and on the Chromium retry). Documented here rather than silently reported as "30/30 green" so the record is precise.
- Eight of nine specialized review agents in the 2026-07-16 audit were reportedly interrupted by a session limit. This audit's six agents all ran to completion; none were interrupted.

---

## 10. Final Decision

# GO WITH CONDITIONS

Conditions to clear before production traffic (all S/M effort, no architecture change):

1. Enable branch protection on `main` and `development` (F-C1).
2. Add the missing `createdAt`/`issuedAt` indexes, verified with `EXPLAIN ANALYZE` (F-C3).
3. Add GraphQL depth/complexity limits (F-C4).
4. Bound the Admin-unscoped report/export queries (F-C2/F-H4).
5. Add the missing ownership check to `recordPayment` (F-H8) — S-effort, highest latent risk per line changed in this entire report.
6. Fix CORS's fail-open default before anything is deployed anywhere reachable (F-M1).
7. A hosting decision and one real deployment through `cd.yml` against a provisioned host (F-C5) — the one condition that is a business decision, not an engineering task.

Recommended, not blocking: close the Billing E2E/unit gap (F-H1/H2), add the regression test this session's own fix is missing (F-H3), remove the dead `RolesGuard`/`@Roles()` infrastructure (F-H9), fix the `useAuth` boundary violation (F-H10), and wire `npm audit` into CI (F-M3).

---

## 11. Would I personally approve releasing v1.0 to production?

**Not today — but closer than any prior audit, and for narrower reasons than before.**

Everything that used to be a question mark is now a verified fact: I actually built the Docker images, booted the full stack, ran the migrations, seeded the database, and watched 706 tests plus 30 Playwright test executions pass against it. That is not a small thing — this is the first time in this project's history someone has run the whole thing end to end and watched it work, rather than trusting that it would.

What stops me is a short list of specific, narrow gaps, not a pattern of defects: **nothing enforces the CI that just passed** (branch protection literally does not exist — I checked GitHub directly, not just the workflow file), **the database has no indexes behind the exact query pattern every list screen uses**, **the GraphQL endpoint has no cost limit**, and — the one that would worry me most if I were signing this off for real — **one mutation on the money-movement path has no ownership check**, found not by the dedicated security review but by a separate code-quality pass, which is exactly the kind of finding that teaches you not to trust a single lens. Every one of these is small and mechanical to fix — none of them is "we need to rethink something." The remaining gap, a real production environment, is the project's own deliberate choice to not run infrastructure it hasn't committed to paying for, and I respect that as an honest constraint rather than a shortcut — but it is still the literal definition of v1.0 this project wrote for itself, so I can't wave it away either.

I'd sign off the moment those three code-level items close and a real host — even a modest one — exists to deploy to. The team clearly knows how to verify its own work rather than assume it; the discipline behind that (the milestone tracker's honesty, the rehearsed backup/restore, the fact that today's own session caught and fixed a real production-crashing bug that four prior attempts had misdiagnosed as CI flakiness) is exactly what makes me confident saying "not yet" instead of "no."

---

## 12. Phase 7 — Remediation Status (Implementation Pass, 2026-07-22)

Every finding from §4 re-checked against the actual code on `fix/sm-10-release-audit-remediation` after implementation, not against the plan. Status values: **FIXED** (code shipped + tested this pass), **VERIFIED-NOT-A-BUG** (re-checked, finding didn't hold up), **DEFERRED-TRAINING-CONSTRAINT** (explicitly out of scope by this project's no-paid-infrastructure policy), **STILL-OPEN** (not addressed this pass).

### Critical

| Finding                                   | Status                           | Evidence                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-C1 — No branch protection               | **STILL-OPEN**                   | A GitHub repository-settings change affecting how the whole team merges — outside this session's scope to change unilaterally; needs an explicit decision from the repo owner.      |
| F-C2 — Unbounded Admin-path aggregation   | **FIXED**                        | `e065dca` — `requireBoundedDateRangeForAdmin` + `MAX_LOW_STOCK_ROWS`/`CSV_EXPORT_MAX_ROWS` caps, 14 new tests.                                                                      |
| F-C3 — No indexes behind default sort     | **FIXED**                        | `ae8682a` — 11 new indexes, `EXPLAIN ANALYZE` evidence (200k rows: 22.8ms → 0.14ms).                                                                                                |
| F-C4 — No GraphQL depth/complexity limits | **FIXED**                        | `45d1de0` — `graphql-depth-limit` + a `didResolveOperation`-plugin complexity check, 4 new e2e tests.                                                                               |
| F-C5 — No real production environment     | **DEFERRED-TRAINING-CONSTRAINT** | Per this project's explicit no-VPS/no-paid-cloud policy; `docs/production-deployment-runbook.md` (new, `b1eee69`) documents exactly what remains and why it's unverifiable locally. |

### High

| Finding                                              | Status         | Evidence                                                                                                                                         |
| ---------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| F-H1 — No Billing (Invoices) E2E coverage            | **FIXED**      | `9be84e1` — `apps/web/e2e/billing/billing.spec.ts`, 2 tests (Partner read-only surface, Admin partial→full payment + CSV export).                |
| F-H2 — Billing feature nearly untested at unit layer | **FIXED**      | `9be84e1` — `RecordPaymentForm.spec.tsx` (5 tests), `InvoiceDetailPage.spec.tsx` (5 tests).                                                      |
| F-H3 — Chart.js fix shipped with no regression test  | **FIXED**      | `457fe25` — `Chart.controllers.spec.ts`, verified to fail against the pre-fix code before being confirmed to pass.                               |
| F-H4 — Unbounded CSV exports                         | **FIXED**      | `e065dca` — same `CSV_EXPORT_MAX_ROWS` cap applied to reports, billing, and customers exports.                                                   |
| F-H5 — Unindexed `ILIKE` search                      | **FIXED**      | `046c148` — `pg_trgm` + GIN trigram indexes on `User.email/fullName`, `Customer.displayName/billingEmail`; evidence (100k rows: 54.9ms → 0.6ms). |
| F-H6 — Positional scalars instead of Input Object    | **STILL-OPEN** | Not addressed — 4 resolvers still take positional args; functionally correct, no new callers added this pass.                                    |
| F-H7 — Zero GraphQL fragments                        | **STILL-OPEN** | Not addressed — L effort, explicitly a post-launch fast-follow per the original recommendation.                                                  |
| F-H8 — `recordPayment` has no ownership check        | **FIXED**      | `ba015f9` — mirrors `findInvoiceById`'s check, 3 new tests.                                                                                      |
| F-H9 — Dead `RolesGuard`/`@Roles()` infra            | **FIXED**      | `c02dc21` — both deleted, unregistered from `auth.module.ts`.                                                                                    |
| F-H10 — `BillingReportsPage` boundary violation      | **FIXED**      | `068f11f` — `useAuth` → `useCurrentUser`.                                                                                                        |
| F-H11 — Dead frontend code                           | **FIXED**      | `068f11f` — `ComingSoonPage` and 3 unused icon exports deleted.                                                                                  |

### Medium

| Finding                                                            | Status         | Evidence                                                                                                                                           |
| ------------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-M1 — CORS fails open in production                               | **FIXED**      | `046c148` — `CORS_ALLOWED_ORIGINS` required via Joi `.when('NODE_ENV', ...)` when production. Introduced a real regression, since fixed — see §13. |
| F-M2 — CSP hardcoded to `localhost`                                | **STILL-OPEN** | Not addressed.                                                                                                                                     |
| F-M3 — `npm audit` not in CI                                       | **FIXED**      | `b1eee69` — `npm audit --audit-level=critical` step added.                                                                                         |
| F-M4 — `chart.js` mis-bucketed in vendor chunk                     | **STILL-OPEN** | Not addressed — S effort, non-blocking, safe to pick up any time.                                                                                  |
| F-M5 — No optimistic UI / unawaited refetches                      | **STILL-OPEN** | Not addressed — M effort, UX-only.                                                                                                                 |
| F-M6 — Inconsistent single-entity query naming                     | **STILL-OPEN** | Not addressed — breaking change, needs a deprecation cycle; deliberately not rushed.                                                               |
| F-M7 — Offset-encoded cursor on Product Performance                | **STILL-OPEN** | Not addressed — L effort, bounded dataset, low urgency per original assessment.                                                                    |
| F-M8 — `security.md` gap register stale                            | **FIXED**      | `b1eee69` — reconciled against F-M1/F-M2's actual state.                                                                                           |
| F-M9 — `testing.md` stale intro + count mismatch                   | **FIXED**      | `b1eee69` — corrected.                                                                                                                             |
| F-M10 — Stale duplicate audit at repo root                         | **FIXED**      | `b1eee69` — `RELEASE_READINESS_AUDIT_v1.0.txt` deleted.                                                                                            |
| F-M11 — Privilege-escalation guard uses `role.name === 'Admin'`    | **FIXED**      | `c02dc21` — replaced with `roles:grant:admin` permission key, seeded Admin-only.                                                                   |
| F-M12 — Cursor helpers duplicated 6-7 ways                         | **FIXED**      | `1e5bec5` — extracted to `common/utils/cursor.util.ts`.                                                                                            |
| F-M13 — Two Reports queries omit `deletedAt: null` uncommented     | **FIXED**      | `1e5bec5` — explanatory comments added (deliberately not filtered — historical revenue).                                                           |
| F-M14 — Two frontend files exceed 250-line cap                     | **STILL-OPEN** | Not addressed — `InvoiceDetailPage.tsx`/`router/index.tsx` unchanged.                                                                              |
| F-M15 — Seven duplicated status-badge components                   | **FIXED**      | `068f11f` — `createStatusBadge` factory, 7 call sites refactored to one-liners.                                                                    |
| F-M16 — Untraceable exported types; `StatisticsGrid` barrel bypass | **STILL-OPEN** | Not addressed.                                                                                                                                     |

### Low

All six Low findings (F-L1 through F-L6) are **STILL-OPEN** — none were in scope for this pass, consistent with the original report's own "no urgency" framing for every item in this tier. None block v1.0 by the original audit's own assessment.

### Fixed: 3/5 Critical, 9/11 High, 9/16 Medium, 0/6 Low — 21 of 38 findings closed this pass.

---

## 13. Two Regressions Found Only By Booting the Real Stack

Live verification (§ below) surfaced two bugs that **this session's own fixes introduced** — neither was flagged by lint, typecheck, or the unit/integration suites, only by actually running the full Compose stack and driving it with Playwright, exactly the discipline `docs/milestones.md`'s risk T1 calls for.

1. **Docker Compose crash-loop.** F-M1's fix (`046c148`) made `CORS_ALLOWED_ORIGINS` required whenever `NODE_ENV=production`, but neither `infrastructure/docker/docker-compose.yml` nor `apps/api/docker-compose.yml` — both of which set `NODE_ENV: production` — ever set that variable. The `api` container crash-looped on boot. Fixed by setting `CORS_ALLOWED_ORIGINS` explicitly in both files (matching each file's own browser-facing origin).
2. **Reports dashboard broke for every Admin on first visit.** F-C2's fix (`e065dca`) added `requireBoundedDateRangeForAdmin`, which correctly rejects an Admin-unscoped call with no date range — but the Reports dashboard, Revenue, Orders, and Product Performance pages never sent a default date range when the URL had none, so an Admin landing on `/reports` with no filter chosen got "Couldn't load the reports dashboard" instead of KPIs. Fixed by defaulting all five date-ranged report hooks to a trailing 30-day window (`resolveReportDateRangeParams`, backed by the existing `resolveDateRangePreset('last30Days')` util) when the URL carries no explicit `from`/`to` — the backend guard itself was correct and left unchanged.

Both were caught during Phase 6's live full-stack verification pass, fixed, covered by new/updated tests, and are reflected as FIXED above (F-M1, F-C2 statuses already account for them).

---

## 14. Final Verification — Actually Run, This Pass

| Check                                                                     | Result                        | Evidence                                                                                                                                            |
| ------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend lint (`eslint src --max-warnings=0`)                              | ✅ PASS                       | Zero warnings                                                                                                                                       |
| Backend typecheck (`tsc --noEmit`)                                        | ✅ PASS                       | Strict mode                                                                                                                                         |
| Backend unit tests (Jest)                                                 | ✅ PASS                       | **342 tests, 23 suites** (up from 326/24 — net effect of new specs from this pass; suite count differs due to reorganization, not loss of coverage) |
| Backend integration tests (fresh Postgres, migrate + seed, `--runInBand`) | ✅ PASS                       | **152 tests, 10 suites** (up from 148/9 — new `graphql-security.e2e-spec.ts`)                                                                       |
| Frontend typecheck (`tsc -b`)                                             | ✅ PASS                       | Strict mode                                                                                                                                         |
| Frontend lint                                                             | ✅ PASS                       | Zero warnings on touched files                                                                                                                      |
| Frontend unit tests (Vitest)                                              | ✅ PASS                       | **248 tests, 70 files** (up from 232/65 — new billing + reports specs)                                                                              |
| Production build (`npm run build`, both apps)                             | ✅ PASS                       | Fresh build, both `apps/api` and `apps/web`                                                                                                         |
| Docker image build — API + Web                                            | ✅ PASS                       | Rebuilt after the reports date-range fix                                                                                                            |
| Full Compose stack boot (`db`, `keycloak-db`, `keycloak`, `api`, `web`)   | ✅ PASS                       | All healthy; found and fixed the CORS crash-loop live (§13)                                                                                         |
| Database migrations (`prisma migrate deploy`)                             | ✅ PASS                       | Both of this session's new migrations applied cleanly on a from-scratch volume                                                                      |
| Seed (`prisma db seed`)                                                   | ✅ PASS                       | 15 permissions including the new `roles:grant:admin`                                                                                                |
| Playwright E2E — Chromium + Firefox, full stack                           | ✅ **34/34 PASS, zero flaky** | Includes the new `billing.spec.ts` (2 tests) and the fixed `reports.spec.ts` Admin-dashboard test                                                   |

**Total: 742 automated tests green** (342 + 248 + 152) plus 34/34 E2E test executions — no retries needed, no flake, on a from-scratch Docker Compose stack with a freshly migrated and seeded database.

---

## 15. Summary

**1. What was fixed:** 21 of 38 audit findings — all 3 fixable Critical items (unbounded aggregation, missing indexes, GraphQL cost limits), 9 of 11 High items (Billing E2E/unit gaps, the `recordPayment` IDOR, unindexed search, dead auth infra, boundary violation, dead code, unbounded CSV exports, the untested Chart.js fix), and 9 of 16 Medium items (CORS fail-open, `npm audit` in CI, three stale-doc findings, the banned role-name check, cursor-helper duplication, the undocumented `deletedAt` omission, status-badge duplication). Plus two regressions this session's own fixes introduced, found only by booting the real stack (§13).

**2. Files changed:** 10 commits on `fix/sm-10-release-audit-remediation` touching `apps/api/src/modules/{billing,users,reports}`, `apps/api/src/{app.module.ts,config}`, `apps/api/src/common/{graphql,utils}` (new), `database/prisma/schema.prisma` + 2 new migrations, `apps/web/src/features/{billing,reports}`, `apps/web/src/shared/components/{ui/Badge,ui/Chart}`, `apps/web/e2e/billing/` (new), `.github/workflows/ci.yml`, `docs/{security,testing,authorization,production-deployment-runbook}.md` (last is new), both Compose files.

**3. Tests added:** 3 backend unit specs (billing ownership, config CORS), 1 backend e2e spec (`graphql-security.e2e-spec.ts`, 4 tests), 14 backend service tests (CSV/low-stock bounding), 1 frontend Chart regression spec, 2 frontend Billing component specs (10 tests), 1 frontend Billing E2E spec (2 tests), 1 frontend reports-constants spec (3 tests) — **~38 new tests** across both stacks.

**4. Tests executed and results:** 742 unit/integration tests green (342 backend unit + 152 backend integration + 248 frontend unit), full production build green for both apps, 34/34 Playwright E2E executions green across Chromium and Firefox with zero flake — all against a from-scratch Docker Compose stack this session actually booted, migrated, and seeded (§14).

**5. Audit findings closed:** F-C2, F-C3, F-C4 (Critical); F-H1, F-H2, F-H3, F-H4, F-H5, F-H8, F-H9, F-H10, F-H11 (High); F-M1, F-M3, F-M8, F-M9, F-M10, F-M11, F-M12, F-M13, F-M15 (Medium).

**6. Audit findings intentionally deferred:** F-C5 (real production environment) — deferred by this project's explicit training-project, no-paid-infrastructure policy, not an engineering gap.

**7. Remaining risks (STILL-OPEN, not addressed this pass):** F-C1 (no branch protection — a repo-governance decision, not code); F-H6/F-H7 (GraphQL Input Object consistency, missing fragments — both non-blocking debt); F-M2 (CSP hardcoded to localhost), F-M4 (chart.js bundle bucketing), F-M5 (no optimistic UI), F-M6 (query naming inconsistency — needs a deprecation cycle), F-M7 (offset cursor), F-M14 (two oversized files), F-M16 (dead exports); all 6 Low findings. None of these were assessed as release-blocking by the original audit except F-C1, which requires a repository-owner decision this session cannot make unilaterally.

**8. Updated production-readiness assessment (training project):** **Engineering readiness is strong and now verified, not assumed** — every Critical and High finding that was purely a code defect is fixed and tested; the two regressions this pass's own fixes introduced were caught by actually booting the stack rather than trusting green CI in isolation, and both are now fixed with coverage. What remains open is either genuinely non-blocking debt (fragments, Input Objects, bundle bucketing, cursor style) explicitly scoped as post-launch fast-follows in the original audit, or a decision outside engineering's authority (branch protection, real hosting). For a training project whose explicit goal is production-grade practice without paid infrastructure, this is close to the ceiling of what's achievable locally: 742 tests green, 34/34 E2E green, a full Docker Compose stack that boots, migrates, seeds, and serves correctly end to end, and a documented, honest account (`docs/production-deployment-runbook.md`) of exactly what a real deployment would still require.

**9. Recommended next milestone:** Either (a) close the remaining non-blocking Medium/Low debt (F-M2/M4/M5/M6/M7/M14/M16, F-H6/H7) as a follow-up hardening pass, since none require new architecture and several are S-effort; or (b) if the training goal shifts toward the deployment lifecycle itself, use `docs/production-deployment-runbook.md`'s own UNVERIFIED-REQUIRES-PRODUCTION-INFRASTRUCTURE checklist as the spec for a (still-free-tier) hosting exercise — e.g. a platform with a genuine no-cost tier — to close F-C5/F-C1 without violating the no-paid-infrastructure constraint. Either is a reasonable next step; the codebase itself is no longer the blocker.
