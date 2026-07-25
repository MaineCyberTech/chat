FROM node:22-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./

COPY packages ./packages
COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/

RUN pnpm install --frozen-lockfile

COPY apps/worker/src ./apps/worker/src

RUN pnpm turbo build --filter @chat/worker

FROM node:22-alpine AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/packages/db ./packages/db
COPY --from=base /app/packages/config ./packages/config

RUN pnpm install --frozen-lockfile --filter ./apps/worker --prod --ignore-scripts

RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
USER appuser

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:4100/healthz || exit 1

CMD ["node", "apps/worker/dist/main.js"]
