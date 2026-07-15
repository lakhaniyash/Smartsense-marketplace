# Web production image. Build CONTEXT is the monorepo root (npm workspaces
# resolve against the root package-lock.json), referenced from Compose as:
#   build: { context: ../.., dockerfile: apps/web/Dockerfile }
FROM node:22-alpine AS builder

WORKDIR /repo

# Install against the root lockfile. Copy every workspace's package.json first
# so `npm ci` can validate the lockfile and link workspaces, before the source
# — this keeps the dependency layer cached across source-only changes.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN npm ci

# Vite inlines VITE_* at build time, so they arrive as build args. One image
# per environment is accepted for the single-VPS v1.0 (docs/deployment.md);
# runtime env injection is a documented future enhancement.
ARG VITE_GRAPHQL_URL=http://localhost:3000/graphql
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_KEYCLOAK_REALM=smartsense-marketplace
ARG VITE_KEYCLOAK_CLIENT_ID=smartsense-web
ARG VITE_AUTH_SILENT_CHECK_SSO_URL=/silent-check-sso.html
ARG VITE_AUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/login
ARG VITE_AUTH_SESSION_WARNING_SECONDS=60
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID \
    VITE_AUTH_SILENT_CHECK_SSO_URL=$VITE_AUTH_SILENT_CHECK_SSO_URL \
    VITE_AUTH_POST_LOGOUT_REDIRECT_URI=$VITE_AUTH_POST_LOGOUT_REDIRECT_URI \
    VITE_AUTH_SESSION_WARNING_SECONDS=$VITE_AUTH_SESSION_WARNING_SECONDS

COPY apps/web/ apps/web/
RUN npm run build --workspace @smartsense/web

# ---------------------------------------------------------------------------

FROM nginx:alpine AS production

# Static SPA served by nginx with a history fallback + security headers.
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

# nginx:alpine's default CMD already runs `nginx -g 'daemon off;'`.
