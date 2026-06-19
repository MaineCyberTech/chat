# apps/api/Dockerfile
# Multi-stage production build for the Express API server.

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/

RUN pnpm install --frozen-lockfile --filter @chat/api

COPY packages/db/src ./packages/db/src
COPY apps/api/src ./apps/api/src

RUN pnpm turbo build --filter @chat/api

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/packages/db/package.json ./node_modules/@chat/db/package.json
COPY --from=build /app/packages/db/dist ./node_modules/@chat/db/dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
