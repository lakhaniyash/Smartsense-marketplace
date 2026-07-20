# Build CONTEXT is the monorepo ROOT (SM-263): the API depends on the
# workspace lockfile, packages/*, and database/prisma/schema.prisma — all
# outside apps/api. Referenced from Compose as:
#   build: { context: ../.., dockerfile: apps/api/Dockerfile }
FROM node:22-alpine AS builder

WORKDIR /repo

# Deps first (cached across source-only changes): root lockfile + every
# workspace manifest so `npm ci` can validate the lockfile and link workspaces.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/ packages/
RUN npm ci

# Prisma schema + API source, then generate the client and compile.
COPY database/ database/
COPY apps/api/ apps/api/
RUN npm run prisma:generate --workspace=@smartsense/api
RUN npm run build --workspace=@smartsense/api

# ---------------------------------------------------------------------------

FROM node:22-alpine AS production

WORKDIR /repo

ENV NODE_ENV=production

# Production dependencies only. `npm ci --omit=dev` reinstalls @prisma/client
# without its generated output, so the generated client (node_modules/.prisma,
# incl. the alpine query engine) is copied from the builder afterward.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/ packages/
# --ignore-scripts: the root `prepare` lifecycle runs husky (a devDependency
# absent under --omit=dev, which would fail with exit 127); the generated
# Prisma client is copied from the builder below, so no postinstall is needed.
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder --chown=node:node /repo/node_modules/.prisma node_modules/.prisma
COPY --from=builder --chown=node:node /repo/apps/api/dist apps/api/dist

# GraphQLModule's code-first schema builder writes the compiled schema to
# `src/schema.gql` (relative to cwd) on every boot, per app.module.ts's
# `autoSchemaFile: join(process.cwd(), 'src/schema.gql')` — a runtime side
# effect, not a build artifact. That directory doesn't otherwise exist in
# this stage (only `dist` is copied); create it, owned by the unprivileged
# user below, so the write succeeds under `USER node` instead of only
# working by accident because the container used to run as root.
RUN mkdir -p apps/api/src && chown node:node apps/api/src

WORKDIR /repo/apps/api

# Least privilege: run as the image's built-in unprivileged `node` user
# (uid 1000), never root, in the serving container.
USER node

EXPOSE 3000

# node:22-alpine has neither curl nor wget; Node itself is always present, so
# a tiny inline http GET against the API's own /health is the healthcheck —
# same one-shot pattern used by apps/api/docker-compose.yml's healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('node:http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
