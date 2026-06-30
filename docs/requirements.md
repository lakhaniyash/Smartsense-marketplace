# SmartSense Marketplace

## Project Overview

SmartSense Marketplace is an enterprise marketplace platform for partners to manage products, inventory, orders, billing, and reports.

The application must be production-ready, scalable, maintainable, and suitable for large development teams.

---

# Goals

- Enterprise architecture
- Feature-based modular design
- Type-safe GraphQL
- Secure authentication
- Responsive UI
- Role-based authorization
- Easy maintenance
- High test coverage
- CI/CD ready

---

# Tech Stack

Frontend

- React
- TypeScript
- Vite
- React Router
- Apollo Client
- GraphQL Code Generator
- Tailwind CSS
- React Hook Form
- Zod
- Playwright

Development

- ESLint
- Prettier
- Husky
- lint-staged
- Conventional Commits
- GitHub Actions

---

# Authentication

Authentication provider:

Keycloak

Requirements

- Login
- Logout
- Silent Login
- Token Refresh
- Protected Routes
- Public Routes
- Session Timeout
- Unauthorized Page
- Forbidden Page

---

# User Roles

## Admin

Can access everything.

## Partner

Can manage products, orders, reports, billing.

## Customer

Read-only access where applicable.

Future roles should be easy to add.

---

# Modules

## Dashboard

- Overview
- Statistics
- Analytics
- Recent Activity

## Catalog

- Products
- Categories
- Inventory
- Search
- Filters
- CRUD

## Orders

- Order List
- Order Details
- Order Timeline
- Status Updates

## Billing

- Invoices
- Payments
- Reports
- Download CSV/PDF

---

# Routing

Public

/login

Private

/dashboard

/catalog

/orders

/billing

Role-based routing is required.

---

# GraphQL

Apollo Client

GraphQL Code Generator

Typed Queries

Typed Mutations

Fragments

Generated Types

---

# UI

Tailwind CSS

Reusable Components

- Button
- Input
- Select
- Modal
- Table
- Pagination
- Card
- Badge
- Skeleton
- Empty State
- Error State
- Toast

Responsive Design

Dark Mode Ready

---

# Folder Structure

Feature-based architecture.

Each feature owns:

- components
- hooks
- graphql
- services
- pages
- types
- utils

Shared code belongs in shared modules.

---

# State Management

Prefer local state.

Use Apollo Cache for server state.

Introduce additional global state only when necessary.

---

# Error Handling

Global Error Boundary

API Error Handling

Network Retry Strategy

Loading States

Empty States

---

# Performance

Lazy Loading

Code Splitting

Memoization

Apollo Cache

Optimized Bundle Size

---

# Security

Secure token handling

No secrets in frontend

Environment-based configuration

Permission-based rendering

---

# Testing

Playwright

Smoke Tests

Authentication Tests

Dashboard Tests

Catalog Tests

---

# Code Quality

Strict TypeScript

No `any`

Reusable Components

SOLID Principles

Clean Code

DRY

KISS

Meaningful naming

---

# CI/CD

GitHub Actions

- Install
- Lint
- Type Check
- Build
- Test

Automatic PR validation

---

# Coding Standards

- Functional Components
- Hooks
- Absolute Imports
- Barrel Exports
- No duplicated logic
- Reusable utilities
