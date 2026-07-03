---
description: Produce an implementation plan for a feature or change — no code.
argument-hint: <feature or change to plan>
---

# /plan

## Purpose

Turn a requirement into a reviewed, step-by-step implementation plan grounded in the
project documentation — before any code exists (documentation-first,
`docs/milestones.md § Engineering Philosophy`).

## When to Use

- Before starting any non-trivial feature, refactor, or structural change.
- When scoping a milestone task from `docs/TASKS.md` / Jira into concrete steps.

## Workflow

1. Read the docs owning the affected area (`.claude/context/project.md` → Documentation Map),
   always including `docs/requirements.md`, `docs/domain-model.md`, and `docs/folder-structure.md`.
2. Restate the feature: scope, affected modules, roles/permissions involved.
3. Identify dependencies: milestones (`docs/milestones.md`), open questions
   (`docs/domain-model.md`, `docs/authentication.md`), technical debt (`docs/TASKS.md`).
4. Split into small, vertical implementation steps (schema → API → UI → test per slice).
5. Estimate complexity per step (S ≤1 day / M 2–3 days / L ≤1 week; XL means split further).
6. Identify risks and the tests each critical step requires.

## Inputs

$ARGUMENTS — the feature/change to plan, plus any Jira key (`SM-*`).

## Outputs

An implementation plan only: ordered steps with owning docs cited, dependency list,
complexity estimates, risks, testing strategy, and docs that will need same-PR updates.

## Rules

- **Never write code** — not even snippets; shapes are described, not implemented.
- Every step traces to an owning doc; flag any conflict with existing docs explicitly.
- Surface unresolved open questions as blockers, not assumptions.

## Example

`/plan SM-250 catalog product CRUD with cursor pagination`
