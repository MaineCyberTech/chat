# apps/api/Dockerfile
# Multi-stage production build for the Express API server.

FROM node:22-alpine AS base
WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./

# Copy workspace packages
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db/src ./packages/db/src
COPY apps/api/src ./apps/api/src

# Build
RUN pnpm turbo build --filter @chat/api

# ---- Runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/packages/db/package.json ./packages/db/package.json
COPY --from=base /app/packages/db/dist ./packages/db/dist

# Production-only install (clean, no devDeps)
RUN pnpm install --frozen-lockfile --filter ./apps/api --prod --ignore-scripts

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app/apps/api

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/healthz || exit 1

EXPOSE 4000
CMD ["node", "dist/server.js"]
