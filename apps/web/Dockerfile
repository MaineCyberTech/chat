# apps/web/Dockerfile
# Multi-stage production build for Next.js with standalone output.

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.js ./apps/web/
COPY packages/ui/package.json packages/ui/tsconfig.json ./packages/ui/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ui/src ./packages/ui/src
COPY packages/db/src ./packages/db/src
COPY apps/web/app ./apps/web/app
COPY apps/web/components ./apps/web/components
COPY apps/web/lib ./apps/web/lib

# Build with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE=1
RUN pnpm turbo build --filter @chat/web

# Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
