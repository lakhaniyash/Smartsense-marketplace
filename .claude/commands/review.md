---
description: Review code against the project's standards, architecture, and security rules.
argument-hint: [files, diff, or PR to review]
---

# /review

## Purpose

Review code the way `docs/coding-standards.md § 14` prescribes — finding real defects and
convention violations, not restyling working code.

## When to Use

- Before opening/merging a PR; after completing an implementation task.
- When asking "does this follow project conventions?"

## Workflow

1. Determine scope ($ARGUMENTS, or the current branch diff against `development`).
2. Review each dimension against its owning doc:
   - **Architecture** — layer/dependency rules (`.claude/context/architecture.md`,
     `docs/folder-structure.md`): feature isolation, thin resolvers, barrel imports.
   - **Naming** — `docs/coding-standards.md § 8`.
   - **SOLID / maintainability** — `docs/coding-standards.md § 2`; anti-pattern tables in
     each owning doc.
   - **Performance** — N+1, unpaginated lists, missing `deletedAt` filters, unindexed sorts
     (`docs/performance.md`, `docs/graphql.md § 13`).
   - **Security** — guard coverage, `@Public()` additions, ownership checks, secrets/logs
     (`docs/security.md`, `docs/authorization.md § Best Practices`); guard-order changes are
     security-relevant.
   - **Accessibility** — labels, keyboard operability, color-not-sole-signal
     (`docs/ui-guidelines.md § Accessibility`).
   - **Testing** — critical paths covered, regression tests for fixes (`docs/testing.md`).
   - **GraphQL** — additive schema, single Input objects, generated types only
     (`docs/graphql.md`).
   - **Type safety** — no `any`/`!`/`@ts-ignore`, no hand-written schema-mirroring types.
3. Verify claims where cheap (run typecheck/tests) rather than assuming.

## Inputs

$ARGUMENTS — files, a diff, a PR, or empty (current working diff).

## Outputs

Findings ordered by severity, each citing file:line and the violated rule's owning doc;
explicit "checked, clean" for dimensions with no findings.

## Rules

- **Never rewrite code unless explicitly asked** — report, don't fix.
- Distinguish defects/violations from optional suggestions.
- Review the claim, not just the diff: does it actually run?

## Example

`/review apps/api/src/modules/catalog/`
