# SmartSense Marketplace — Authentication & Authorization

Version: 1.1
Status: Backend implemented (2026-07-02) — JWT validation, guards, decorators,
role/permission resolution. Frontend (`apps/web/src/features/auth/`) is still
unimplemented; see [Open Questions](#open-questions) and the note below.

## Purpose

This document defines the complete authentication and authorization architecture for SmartSense Marketplace: how a user proves who they are (Keycloak, JWT, refresh, silent auth, logout) and how the system decides what they're allowed to do (roles, permissions, GraphQL guards, route protection).

It builds directly on decisions already made elsewhere in the repo rather than re-deriving them:

- **Identity provider is Keycloak** — `docs/requirements.md`, `docs/architecture.md`.
- **RBAC is permission-based, not role-string-based** (`canViewOrders()`, never `role === "Admin"`) — `docs/architecture.md`.
- **The `User`/`Role`/`Permission`/`UserRole`/`RolePermission` schema already exists** in `database/prisma/schema.prisma` and is documented in `docs/database-schema.md`. `User.keycloakSubjectId` is the join key between Keycloak identity and the application's authorization data — it is _not_ a placeholder to design around, it's already there waiting to be populated by a real login.
- **Frontend feature-based architecture**: auth UI/state lives in `apps/web/src/features/auth/`, route guards in `apps/web/src/app/guards/`, Apollo Client wiring in `apps/web/src/lib/apollo/` — `docs/folder-structure.md` conventions, folders already scaffolded.
- **Backend module structure**: `apps/api/src/modules/auth/` implements this document's [Backend Auth Module Responsibilities](#backend-auth-module-responsibilities) — see `apps/api/README.md`'s Authentication & Authorization section for the concrete guard/decorator API and known gaps (notably: the local Keycloak realm doesn't yet configure an audience mapper for `smartsense-api`, so real `smartsense-web`-issued tokens will fail the audience check until that realm change ships).
- **Roadmap**: the frontend half (`apps/web/src/features/auth/`) of Phase 3 in `docs/roadmap.md` / `TASKS.md` remains unimplemented.

This document was originally written as architecture-only (no code); it has since been implemented on the backend as described above. The flows, diagrams, and configuration contracts below remain the source of truth for behavior — this file was not rewritten around the implementation, only its status header and cross-references were updated.

---

## Actors & Trust Boundaries

```mermaid
flowchart LR
    subgraph Browser["Browser (untrusted)"]
        SPA["React SPA<br/>(Apollo Client)"]
    end

    subgraph IdP["Keycloak (trusted identity provider)"]
        KC["Realm: smartsense-marketplace<br/>Client: smartsense-web (public, PKCE)<br/>Client: smartsense-api (bearer-only)"]
    end

    subgraph Backend["NestJS API (trusted)"]
        GW["GraphQL Gateway<br/>AuthGuard + PermissionGuard"]
        SVC["Domain Services"]
    end

    subgraph Data["PostgreSQL (trusted)"]
        DB[("User / Role / Permission /<br/>UserRole / RolePermission")]
    end

    SPA -- "1. Redirect to login (PKCE)" --> KC
    KC -- "2. Auth code → tokens" --> SPA
    SPA -- "3. GraphQL request + Bearer JWT" --> GW
    GW -- "4. Validate JWT via JWKS" --> KC
    GW -- "5. Resolve roles/permissions" --> SVC
    SVC --> DB
    GW -- "6. Response" --> SPA
```

Three trust boundaries matter for every decision below:

1. **Browser → Keycloak**: the only place a user's credentials are ever entered. The SPA never sees a password.
2. **Browser → API**: the SPA holds tokens and attaches them to every GraphQL request. The SPA's own "am I logged in" state is a UX convenience, never an authorization decision — it can be bypassed by anyone with dev tools, so it decides _what to render_, never _what to permit_.
3. **API → Keycloak / API → Database**: the only place authorization is actually enforced. Every GraphQL resolver that touches data re-validates the token and re-checks permissions server-side, regardless of what the UI already hid.

**Never rely on frontend authorization alone** (already stated in `docs/architecture.md`) — this document's route guards and `canViewOrders()`-style checks are UX affordances; the GraphQL Auth Guard and Permission Service on the backend are the actual security boundary.

---

## Keycloak Realm & Client Topology

| Object          | Value                        | Why                                                                                                                                                                               |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Realm           | `smartsense-marketplace`     | One realm for the whole platform; Admin/Partner/Customer are realm roles, not separate realms — they share one user directory and one login screen.                               |
| Frontend client | `smartsense-web`             | Public client, **Authorization Code + PKCE** flow, no client secret (secrets can't be kept in a browser bundle — `docs/architecture.md`: "Do not store secrets in the frontend"). |
| Backend client  | `smartsense-api`             | Confidential, **bearer-only** client — it never initiates a login, it only validates tokens issued for `smartsense-web`. Used as the JWT audience.                                |
| Redirect URIs   | per environment, exact match | e.g. `https://app.smartsense.example/*` in prod, `http://localhost:5173/*` in dev. Wildcard-free in production.                                                                   |

Realm roles map 1:1 to the three system `Role` rows already seeded in Postgres (`Admin`, `Partner`, `Customer`, `isSystemRole: true`) — see [Role Mapping](#role-mapping). Keycloak is the source of truth for _authentication and role assignment_; Postgres is the source of truth for _what a role/permission means to the application_ (the `Role ↔ Permission` graph). Keeping the fine-grained `Permission` catalog in Postgres rather than as Keycloak client roles is a deliberate choice: it lets new permissions ship as a data migration/seed change (per `docs/domain-model.md`: "Future roles should be easy to add... without code changes to authorization checks"), without touching Keycloak realm configuration or requiring a new token for every permission tweak.

---

## Complete Authentication Flow (Login)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SPA as React SPA
    participant KC as Keycloak
    participant API as NestJS GraphQL API
    participant PG as PostgreSQL

    User->>SPA: Opens app
    SPA->>SPA: AuthProvider bootstraps (features/auth)
    alt No valid session
        SPA->>KC: Redirect to /auth (Authorization Code + PKCE)
        User->>KC: Enters credentials
        KC->>KC: Authenticates user, evaluates realm role mappings
        KC-->>SPA: Redirect back with authorization code
        SPA->>KC: Exchange code (+ PKCE verifier) for tokens
        KC-->>SPA: access_token (JWT), refresh_token, id_token
    end
    SPA->>SPA: AuthService stores tokens in memory (see Session Management)
    SPA->>API: GraphQL request, header "Authorization: Bearer <access_token>"
    API->>API: GraphQL Auth Guard extracts JWT
    API->>KC: Fetch/cache JWKS (public keys) for signature verification
    API->>API: Validate signature, iss, aud, exp (see JWT Validation)
    API->>PG: Look up User by keycloakSubjectId (JWT "sub" claim)
    alt User not found (first login)
        API->>PG: Provision User row (status: Active, ownerType from claim/invite context)
    end
    API->>PG: Load UserRole → Role → RolePermission → Permission
    API->>API: Attach { user, roles, permissions } to GraphQL context
    API-->>SPA: GraphQL response
    SPA->>SPA: AuthProvider marks user authenticated, redirects to intended route
```

Key points:

- **PKCE, not implicit flow.** Authorization Code + PKCE is the current best practice for public SPA clients — no client secret, and the code exchange is bound to a locally-generated verifier so an intercepted authorization code alone is useless.
- **Just-in-time provisioning.** A `User` row is created on first successful login, keyed by `keycloakSubjectId` (matches the schema's `@unique` constraint on that column). This is what turns the seed data's placeholder `keycloakSubjectId` values (`docs/database-schema.md`: "not real identity-provider subjects... will later be populated by a real Keycloak flow") into real ones.
- **`ownerType`/`partnerId`/`customerId` are not derived from the token alone.** Whether a new user is a Partner-side or Customer-side account is determined by the invitation/onboarding context that created their Keycloak account (see `docs/domain-model.md`'s Partner Onboarding flow: "Admin creates initial Partner User"), not guessed from JWT claims. First-login provisioning attaches to an existing pending `User` record (created during invite) rather than fabricating organization membership from the token.
- **The backend, not the SPA, is the source of truth for roles/permissions** actually enforced — the SPA's copy of the user's roles (parsed from the ID token / a `me` query) is for rendering only.

---

## JWT Validation

Every GraphQL request (except explicitly public operations — see [GraphQL Authentication](#graphql-authentication)) is validated server-side before it reaches a resolver.

```mermaid
flowchart TD
    A["Incoming request:<br/>Authorization: Bearer &lt;token&gt;"] --> B{Header present<br/>and well-formed?}
    B -- No --> Z1["401 Unauthenticated"]
    B -- Yes --> C["Decode JWT header (kid)"]
    C --> D{"Signing key cached<br/>for this kid?"}
    D -- No --> E["Fetch JWKS from Keycloak<br/>(realm well-known endpoint)"]
    E --> F["Cache keys (TTL-bound)"]
    D -- Yes --> G
    F --> G["Verify RS256 signature"]
    G -- Invalid --> Z1
    G -- Valid --> H{"exp in the future?"}
    H -- No (expired) --> Z1
    H -- Yes --> I{"iss == expected realm issuer?"}
    I -- No --> Z1
    I -- Yes --> J{"aud / azp includes<br/>smartsense-api?"}
    J -- No --> Z1
    J -- Yes --> K["Extract sub, realm_access.roles, email"]
    K --> L["Load or provision User by keycloakSubjectId"]
    L --> M{"User.status == Active?"}
    M -- No (Suspended/Deactivated) --> Z2["401 Unauthenticated<br/>(session invalidated)"]
    M -- Yes --> N["Attach AuthContext to request:<br/>{ user, roles, permissions, tokenExp }"]
    N --> O["Continue to GraphQL Auth Guard"]
```

Claims validated on every request:

| Claim         | Check                                                                                                      | Why                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `signature`   | Verified against Keycloak's JWKS (`RS256`), keys cached and refreshed by `kid`, not re-fetched per request | Confirms the token was actually issued by this realm and hasn't been tampered with.                                               |
| `exp`         | Must be in the future                                                                                      | Expired tokens are rejected even if otherwise valid — this is what makes token refresh necessary.                                 |
| `iss`         | Must exactly match the configured realm issuer URL                                                         | Prevents tokens from a different realm/environment being accepted (e.g. a staging token replayed against production).             |
| `aud` / `azp` | Must include/equal the backend's client id (`smartsense-api`)                                              | Prevents a token issued for a different client/application from being accepted here (audience confusion).                         |
| `sub`         | Used as `keycloakSubjectId` lookup key                                                                     | Never trust `email` or a display name claim as the identity key — `sub` is stable even if a user changes their email in Keycloak. |

Beyond the token itself, `User.status` is re-checked against Postgres on every request (not cached in the token) — this is how a Suspended/Deactivated user is locked out immediately, even if they're still holding an unexpired access token. A 10–15 minute access-token lifetime bounds the worst case where this check is skipped by a still-valid cached token; the [Permission Service](#permission-service) is the layer that actually reads `User.status`.

---

## Role Mapping

Keycloak realm roles are the transport; Postgres `Role`/`UserRole` rows are what the application actually queries. Mapping happens once, at provisioning/login time, not on every request.

```mermaid
sequenceDiagram
    autonumber
    participant KC as Keycloak JWT
    participant API as Backend (login/provisioning)
    participant PG as PostgreSQL

    KC->>API: realm_access.roles: ["Partner"]
    API->>PG: SELECT Role WHERE name IN (token roles) AND isSystemRole
    alt Role exists in Postgres
        API->>PG: Upsert UserRole(userId, roleId) if not already assigned
    else Role unknown to Postgres
        API->>API: Log + ignore unknown role<br/>(fail closed — do not grant undefined access)
    end
    API->>PG: SELECT Permission via UserRole → Role → RolePermission
    API->>API: Cache resolved permission set on the request's AuthContext
```

Rules:

- **Keycloak realm role names must exactly match `Role.name`** for the three system roles (`Admin`, `Partner`, `Customer`) — this is the join key. Renaming a role in Keycloak without a corresponding Postgres migration breaks the mapping by design (fail closed, per the flow above), which is preferable to silently granting the wrong access.
- **A user can hold multiple roles** (already modeled: `User ↔ Role` is many-to-many via `UserRole`, per `docs/domain-model.md`'s "Billing Manager and Catalog Editor" example) — a Keycloak user can have multiple realm roles, and each maps independently.
- **Custom, non-system roles** (`isSystemRole: false`) are managed entirely in Postgres by an Admin through the application (not by editing Keycloak) — they're a composition of existing `Permission`s and don't require a new Keycloak realm role per custom role. This keeps "future roles should be easy to add" (`docs/requirements.md`) true without IdP configuration changes.
- Role sync happens **on login and on token refresh**, not via a Keycloak webhook — simpler operationally for v1, at the cost of role changes taking effect on the user's next token refresh rather than instantly. Acceptable given access tokens are short-lived (10–15 min).

---

## Permission Strategy

The **Permission Service** is the single place authorization decisions are computed, both so `docs/architecture.md`'s rule ("UI must never contain hardcoded role checks... use `canViewOrders()`, `canEditCatalog()`") is enforceable on the frontend, and so the backend never duplicates that logic per-resolver.

```mermaid
flowchart TD
    subgraph Backend["Backend: source of truth"]
        A["AuthContext (per-request):<br/>{ user, roleIds, permissionKeys }"]
        B["PermissionService.can(user, permissionKey)"]
        C["GraphQL field/resolver guard reads decision"]
    end

    subgraph Frontend["Frontend: UX mirror, not enforcement"]
        D["me query returns<br/>{ roles, permissions } on login"]
        E["PermissionService (features/auth/services)<br/>canViewOrders(), canEditCatalog(), ..."]
        F["Route guards + conditional rendering"]
    end

    A --> B --> C
    D --> E --> F
    C -. "same permission keys as" .-> E
```

Design rules:

1. **One permission catalog, two consumers.** The `Permission.key` values seeded in Postgres (`catalog:write`, `orders:read`, `billing:manage`, etc. — `docs/database-schema.md`) are the single vocabulary. The backend's `PermissionService.can(userId, key)` and the frontend's generated `canX()` helpers both key off the same strings, so a permission added once in the seed/migration is immediately expressible on both sides without inventing a parallel naming scheme.
2. **Backend permission resolution is request-scoped and computed from the database**, not from the JWT — permissions can change (role reassigned, custom role edited) without waiting for a new token, since the check re-reads `UserRole → Role → RolePermission → Permission` per request (see [Backend Auth Module Responsibilities](#backend-auth-module-responsibilities) for caching notes).
3. **Frontend permission helpers are named by capability, never by role**, exactly matching the existing example in `docs/architecture.md`:
   - Correct: `canViewOrders()`, `canEditCatalog()`
   - Incorrect: `role === "Admin"`
     This is what lets a permission's _meaning_ change (e.g. Partner gains `orders:write`) without touching every call site that already calls `canEditOrders()`.
4. **Deny by default.** Both layers treat "permission not present in the resolved set" as denied — there is no implicit allow, and no permission check is ever skipped because a route "looks internal."
5. **Ownership checks compose with permission checks, they don't replace them.** `orders:read` tells you a Partner user can read _orders in general_; whether they can read _this specific_ order additionally requires `Order.partnerId == user.partnerId` (or `Admin` bypassing that scoping). The Permission Service checks the former; resolver/service-layer logic checks the latter — conflating them would let one Partner's `orders:read` leak another Partner's orders.

---

## Authorization Flow (Putting It Together)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SPA as React SPA
    participant Guard as Route Guard
    participant API as GraphQL API
    participant AuthGuard as GraphQL Auth Guard
    participant PermGuard as Permission Guard
    participant Svc as Domain Service

    User->>SPA: Navigates to /catalog/new (create product)
    SPA->>Guard: ProtectedRoute checks isAuthenticated
    alt Not authenticated
        Guard-->>User: Redirect to /login
    end
    SPA->>Guard: PermissionRoute checks canEditCatalog()
    alt Missing permission (UX check only)
        Guard-->>User: Redirect to /forbidden
    else Has permission
        Guard-->>SPA: Render page
        User->>SPA: Submits "create product" mutation
        SPA->>API: createProduct(input) + Bearer token
        API->>AuthGuard: Validate JWT (see JWT Validation)
        AuthGuard-->>API: AuthContext attached, or 401
        API->>PermGuard: Check "catalog:write" for this resolver/field
        PermGuard->>Svc: PermissionService.can(user, "catalog:write")
        alt Denied
            PermGuard-->>API: GraphQL error (FORBIDDEN)
        else Allowed
            PermGuard-->>API: Continue
            API->>Svc: Execute createProduct business logic
            Svc-->>API: Result
            API-->>SPA: GraphQL response
        end
    end
```

This is the concrete illustration of "never rely on frontend authorization alone": the route guard's `canEditCatalog()` check only ever prevents an _authorized-but-not-permitted_ user from wasting a round trip on a form they can't submit. The mutation is re-checked from scratch by `PermGuard` server-side regardless of whether the SPA's check passed, was stale, or was bypassed entirely.

---

## GraphQL Authentication

Enforcement lives at the schema/resolver level, not as a blanket HTTP middleware, because some operations must remain public (login bootstrapping, health-adjacent introspection in non-prod).

```mermaid
flowchart TD
    A["GraphQL request hits /graphql"] --> B{"Operation marked @Public?"}
    B -- Yes --> C["Skip auth guard entirely"]
    B -- No --> D["AuthGuard: validate JWT<br/>(see JWT Validation flow)"]
    D -- Invalid/missing --> E["Return UNAUTHENTICATED<br/>GraphQL error, no resolver executes"]
    D -- Valid --> F["Attach AuthContext to request"]
    F --> G{"Resolver/field requires<br/>a specific Permission?"}
    G -- No --> H["Execute resolver<br/>(authenticated-only, no fine-grained check)"]
    G -- Yes --> I["PermissionGuard: PermissionService.can(...)"]
    I -- Denied --> J["Return FORBIDDEN<br/>GraphQL error, no resolver executes"]
    I -- Allowed --> H
    C --> H
```

Conventions:

- **Guard order is global-first, then per-resolver.** `AuthGuard` is registered globally (`APP_GUARD`, alongside the existing global `GlobalExceptionFilter`/`AppValidationPipe` in `apps/api/src/common/`) so authentication is opt-out (`@Public()` decorator) rather than opt-in — a new resolver is secure by default, not insecure until someone remembers to guard it.
- **`PermissionGuard` is declarative and per-operation**, driven by a decorator naming the required `Permission.key` (e.g. `@RequirePermission('catalog:write')` on the `createProduct` mutation) — the mapping from GraphQL operation to permission key lives next to the resolver, not in a separate config file that drifts from the schema.
- **Errors distinguish 401 from 403.** `UNAUTHENTICATED` (bad/missing/expired token) and `FORBIDDEN` (valid identity, insufficient permission) are different GraphQL error codes/extensions, because the SPA reacts differently: `UNAUTHENTICATED` triggers silent refresh or redirect-to-login; `FORBIDDEN` renders an in-app "you don't have access" state without touching the session.
- **`@Public()` is reserved for genuinely public operations** — there are none in the current domain model (no anonymous browsing requirement in `docs/requirements.md`), so in practice this decorator exists for future use (e.g. a public product catalog) and possibly a `login`-adjacent bootstrapping query, not general use.
- **Field-level guards, not just operation-level**, are available for cases like an `Order` type exposing a `partner { commissionRate }` field that only `Admin`/that `Partner`'s own users should see — the same `PermissionGuard` mechanism applies at the field resolver, not only the root query/mutation.

---

## Route Protection (Frontend)

Matches the routing/layout structure already defined in `docs/architecture.md` and `docs/folder-structure.md` (`app/router`, `app/guards`, `app/layouts`).

```mermaid
flowchart TD
    A["Route requested"] --> B{"Route type?"}
    B -- Public --> C["PublicLayout renders directly<br/>(/login, /unauthorized, /forbidden, /404)"]
    B -- Private --> D{"AuthProvider: isAuthenticated?"}
    D -- "Unknown yet (bootstrapping)" --> E["Render app-level loading state<br/>(no flash of login or content)"]
    D -- No --> F["Redirect to /login,<br/>preserve intended path"]
    D -- Yes --> G{"Route declares<br/>required permission(s)?"}
    G -- No --> H["Render route inside<br/>role-appropriate Layout"]
    G -- Yes --> I{"PermissionService.canX()<br/>via useAuth/usePermission"}
    I -- No --> J["Redirect to /forbidden"]
    I -- Yes --> H
    H --> K["Lazy-loaded page component mounts"]
```

Guard responsibilities (`app/guards/`, per existing folder scaffold):

| Guard             | Checks                                                                                             | Failure behavior                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ProtectedRoute`  | `isAuthenticated` only                                                                             | Redirect to `/login`, remembering the attempted path for post-login redirect.                              |
| `PermissionRoute` | `isAuthenticated` **and** a declared `canX()`                                                      | Redirect to `/forbidden` if authenticated but lacking permission; to `/login` if not authenticated at all. |
| `PublicRoute`     | Inverse — redirects an already-authenticated user away from `/login` to their default landing page | Prevents a logged-in user from re-seeing the login form via back-navigation.                               |

Layout selection (Public / Admin / Partner / Customer, per `docs/architecture.md`) happens **after** authentication resolves, driven by the user's resolved roles from the Permission Service — not by decoding the JWT again in the layout component. Layout is a rendering concern, not an authorization one.

Unauthorized vs. forbidden distinction mirrors the backend's 401/403 split:

- **`/unauthorized`** — reached when a request comes back `UNAUTHENTICATED` while the SPA still believes it has a session (e.g. token invalidated server-side, user Suspended mid-session). Action: clear local session, redirect to `/login`.
- **`/forbidden`** — reached when a route or an in-page action is blocked by a permission the authenticated user doesn't have. Action: stay logged in, offer navigation back to an allowed area.

---

## Session Management

```mermaid
flowchart LR
    subgraph Memory["In-memory (JS heap) — cleared on tab close"]
        AT["access_token"]
        IT["id_token"]
    end
    subgraph Storage["Browser storage"]
        RT["refresh_token<br/>(httpOnly-equivalent handling — see note)"]
    end
    subgraph Apollo["Apollo Client"]
        Link["authLink: attaches<br/>Authorization header per request"]
    end

    AT --> Link
    Link --> GQL["GraphQL requests"]
```

Decisions and rationale:

- **Access tokens live in memory only** (a module-level variable inside the `features/auth` service, not `localStorage`/`sessionStorage`) — this is the standard mitigation against XSS-based token theft: a successful script injection can call app code but has nothing persisted to read if the app is reloaded.
- **Refresh token handling depends on the Keycloak adapter's capability**: the preferred setup is Keycloak's iframe-based silent SSO check (`keycloak-js`'s `checkLoginIframe` / silent SSO redirect), which avoids the SPA ever directly handling a long-lived refresh token in JS-accessible storage. If a refresh token must be held client-side (fallback for browsers blocking third-party iframes), it is treated as sensitive as the access token — memory-preferred, short session-storage lifetime as a fallback, never `localStorage`.
- **Session lifetime is bounded by Keycloak realm settings**, not invented client-side: `SSO Session Idle` and `SSO Session Max` govern how long a refresh token remains usable; the SPA's own "session timeout" behavior (warning banner, forced logout) is a UX layer on top of those server-enforced bounds, not a replacement for them.
- **No session data is duplicated into a custom backend session store.** NestJS resolves authorization per-request from the JWT + Postgres; there is no server-side session object to keep in sync with Keycloak's, which avoids a second source of truth for "is this session still valid."

---

## Silent Refresh & Token Refresh Strategy

```mermaid
sequenceDiagram
    autonumber
    participant SPA as React SPA (AuthProvider)
    participant KC as Keycloak

    Note over SPA: On app bootstrap
    SPA->>KC: Silent SSO check (hidden iframe / silent-check-sso.html)
    alt Active Keycloak session exists
        KC-->>SPA: Tokens issued without user interaction
    else No session
        KC-->>SPA: No tokens — user must log in interactively
    end

    Note over SPA: During active use
    loop Every tick, before access_token exp
        SPA->>SPA: AuthService checks token expiry (e.g. < 60s remaining)
        SPA->>KC: Refresh using refresh_token (silent, no redirect)
        alt Refresh succeeds
            KC-->>SPA: New access_token (+ rotated refresh_token if enabled)
        else Refresh fails (expired/revoked)
            SPA->>SPA: Trigger logout flow (session genuinely over)
        end
    end

    Note over SPA: Reactive path
    SPA->>SPA: Apollo error link observes UNAUTHENTICATED response
    SPA->>KC: Force an immediate refresh attempt
    alt Refresh succeeds
        SPA->>SPA: Retry the original GraphQL operation once
    else Refresh fails
        SPA->>SPA: Trigger logout flow
    end
```

Two independent refresh triggers, deliberately redundant:

1. **Proactive**: a timer scheduled off the token's own `exp` refreshes before expiry, so a user mid-task never hits a 401 in the first place.
2. **Reactive**: an Apollo Client error link (configured in `lib/apollo/`) catches an `UNAUTHENTICATED` response as a safety net — covers clock drift, a suspended tab that missed its timer, or a token invalidated server-side — and retries the failed operation exactly once after a successful refresh, to avoid infinite retry loops.

If **refresh token rotation** is enabled in Keycloak (recommended), every refresh call returns a new refresh token and invalidates the old one — the SPA must always persist the latest one and never reuse a rotated-out token. This is a Keycloak realm/client setting, not something the SPA can opt out of unilaterally once enabled.

---

## Logout Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SPA as React SPA
    participant KC as Keycloak
    participant API as GraphQL API

    User->>SPA: Clicks "Log out"
    SPA->>SPA: AuthService clears in-memory tokens immediately
    SPA->>SPA: Apollo Client cache reset (evict all cached data)
    SPA->>KC: Redirect to Keycloak end-session endpoint<br/>(id_token_hint + post_logout_redirect_uri)
    KC->>KC: Invalidate the SSO session (and refresh token)
    KC-->>SPA: Redirect back to post_logout_redirect_uri (/login)
    Note over API: No explicit backend call needed for logout —<br/>the API is stateless per-request; the next request<br/>with no/invalid token is simply unauthenticated.
```

Notes:

- **Local-first clearing**: in-memory tokens and Apollo cache are cleared _before_ the redirect fires, so a slow network to Keycloak never leaves stale, authenticated-looking UI visible.
- **True single sign-out**, not just a local state clear — redirecting through Keycloak's end-session endpoint invalidates the SSO session and refresh token server-side, so a stolen/leaked refresh token can't be used after logout, and (if other apps share this realm in the future) they're signed out too.
- **Idle/expired-session logout** (refresh failed, `User.status` flips to Suspended mid-session) follows the same client-side clearing path but skips the Keycloak end-session redirect if there's no active Keycloak session left to close — it lands the user on `/login` with a "session expired" message instead of a generic logout.

---

## Multi-Environment Configuration

Configuration is environment-specific and centralized, per the existing pattern (`docs/architecture.md`: "Access [env values] only through a centralized configuration module... never read `import.meta.env` directly"; backend already has `@nestjs/config` + Joi validation in `apps/api/src/config/`).

| Environment             | Keycloak realm/client posture                                                                                                                                                                             | Token lifetimes                                                                  | Notes                                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Local / development** | Dedicated `smartsense` realm on a local/dev Keycloak instance (Docker)                                                                                                                                    | Longer-lived access tokens acceptable for developer convenience (e.g. 15–30 min) | `GRAPHQL_PLAYGROUND`/introspection may stay on (already the pattern for `GRAPHQL_*` vars); Keycloak client redirect URIs point at `localhost`.                                                                                                                           |
| **Test / CI**           | Either a throwaway Keycloak container per test run, or mocked JWTs signed with a test key pair (see `docs/testing.md`'s "GraphQL mocking" scope)                                                          | Short-lived, deterministic                                                       | E2E auth smoke tests (`TASKS.md` Phase 11) need a scripted way to obtain a valid token without a human in a login form — a Keycloak "Direct Access Grants" test-only client, or a pre-seeded test user, is an implementation decision for that phase, not this document. |
| **Staging**             | Separate realm or realm environment mirroring production client config, distinct database                                                                                                                 | Production-equivalent lifetimes                                                  | Exists so refresh-rotation, session-timeout, and logout behavior are verified against a real Keycloak before shipping, not just against dev shortcuts.                                                                                                                   |
| **Production**          | Locked-down redirect URIs (exact match, HTTPS only), introspection/playground disabled (matches existing `GRAPHQL_INTROSPECTION`/`GRAPHQL_PLAYGROUND` defaults trending false), refresh token rotation on | Short access tokens (5–15 min), bounded `SSO Session Max`                        | HTTPS enforced everywhere (`docs/architecture.md`: "Use HTTPS in all environments"). Client secrets (backend confidential client) sourced from a secrets manager, never committed — consistent with `docs/deployment.md`'s "Secrets" scope.                              |

The frontend's existing `VITE_KEYCLOAK_*` variables (already in `apps/web/.env.example`) and the backend's Joi-validated config module are the two places these differences are expressed — no environment branching inside application/auth logic itself.

---

## Required Environment Variables

Extending the variables already present in `apps/web/.env.example` and `apps/api/.env.example`.

### Frontend (`apps/web/.env.*`)

| Variable                             | Example (dev)                   | Required       | Description                                                                                                                                    |
| ------------------------------------ | ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_GRAPHQL_URL`                   | `http://localhost:4000/graphql` | Yes (existing) | GraphQL endpoint the Apollo Client targets.                                                                                                    |
| `VITE_KEYCLOAK_URL`                  | `http://localhost:8080`         | Yes (existing) | Base URL of the Keycloak server.                                                                                                               |
| `VITE_KEYCLOAK_REALM`                | `smartsense-marketplace`        | Yes (existing) | Realm name.                                                                                                                                    |
| `VITE_KEYCLOAK_CLIENT_ID`            | `smartsense-web`                | Yes (existing) | Public SPA client id.                                                                                                                          |
| `VITE_AUTH_SILENT_CHECK_SSO_URL`     | `/silent-check-sso.html`        | Yes (new)      | Path to the static silent-SSO check page used for iframe-based silent authentication.                                                          |
| `VITE_AUTH_POST_LOGOUT_REDIRECT_URI` | `http://localhost:5173/login`   | Yes (new)      | Where Keycloak redirects after end-session logout.                                                                                             |
| `VITE_AUTH_SESSION_WARNING_SECONDS`  | `60`                            | No (new)       | How long before token expiry the SPA proactively refreshes / can warn the user, per [Silent Refresh](#silent-refresh--token-refresh-strategy). |

### Backend (`apps/api/.env`)

| Variable                                                         | Example (dev)                                                                       | Required                                                                             | Description                                                                                                                                                                                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                           | `3000`                                                                              | Yes (existing)                                                                       | HTTP port.                                                                                                                                                                                                          |
| `NODE_ENV`                                                       | `development`                                                                       | Yes (existing)                                                                       | Environment name.                                                                                                                                                                                                   |
| `DATABASE_URL`                                                   | `postgresql://postgres:password@localhost:5432/smartsense_marketplace`              | Yes (existing)                                                                       | PostgreSQL connection string.                                                                                                                                                                                       |
| `GRAPHQL_DEBUG` / `GRAPHQL_INTROSPECTION` / `GRAPHQL_PLAYGROUND` | see existing defaults                                                               | Yes (existing)                                                                       | Unchanged by this design.                                                                                                                                                                                           |
| `KEYCLOAK_URL`                                                   | `http://localhost:8080`                                                             | Yes (new)                                                                            | Base URL of the Keycloak server the API validates tokens against.                                                                                                                                                   |
| `KEYCLOAK_REALM`                                                 | `smartsense-marketplace`                                                            | Yes (new)                                                                            | Realm whose issuer/JWKS the API trusts.                                                                                                                                                                             |
| `KEYCLOAK_API_CLIENT_ID`                                         | `smartsense-api`                                                                    | Yes (new)                                                                            | This API's own client id — expected token audience (`aud`/`azp`).                                                                                                                                                   |
| `KEYCLOAK_API_CLIENT_SECRET`                                     | _(secret, from vault)_                                                              | Yes in staging/prod, optional locally                                                | Confidential client secret, only needed if the API itself calls Keycloak's admin/token endpoints (e.g. service-account calls for provisioning); never committed, sourced per `docs/deployment.md` secrets handling. |
| `KEYCLOAK_JWKS_URI`                                              | `http://localhost:8080/realms/smartsense-marketplace/protocol/openid-connect/certs` | No (derivable from `KEYCLOAK_URL`+`KEYCLOAK_REALM`, but explicit override supported) | JWKS endpoint used for signature verification; explicit override useful when the API reaches Keycloak via an internal Docker network hostname different from the browser-facing URL.                                |
| `KEYCLOAK_JWKS_CACHE_TTL_SECONDS`                                | `600`                                                                               | No (new, has default)                                                                | How long signing keys are cached before re-fetch.                                                                                                                                                                   |
| `JWT_CLOCK_TOLERANCE_SECONDS`                                    | `5`                                                                                 | No (new, has default)                                                                | Small allowance for clock drift when validating `exp`/`iat` across containers.                                                                                                                                      |

All new variables are added to each app's Joi (backend) / documented `.env.example` (frontend) validation, following the existing `validation.schema.ts` pattern — startup fails fast on a missing required variable rather than failing silently at first login attempt.

---

## Required Docker Services

Extending `apps/api/docker-compose.yml` and `infrastructure/docker/docker-compose.yml`, which today define `api` + `db` only.

| Service                                                          | Image (example)                                                           | Purpose                                                    | Notes                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keycloak`                                                       | `quay.io/keycloak/keycloak:<pinned-version>`                              | Identity provider for local/full-stack development         | Runs in `start-dev` mode locally only; production Keycloak is a managed/hardened deployment outside this repo's Docker Compose, per `docs/deployment.md`'s environment separation.                                                |
| `keycloak-db` _(or shared `db` with a separate database/schema)_ | `postgres:17-alpine` (matches the API's Postgres version for consistency) | Keycloak's own persistence (realm config, users, sessions) | Kept logically separate from `smartsense_marketplace` (the app's business database) — Keycloak owns identity data, the app owns business + authorization-graph data (`Role`/`Permission`), and the two must never share a schema. |
| `db`                                                             | `postgres:17-alpine` _(existing)_                                         | Application database                                       | Unchanged.                                                                                                                                                                                                                        |
| `api`                                                            | build from `apps/api/Dockerfile` _(existing)_                             | NestJS GraphQL API                                         | Gains the `KEYCLOAK_*` environment variables above; `depends_on: keycloak` (healthy) in addition to the existing `db` dependency, so the API doesn't attempt JWKS fetches before Keycloak is up.                                  |

Local dev bootstrap order implied by these dependencies: `keycloak-db` → `keycloak` → (realm import) → `db` → `api` → `web`. Realm/client import (the `smartsense-marketplace` realm, `smartsense-web`/`smartsense-api` clients, seeded via a Keycloak realm export JSON mounted into the container) is a one-time provisioning concern for the implementation phase, not modeled further here.

---

## Backend Auth Module Responsibilities

Fills in the existing `apps/api/src/modules/auth/` boilerplate (`AuthModule`, `AuthResolver`, `AuthService` — currently a placeholder `authStatus` query per `apps/api/README.md`) without prescribing code:

- **`AuthModule`** becomes the home for the JWT validation strategy, the global `AuthGuard`, the `PermissionGuard`, and the `@Public()` / `@RequirePermission()` decorators — registered once and reused by every other feature module's resolvers.
- **`AuthService`** owns: JWKS fetching/caching, `User` provisioning-on-first-login, and role-sync (Keycloak roles → `UserRole` rows) described above. It is the only place that talks to Keycloak from the backend.
- **`PermissionService`** (new, sibling to `AuthService`) owns resolving a `User`'s effective `Permission` set and exposes the `can(user, permissionKey)` check used by `PermissionGuard` — this is the backend half of the Permission Strategy above, and the only place `RolePermission`/`Permission` tables are queried for authorization purposes.
- **`AuthResolver`** exposes the minimal GraphQL surface the frontend needs: a `me` query (current user + resolved roles/permissions, consumed by the frontend's own Permission Service mirror) — login/logout/refresh themselves are Keycloak-direct flows from the browser, not GraphQL mutations, so this resolver stays intentionally small.

## Frontend Auth Feature Responsibilities

Fills in `apps/web/src/features/auth/` (already scaffolded with `components/`, `constants/`, `graphql/`, `hooks/`, `pages/`, `services/`, `types/`, `utils/`):

- **`services/`** — the only code in the entire frontend allowed to import the Keycloak adapter directly (`docs/architecture.md`: "Application code must never access Keycloak directly. Always use the Authentication Service."). Owns login/logout/silent-refresh orchestration and in-memory token storage.
- **`hooks/`** — `useAuth()` (identity + authentication status) and a permission hook (e.g. `usePermission()`/direct `canX()` imports) that read from the resolved `me` data, consumed by guards and components.
- **`pages/`** — `/login` (redirect-only, minimal UI — Keycloak owns the actual credential form), `/unauthorized`, `/forbidden`.
- **`graphql/`** — the `me` query and its generated types (per `docs/graphql.md` conventions once written — GraphQL Code Generator output, never hand-edited).
- **`app/guards/`** (outside the feature, per the App layer) — `ProtectedRoute`, `PermissionRoute`, `PublicRoute`, consuming `features/auth/hooks` rather than reaching into Keycloak or Apollo directly.

---

## Security Best Practices Checklist

Consolidates the security posture implied throughout this document, cross-referenced against `docs/architecture.md`'s existing Security section:

- [ ] Authorization Code + PKCE for the SPA; no implicit flow, no client secret in frontend code or bundle.
- [ ] Access tokens held in memory only; never `localStorage`/`sessionStorage`.
- [ ] All traffic over HTTPS in every environment beyond local dev.
- [ ] JWT validated on every request: signature (JWKS), `exp`, `iss`, `aud`/`azp` — never decoded-but-unverified.
- [ ] `User.status` re-checked from Postgres per request, not trusted from token claims alone.
- [ ] Deny-by-default permission checks; no implicit allow anywhere in `PermissionGuard`/`PermissionService`.
- [ ] Frontend permission checks (`canX()`) are UX-only; every mutation/query re-enforces permissions server-side.
- [ ] Ownership scoping (e.g. `Order.partnerId == user.partnerId`) enforced alongside, not instead of, permission checks.
- [ ] Refresh token rotation enabled; rotated-out tokens rejected on reuse.
- [ ] True single sign-out via Keycloak's end-session endpoint on logout, not just local state clearing.
- [ ] Redirect URIs are exact-match per environment; no wildcards in staging/production.
- [ ] Backend confidential client secret sourced from a secrets manager, never committed (`docs/deployment.md` scope).
- [ ] Keycloak's own database is isolated from the application database — identity data and business/authorization data never share a schema.
- [ ] `AuditLog` records authentication-relevant business actions (role/permission changes, Partner/User suspension) per `docs/domain-model.md`'s Audit Log entity — auth failures themselves are logged (not audited as business events) per `docs/architecture.md`'s Logging section ("Authentication failures").

---

## Open Questions

Carried forward for stakeholder/implementation-phase decision, in the same spirit as `docs/domain-model.md`'s open questions:

1. Should refresh happen via Keycloak's iframe-based silent SSO (`checkLoginIframe`) or a same-origin backend proxy, given increasing third-party-cookie/iframe restrictions in modern browsers? This affects the [Session Management](#session-management) refresh-token-handling note.
2. Does the test/CI environment use a real (containerized) Keycloak instance or signed-mock JWTs for Playwright authentication tests (`docs/testing.md`, once written)? Affects CI runtime and fixture design.
3. Should custom (non-system) `Role`s ever need a corresponding Keycloak realm role, or do they remain purely a Postgres-side composition of `Permission`s assigned directly to `User`s who also hold a system role for Keycloak-side identity purposes? Current design assumes the latter but this hasn't been validated against a concrete "custom role" use case yet.
4. Is a dedicated `keycloak-db` Postgres instance justified for local Docker Compose, or is a separate database within the existing `db` service (same Postgres container, different database name) sufficient to keep the isolation property without a second container? Affects the [Required Docker Services](#required-docker-services) table.
