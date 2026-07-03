# SmartSense Marketplace — Contributor Guide

Version: 1.0

---

## Welcome

Welcome to SmartSense Marketplace — an enterprise marketplace platform where Partners run their catalog, orders, and billing in one place ([roadmap.md § Product Vision](./roadmap.md#product-vision)). This guide is the **front door**: it gets you productive quickly by pointing you to the right document at the right moment, rather than repeating what those documents already say. Everything here is a map; the territory lives in the linked docs.

**Assumption made explicit.** This is an internal team project (Jira-tracked, `SM-*` keys, company accounts) — this guide is written for team members and onboarding engineers, not anonymous open-source contributors; there is no CLA process, and "community" below means the engineering team.

The one rule above all others: **when a document and reality disagree, reality wins and the document gets fixed** — in the same PR where you noticed ([coding-standards.md § 16](./coding-standards.md#16-definition-of-done)).

## Development Philosophy

The five principles every contribution is expected to follow — detailed in [milestones.md § Engineering Philosophy](./milestones.md#engineering-philosophy):

1. **Incremental** — `development` is always green; big changes arrive as small, complete steps.
2. **Vertical slices** — a feature lands schema → API → UI → test for one capability, not layer by layer.
3. **Small PRs** — if it's hard to review, it's too big.
4. **Test-first for critical paths** — auth, business rules, and money never merge untested.
5. **Documentation-first** — structural decisions are written down before they're built, and docs update with the code that changes them.

And the cultural one this project learned the hard way: **"compiles and lints" is not "works"** — verify by running it (risk T1, [milestones.md § Risk Management](./milestones.md#risk-management)).

## Getting Started

1. **Set up your machine:** [developer-setup.md](./developer-setup.md) — clone to running stack, including every known first-day pitfall. Budget ~30 minutes.
2. **Understand what you're building:** skim [requirements.md](./requirements.md) (what), [architecture.md](./architecture.md) (how, in principle), and [roadmap.md](./roadmap.md) (why, in what order).
3. **Find your work:** [TASKS.md](./TASKS.md) is the structural backlog; Jira is the operational tracker. Current milestone status: [milestones.md § Milestone Overview](./milestones.md#milestone-overview).
4. **Before your first line of code in an area, read its owning doc** — the table below is the routing map:

| Touching…                    | Read first                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Any file (where does it go?) | [folder-structure.md](./folder-structure.md)                                                     |
| Frontend features/components | [frontend-architecture.md](./frontend-architecture.md), [ui-guidelines.md](./ui-guidelines.md)   |
| Backend resolvers/services   | [backend-architecture.md](./backend-architecture.md), [api-conventions.md](./api-conventions.md) |
| GraphQL schema/operations    | [graphql.md](./graphql.md)                                                                       |
| Database schema/migrations   | [database-schema.md](./database-schema.md), [domain-model.md](./domain-model.md)                 |
| Auth, roles, permissions     | [authentication.md](./authentication.md), [authorization.md](./authorization.md)                 |
| Anything security-sensitive  | [security.md](./security.md)                                                                     |
| Performance-relevant changes | [performance.md](./performance.md)                                                               |
| Logging/telemetry            | [observability.md](./observability.md)                                                           |
| Deploy/infra/Docker          | [deployment.md](./deployment.md), [keycloak-setup.md](./keycloak-setup.md)                       |

## Coding Standards

Owned by [coding-standards.md](./coding-standards.md) — TypeScript/React/NestJS/Prisma rules, naming, imports, error handling, and the Definition of Done (§ 16). The project-rule summary also lives in [CLAUDE.md](../CLAUDE.md) (strict mode, no `any`, Tailwind only, generated GraphQL types only, components under 250 lines, named exports). Read § 2 (General Principles) and the section for your layer before your first PR; the rest works as a reference.

## Branch Workflow

Owned by [git-workflow.md](./git-workflow.md) — branch from `development`, `<type>/<kebab-description>` naming, Conventional Commits with a mandatory `SM-*` Jira key (enforced by hooks; they're documented rules, not obstacles — never `--no-verify`), merge-commit PRs, hotfixes from `main` with a back-merge. The commit anatomy and full mechanics are there.

## Testing Expectations

Owned by [testing.md](./testing.md). The contributor-facing core:

- Test at the **lowest layer that proves the behavior** ([testing.md § Testing Strategy](./testing.md#testing-strategy)); the established backend patterns (mocked-Prisma service specs, fake-context guard specs, real-Postgres integration tests) are in § Backend Testing — copy them, don't reinvent.
- Critical functionality (guards, business rules, money) **must** have tests in the same PR ([CLAUDE.md](../CLAUDE.md)).
- Every bug fix ships with a regression test reproducing the original failure ([testing.md § Regression Testing](./testing.md#regression-testing)).
- No `.skip`-ed or flaky tests — fix or delete, never silence ([testing.md § Testing Philosophy](./testing.md#testing-philosophy)).

## Documentation Expectations

- **Docs change in the same PR as the code that invalidates them** — architecture, schema, conventions, this guide, any of it ([coding-standards.md § 16](./coding-standards.md#16-definition-of-done)). "Docs later" is a rejected review state.
- Every document has a scope section naming what it owns and what it references — **respect the ownership map**: fix a fact in its owning document, not by duplicating a corrected version somewhere else (the no-duplication rule that keeps 20+ docs coherent).
- New conventions you establish while building (the first implementation of a pattern) get written into the owning doc as part of the work — see M11's "document the slice pattern" task ([TASKS.md](./TASKS.md#milestone-task-breakdown)) for the model.
- Write for the engineer who arrives in two years: state assumptions explicitly, date-stamp reality ("as of this writing, X is a scaffold"), and prefer linking over restating.

## Pull Requests

Mechanics owned by [git-workflow.md § Pull Requests](./git-workflow.md#pull-requests); content expectations by [coding-standards.md § 13](./coding-standards.md#13-git--commit-message-standards). In brief: PR into `development`, one logical change, Jira-linked title and description, green CI before review, additive commits after review starts, delete the branch after merge.

## Review Process

- Reviewers apply [coding-standards.md § 14](./coding-standards.md#14-code-review-checklist) plus the authorization checklist for anything touching access control ([authorization.md § Best Practices](./authorization.md#best-practices)) and the elevated treatment for security-sensitive code ([security.md § Secure Coding](./security.md#secure-coding)).
- Etiquette for both sides — response expectations, "review the claim, not just the diff," turnaround priority — is in [git-workflow.md § Code Reviews](./git-workflow.md#code-reviews).
- Reviews are about the code, never the person — direct, specific, and kind. "This query is missing the `deletedAt` filter" beats "this is wrong."

## Issue Reporting

Bugs are reported in **Jira** with the reproduction/severity/priority fields defined in [testing.md § Bug Reporting Guidelines](./testing.md#bug-reporting-guidelines) — exact steps from a known state, severity by impact, priority decided at triage. A bug that survives triage as scheduled work also lands in [TASKS.md § Bugs](./TASKS.md#bugs). Security-relevant findings are not filed as ordinary bugs — flag them directly to the project lead per [security.md § Incident Response](./security.md#incident-response).

## Feature Requests

Feature ideas route by size: a small improvement to existing functionality goes to Jira (and [TASKS.md § Improvements](./TASKS.md#improvements) if accepted); anything that changes what a release delivers is a **product scope question** for the roadmap's owner, governed by [roadmap.md § Roadmap Governance](./roadmap.md#roadmap-governance) — the answer may be "yes, in v2.0," and that's the system working. Check [roadmap.md § Future Product Vision](./roadmap.md#future-product-vision) first; many ideas are already there with a trigger condition.

## Community Guidelines

Short, because a team this size runs on defaults of good faith:

- **Assume competence and good intent** — in reviews, in questions, in disagreement.
- **Disagree in the open, commit to the decision** — technical disputes are argued with evidence (measurements, docs, code), resolved by the relevant owner, and recorded where they were resolved (a doc, a PR thread, an ADR-level note).
- **Questions are contributions** — a question that reveals a docs gap is worth as much as a patch; file the gap or fix it.
- **No heroics culture** — surprise mega-PRs, silent force-pushes, and midnight direct-to-`development` pushes are process failures even when the code is good.

## Best Practices

The distilled habits of an effective contributor here:

- [ ] Read the owning doc before writing code in a new area — 10 minutes of reading beats a rejected PR.
- [ ] Copy an existing pattern (the `auth` module, the established spec styles) before inventing one.
- [ ] Run it — `curl /health`, click the flow, watch the test fail then pass. Verified beats plausible.
- [ ] Keep every change small enough that its reviewer can hold it in their head.
- [ ] Leave things better documented than you found them.

## Checklist

Your first contribution, end to end:

- [ ] Machine set up and stack running ([developer-setup.md](./developer-setup.md)) — `/health` returns 200, frontend loads.
- [ ] Read: [CLAUDE.md](../CLAUDE.md), [coding-standards.md §§ 1–2](./coding-standards.md), [git-workflow.md](./git-workflow.md), and the owning doc for your task's area.
- [ ] Jira issue picked and understood; task is `Ready` per [TASKS.md](./TASKS.md#task-status-definitions).
- [ ] Branch created from fresh `development`: `<type>/<kebab-description>`.
- [ ] Code follows the area's conventions; tests included per [Testing Expectations](#testing-expectations); docs updated if invalidated.
- [ ] `npm run lint && npm run typecheck && npm run test` green locally; change verified by actually running it.
- [ ] Commits are Conventional with `SM-*` keys (the hooks will hold you to it).
- [ ] PR opened into `development`, Jira-linked, small enough to review; CI green.
- [ ] Review feedback addressed with additive commits; branch deleted after merge.
- [ ] [coding-standards.md § 16 Definition of Done](./coding-standards.md#16-definition-of-done) — the final word on "done."

Welcome aboard — now go read [developer-setup.md](./developer-setup.md) and ship something small.
