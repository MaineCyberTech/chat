# apps/web/Dockerfile
# Multi-stage production build for Next.js with standalone output.

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.js ./apps/web/
COPY packages/ui/package.json packages/ui/tsconfig.json ./packages/ui/

RUN pnpm install --frozen-lockfile

COPY packages/ui/src ./packages/ui/src
COPY apps/web/app ./apps/web/app
COPY apps/web/components ./apps/web/components
COPY apps/web/lib ./apps/web/lib

ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE=1
RUN pnpm turbo build --filter @chat/web

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]