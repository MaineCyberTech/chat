FROM node:22-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./

COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/
COPY packages/config/package.json packages/config/tsconfig.json ./packages/config/
COPY packages/sdk/package.json packages/sdk/tsconfig.json ./packages/sdk/

RUN pnpm install --frozen-lockfile

COPY apps/worker/src ./apps/worker/src
COPY packages/db/src ./packages/db/src
COPY packages/config/src ./packages/config/src
COPY packages/sdk/src ./packages/sdk/src

RUN pnpm turbo build --filter @chat/worker

FROM node:22-alpine AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/packages/db/package.json ./packages/db/package.json
COPY --from=base /app/packages/db/dist ./packages/db/dist
COPY --from=base /app/packages/config/package.json ./packages/config/package.json
COPY --from=base /app/packages/config/dist ./packages/config/dist
COPY --from=base /app/packages/sdk/package.json ./packages/sdk/package.json
COPY --from=base /app/packages/sdk/dist ./packages/sdk/dist

RUN pnpm install --frozen-lockfile --filter ./apps/worker --prod --ignore-scripts

ENV NODE_ENV=production

WORKDIR /app/apps/worker

RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
USER appuser

CMD ["node", "dist/main.js"]
