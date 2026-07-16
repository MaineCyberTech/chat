# apps/api/Dockerfile
# Multi-stage production build for the Express API server.

FROM node:22-alpine AS base
WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
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
COPY --from=base /app/packages/config/package.json ./packages/config/package.json
COPY --from=base /app/packages/config/dist ./packages/config/dist

# Production-only install (clean, no devDeps)
RUN pnpm install --frozen-lockfile --filter ./apps/api --prod --ignore-scripts

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache wget

WORKDIR /app/apps/api

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/healthz || exit 1

EXPOSE 4000

RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
USER appuser

CMD ["node", "dist/server.js"]
