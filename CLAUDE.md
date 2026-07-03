# CLAUDE.md — SmartSense Marketplace

## Project Overview

SmartSense Marketplace is an enterprise multi-vendor marketplace: **Partners** sell products,
**Customers** buy them, **Admins** operate the platform. Turborepo monorepo (npm workspaces —
**not pnpm**) with two apps and a shared database schema:

- `apps/web` — React 19 + Vite + Tailwind v4 + Apollo Client SPA (feature-based architecture)
- `apps/api` — NestJS 11 + Apollo Server 5, code-first GraphQL (module-per-domain)
- `database/prisma` — Prisma schema, migrations, seed (PostgreSQL 17)
- `infrastructure/` — Docker Compose + Keycloak 26 realm export
- `docs/` — 26 authoritative engineering documents (the source of truth)

Current state: foundations, database, Keycloak, and backend auth are complete (M1–M7);
frontend auth, GraphQL integration, shared UI, and feature modules are next (M8+).
See `docs/milestones.md` and `.claude/context/project.md`.

## Documentation-First Philosophy

- `docs/` is authoritative. **Read the owning doc before writing code in an area** —
  the routing map is in `docs/contributing.md` and `.claude/context/project.md`.
- Never duplicate documentation. Summarize and link; fix facts in their owning doc.
- Structural decisions are documented before they are built; docs are updated
  **in the same PR** as the code that invalidates them ("docs later" is a rejected state).
- When a document and reality disagree, reality wins and the document gets fixed.

## Development Workflow

1. Pick an `SM-*` Jira issue; branch from `development`: `<type>/<kebab-description>`.
2. Read the relevant docs (see `.claude/context/project.md` → Documentation Map).
3. Implement in small, vertical slices (schema → API → UI → test), following
   `docs/coding-standards.md` and the layer's conventions doc.
4. Verify by **running it** — "compiles and lints" is not "works" (`docs/milestones.md`, risk T1).
5. `npm run lint && npm run typecheck && npm run test` green locally.
6. Commit with Conventional Commits + mandatory `SM-*` key; keep every body line under
   100 characters (commitlint enforces both).
7. PR into `development` (never `main`, except hotfixes from `main`). One logical change per PR.

Full mechanics: `docs/git-workflow.md`, `docs/developer-setup.md`, `.claude/context/workflow.md`.

## Code Quality Expectations

- TypeScript strict mode everywhere; `any` is banned (use `unknown` + narrowing or generics).
- Functional React components only, under 250 lines; named exports; no default exports.
- Use GraphQL Code Generator output only — never hand-write a type mirroring the schema.
  `__generated__/` and `schema.gql` are build artifacts; never edit them.
- React Hook Form + Zod for forms (frontend); `class-validator` DTOs (backend) — a fixed
  split by runtime, not a choice (`docs/api-conventions.md`).
- Tailwind CSS only — no bespoke CSS, no inline styles unless genuinely dynamic,
  no arbitrary values (`p-[13px]`) where a scale token exists.
- No `console.log` in committed code — inject `LoggingService` (api) / shared logging util (web).
- Do not introduce dependencies without clear justification (bundle cost included).
- Definition of Done: `docs/coding-standards.md` § 16. Review checklist: § 14.

## Architecture Rules

- **Frontend:** dependency direction `app → features → shared`; features never import each
  other; `shared/` never imports from `features/` or `app/`. Import only through barrels
  (`index.ts`) via path aliases (`@features/*`, `@shared/*`, `@app/*`, `@lib/*`).
- **Backend:** resolver → service → Prisma. Resolvers delegate only — no business logic,
  no direct Prisma calls. All business logic lives in services. `modules/*` may depend on
  `common/`, `config/`, `prisma/` — never the reverse. No `forwardRef()`, no `@Global()`
  domain modules.
- **Auth is opt-out:** every resolver is protected by default; `@Public()` is the explicit,
  justified exception. Guards check the verb (`@Permissions('catalog:write')`);
  services check the noun (ownership: `record.partnerId === user.partnerId`).
  Never `role === 'Admin'` checks — capability helpers / permission keys only.
- **Data:** every mutation that must be atomic uses `prisma.$transaction`; queries on
  soft-deletable models always filter `deletedAt: null`; money is `Decimal`, never `Float`.
- Details: `.claude/context/architecture.md` and the docs it references.

## Testing Expectations

- Test at the **lowest layer that proves the behavior** (`docs/testing.md`).
- Critical paths (auth guards, business rules, money) get tests **in the same PR** — non-negotiable.
- Backend: Jest unit specs (mocked Prisma, `new`-instantiated services), Jest + Supertest
  integration against real Postgres + mocked JWKS. Frontend: Playwright (configured);
  Vitest + RTL arrive with M10. Every bug fix ships a regression test.
- No `.skip`ed or flaky tests — fix or delete, never silence.

## Documentation Update Policy

- A change that alters architecture, schema, folder structure, or a convention updates the
  owning doc in the same PR.
- Respect the ownership map: every doc's scope section says what it owns; correct facts
  there, don't restate them elsewhere.
- New conventions established by a first implementation get written into the owning doc
  as part of the work.

## General Implementation Rules

- Copy an existing pattern before inventing one (the `auth` module and its specs are the
  backend reference implementation).
- Generate only the requested scope; avoid unrelated drive-by changes.
- Fail closed: missing config aborts boot; unknown roles are ignored; deny by default.
- Never log or commit secrets, tokens, or PII; `.env` files stay untracked.
- Promote, don't pre-share: code moves to `shared/`/`packages/*` on the second real consumer.
- `npm` only — a `pnpm-lock.yaml` or `yarn.lock` is a defect.

## Response Style for Claude

- Lead with the outcome; be concise and specific; reference files as `path:line`.
- Cite the owning doc when a rule drives a decision (e.g. "per `docs/authorization.md`").
- Say what was verified by running vs. what is only typechecked — never claim "works" untested.
- Ask before destructive or scope-changing actions; otherwise proceed.
- When docs and code disagree, surface the discrepancy instead of silently picking one.

## Claude Context, Commands & Agents

- `.claude/context/` — project, stack, architecture, conventions, workflow, glossary summaries
  (each links to the owning docs).
- `.claude/commands/` — workflow commands: `/plan`, `/implement`, `/review`, `/refactor`,
  `/test`, `/fix`, `/create-feature`, `/graphql`, `/docs`, `/explain`.
- `.claude/agents/` — specialized subagents (tech-lead, frontend/backend architects,
  graphql/keycloak/prisma experts, ui-designer, testing-expert, security/performance/code
  reviewers, devops-engineer).
