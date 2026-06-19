# apps/web/Dockerfile
# Multi-stage production build for Next.js with standalone output.

# ---- Deps stage ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile --prod --filter @chat/web

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.js ./apps/web/
COPY packages/ui/package.json packages/ui/tsconfig.json ./packages/ui/

RUN pnpm install --frozen-lockfile --filter @chat/web

COPY packages/ui/src ./packages/ui/src
COPY apps/web/src ./apps/web/src 2>/dev/null || true
COPY apps/web/app ./apps/web/app
COPY apps/web/components ./apps/web/components
COPY apps/web/lib ./apps/web/lib
COPY apps/web/public ./apps/web/public 2>/dev/null || true

ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE=1
RUN pnpm --filter @chat/ui build
RUN pnpm --filter @chat/web build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public 2>/dev/null || true

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
