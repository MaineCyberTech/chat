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
COPY apps/web/public ./apps/web/public
COPY apps/web/scripts ./apps/web/scripts

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_GIT_SHA
ARG NEXT_PUBLIC_BUILD_TIME

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME

# Build with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE=1
RUN pnpm turbo build --filter @chat/web

# Runtime
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache wget

COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base /app/apps/web/public ./apps/web/public

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

EXPOSE 3000

RUN addgroup --system --gid 1001 nextjs && adduser --system --uid 1001 nextjs
USER nextjs

CMD ["node", "apps/web/server.js"]