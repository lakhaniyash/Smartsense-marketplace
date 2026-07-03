---
description: Improve structure and readability of existing code without changing behavior.
argument-hint: <files or area to refactor, and the named friction>
---

# /refactor

## Purpose

Improve maintainability — remove duplication, improve readability, restore convention
compliance — while provably preserving behavior.

## When to Use

- A named friction exists (per `docs/TASKS.md § Refactoring`: never speculative) —
  e.g. a component over 250 lines, duplicated business rules, a convention violation.

## Workflow

1. State the friction being resolved and confirm current behavior (existing tests, or write
   characterization tests first if none cover the area).
2. Read the owning conventions doc for the layer being touched.
3. Refactor in small steps: extract hooks/subcomponents/service methods; move code to its
   correct tier (feature → `shared/` only with a second real consumer); align naming/imports.
4. Keep each step green: `npm run lint && npm run typecheck && npm run test`.
5. Verify behavior is unchanged by running the affected flow.

## Inputs

$ARGUMENTS — the target files/area and the friction motivating the refactor.

## Outputs

Refactored code, unchanged observable behavior, passing tests, and a short note mapping
each change to the friction it resolves.

## Rules

- **Preserve behavior** — a refactor that changes behavior is a bug or a different task.
- Follow the architecture; don't "improve" it into a new pattern
  (`docs/folder-structure.md § Best Practices`: existing pattern first).
- Extract shared abstractions on the second/third duplication, not the first (DRY-pragmatic,
  `docs/coding-standards.md § 2`).
- No scope creep: unrelated fixes discovered along the way become their own task.

## Example

`/refactor apps/web/src/features/catalog/pages/ProductEditPage.tsx — 400 lines, extract form hook`
