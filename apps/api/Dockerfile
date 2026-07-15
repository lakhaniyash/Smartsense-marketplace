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
COPY --from=builder /repo/node_modules/.prisma node_modules/.prisma
COPY --from=builder /repo/apps/api/dist apps/api/dist

WORKDIR /repo/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
