---
description: Explain architecture, code, or a design decision — read-only.
argument-hint: <what to explain>
---

# /explain

## Purpose

Explain how something in SmartSense Marketplace works or why it was designed that way,
grounded in the code and the owning documentation.

## When to Use

- Onboarding questions ("how does auth work end to end?").
- Understanding a design decision ("why cursor pagination?", "why no repository classes?").
- Tracing a flow through the layers before changing it.

## Workflow

1. Find the owning doc(s) via the Documentation Map (`.claude/context/project.md`) and read
   the relevant sections.
2. Read the actual code paths involved (the `auth` module is the reference implementation
   for most backend questions).
3. Explain: what it does → how the pieces connect (cite `file:line` and doc sections) →
   why it's designed that way (the docs record rationale and rejected alternatives —
   e.g. anti-pattern tables, "Assumptions made explicit", Architectural Decisions).
4. State clearly where docs describe target state vs. current reality (many docs label
   scaffold/future sections) and flag any doc/code disagreement found.

## Inputs

$ARGUMENTS — the concept, file, flow, or decision to explain.

## Outputs

A grounded explanation with citations to code and owning docs; a pointer to where to read
more; discrepancies surfaced if found.

## Rules

- **Do not modify any files** — strictly read-only.
- Distinguish documented design intent from verified current behavior.
- Prefer citing the owning doc over paraphrasing it at length.

## Example

`/explain how a JWT becomes an AuthenticatedUser with permissions on req.user`
