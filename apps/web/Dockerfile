# apps/web/Dockerfile
# Multi-stage production build for Next.js.

# ---- Deps stage (production only) ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/db/package.json ./packages/db/

RUN pnpm install --frozen-lockfile --prod --filter @chat/web

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.js ./apps/web/
COPY packages/ui/package.json packages/ui/tsconfig.json ./packages/ui/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/

RUN pnpm install --frozen-lockfile

COPY packages/ui/src ./packages/ui/src
COPY packages/db/src ./packages/db/src
COPY apps/web/app ./apps/web/app
COPY apps/web/components ./apps/web/components
COPY apps/web/lib ./apps/web/lib

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo build --filter @chat/web

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=build /app/packages/ui/package.json ./packages/ui/package.json
COPY --from=build /app/packages/db/package.json ./packages/db/package.json
COPY --from=build /app/package.json ./

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npx", "next", "start"]
