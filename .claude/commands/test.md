---
description: Generate tests at the right layer, following docs/testing.md.
argument-hint: <code or behavior to test>
---

# /test

## Purpose

Generate tests for a unit, module, or user journey at the lowest layer that proves the
behavior, following [docs/testing.md](../../docs/testing.md).

## When to Use

- Adding coverage for new/changed logic (mandatory in the same PR for auth, business rules,
  and money).
- Writing a regression test for a bug fix.
- Building out Playwright suites for a module (M18 structure).

## Workflow

1. Read `docs/testing.md` for the target layer, and the established patterns:
   - **Unit (backend, Jest):** services instantiated with `new` + plain mock objects
     (`auth.service.spec.ts` pattern); guards with a fake `ExecutionContext`
     (`roles.guard.spec.ts` pattern); DTOs via `class-validator`'s `validate()`.
   - **Integration (Jest + Supertest):** real `AppModule`, real Postgres, mocked JWKS with
     self-signed RS256 tokens (`auth.e2e-spec.ts` pattern) — never a bypassed guard.
   - **Unit/component (frontend):** Vitest + React Testing Library once introduced (M10);
     mocked Apollo responses shaped by generated types.
   - **E2E (Playwright):** module suites under `apps/web/e2e/<module>/`, Page Object Model.
2. Cover success + failure branches; for protected operations: no token, expired/invalid
   token, insufficient permission, success.
3. Ensure isolation: each test creates and cleans its own data; no execution-order coupling.
4. Run the tests and report actual results.

## Inputs

$ARGUMENTS — the file, service, operation, or journey to test.

## Outputs

Co-located `*.spec.ts` files (or `e2e/` specs) following existing patterns, plus a run report.

## Rules

- Test behavior, not implementation; no full-render snapshots.
- Mocks match real shapes (generated GraphQL types, Prisma model shapes).
- Integration tests never mock Prisma; unit tests never need a live database.
- No `.skip` — a test that can't pass yet isn't written yet.

## Example

`/test OrdersService.cancelOrder — lifecycle transition rules incl. invalid transitions`
