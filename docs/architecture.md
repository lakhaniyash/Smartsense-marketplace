# SmartSense Marketplace - Architecture

Version: 1.0

---

# Overview

SmartSense Marketplace is an enterprise-grade marketplace frontend application built with React, TypeScript, Vite, Apollo Client, GraphQL, and Keycloak.

The architecture prioritizes:

- Scalability
- Maintainability
- Type Safety
- Performance
- Security
- Testability
- Developer Experience

The application is designed for long-term development by multiple engineers and supports modular feature development.

---

# Architecture Principles

The project follows these principles:

- Feature-first architecture
- Separation of concerns
- Composition over inheritance
- Reusable shared components
- Strict TypeScript
- Single Responsibility Principle (SRP)
- SOLID principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)

---

# High-Level Architecture

```
Browser
    │
    ▼
React Application
    │
    ├── Routing
    ├── Authentication
    ├── Layouts
    ├── Feature Modules
    ├── Shared Components
    ├── GraphQL Client
    ├── Services
    └── Utilities
            │
            ▼
Apollo Client
            │
            ▼
GraphQL API
            │
            ▼
Backend Services
```

---

# Project Structure

```
src/
│
├── app/
│
├── assets/
│
├── features/
│
├── shared/
│
├── styles/
│
├── types/
│
├── main.tsx
│
└── vite-env.d.ts
```

---

# app/

Contains application-level configuration.

```
app/

config/

providers/

router/

layouts/

guards/

constants/

bootstrap/
```

Responsibilities

- Application initialization
- Providers
- Routing
- Layout selection
- Route guards
- Global configuration

---

# features/

Each business module owns its implementation.

Example

```
features/

dashboard/

catalog/

orders/

billing/

authentication/
```

Each feature contains

```
feature/

components/

pages/

hooks/

graphql/

services/

types/

utils/

constants/
```

A feature must never directly depend on another feature.

Shared functionality belongs in `shared/`.

---

# shared/

Reusable code.

```
shared/

components/

hooks/

graphql/

services/

utils/

types/

constants/

icons/

layouts/
```

Examples

Button

Modal

Table

Toast

Pagination

API utilities

Custom hooks

Date utilities

Formatting utilities

---

# Routing

React Router v7

The application uses nested routing.

Example

```
/

login

dashboard

catalog

orders

billing

unauthorized

forbidden

404
```

Routes are grouped by layout.

Public Layout

Partner Layout

Admin Layout

Customer Layout

All routes are lazy loaded.

---

# Authentication

Authentication is handled using Keycloak.

Authentication responsibilities

- Login
- Logout
- Silent Login
- Token Refresh
- Session Expiration
- Role Resolution

Authentication logic belongs inside

```
features/authentication/
```

Application code must never access Keycloak directly.

Always use the Authentication Service.

---

# Authorization

Authorization is role based.

Initial roles

- Admin
- Partner
- Customer

Permissions are evaluated using a centralized permission service.

UI components must never contain hardcoded role checks.

Correct

```
canViewOrders()

canEditCatalog()
```

Incorrect

```
role === "Admin"
```

---

# GraphQL

Apollo Client manages communication with the backend.

```
shared/graphql/

client/

generated/

queries/

mutations/

fragments/
```

GraphQL Code Generator generates

- Types
- Hooks
- Operations

Generated code must never be edited manually.

---

# State Management

Preferred order

1. Local component state

2. React Context

3. Apollo Cache

Avoid introducing global state libraries unless a genuine cross-cutting need arises.

---

# API Layer

Application code never performs raw fetch calls.

Instead

```
Component

↓

Hook

↓

Service

↓

Apollo Client

↓

GraphQL API
```

This keeps business logic outside UI components.

---

# Error Handling

Application-level Error Boundary

GraphQL Error Handling

Network Error Handling

Unauthorized Handling

Forbidden Handling

Unexpected Error Page

User-friendly messages

Centralized logging support

---

# Loading Strategy

Every async page should support

Loading

Empty

Success

Error

Skeleton loaders are preferred over spinners for page content.

---

# Folder Dependency Rules

Allowed

```
Feature

↓

Shared
```

Allowed

```
App

↓

Feature

↓

Shared
```

Not Allowed

```
Feature A

↓

Feature B
```

Communication between features should happen through shared services or well-defined interfaces.

---

# UI Architecture

Reusable components live in

```
shared/components/
```

Feature-specific components stay inside the owning feature.

Examples

Shared

Button

Input

Table

Modal

Card

Feature

ProductCard

OrderTimeline

InvoiceSummary

PartnerStatistics

---

# Forms

Use

React Hook Form

-

Zod

Validation schemas belong beside the form.

```
forms/

schema.ts

Form.tsx
```

---

# Styling

Tailwind CSS

Guidelines

- Utility-first approach
- No inline styles unless dynamic
- Shared component variants
- Responsive by default
- Dark mode ready

---

# Environment Configuration

Environment-specific values belong in

```
.env.development

.env.test

.env.production
```

Access them only through a centralized configuration module.

Never read `import.meta.env` directly throughout the application.

---

# Security

Do not store secrets in the frontend.

Use HTTPS in all environments.

Sanitize user input.

Escape rendered content.

Validate permissions in both the UI and backend.

Never rely on frontend authorization alone.

---

# Performance

Lazy route loading

Dynamic imports

Apollo caching

Memoization when beneficial

Optimized bundle size

Image optimization

Avoid unnecessary re-renders

---

# Accessibility

Use semantic HTML.

Keyboard navigation.

Visible focus states.

ARIA attributes where required.

WCAG 2.1 AA compliance where practical.

---

# Testing Strategy

End-to-End

Playwright

Unit Tests

Vitest (introduced M10, `apps/web`)

Component Tests

React Testing Library

Critical user journeys should always have automated tests.

---

# Logging

Production logging should support

- API errors
- Authentication failures
- GraphQL errors
- Unexpected exceptions

Logging implementation should remain replaceable.

---

# Future Scalability

The architecture supports adding new modules without restructuring the application.

Examples

```
features/

notifications/

analytics/

settings/

users/

reports/
```

New features follow the same internal folder structure and architectural rules.

---

# Architectural Decisions

- Feature-based architecture instead of layer-based architecture.
- Apollo Client as the single GraphQL client.
- GraphQL Code Generator for end-to-end type safety.
- Keycloak for authentication and authorization.
- Tailwind CSS for scalable styling.
- React Hook Form with Zod for forms and validation.
- Playwright for end-to-end testing.
- Shared reusable component library to reduce duplication.

---

# Success Criteria

The architecture is considered successful when:

- New features can be added independently.
- Teams can work in parallel with minimal conflicts.
- Shared code is reusable and well organized.
- Authentication and authorization remain centralized.
- Type safety is maintained throughout the application.
- Performance remains predictable as the project grows.
- The codebase is easy to understand, test, and maintain.
