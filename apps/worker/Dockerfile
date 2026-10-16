FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS base
WORKDIR /app

# Install pnpm directly. Corepack is no longer bundled with Node.js 25+, so
# `corepack enable` fails with exit 127 on current node:* base images.
# Keep in sync with package.json#packageManager.
RUN npm install -g pnpm@9.15.4

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./

COPY packages ./packages
COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/

RUN pnpm install --frozen-lockfile

COPY apps/worker/src ./apps/worker/src

RUN pnpm turbo build --filter @chat/worker

FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS runtime
WORKDIR /app

# Install pnpm directly. Corepack is no longer bundled with Node.js 25+, so
# `corepack enable` fails with exit 127 on current node:* base images.
# Keep in sync with package.json#packageManager.
RUN npm install -g pnpm@9.15.4

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/packages/db ./packages/db
COPY --from=base /app/packages/config ./packages/config

RUN pnpm install --frozen-lockfile --filter ./apps/worker --prod --ignore-scripts

# wget is provided by the BusyBox applet in the Alpine base image; no extra
# package is needed for the healthcheck below.
RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
USER appuser

EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["wget", "-q", "--spider", "http://127.0.0.1:4100/healthz"]

CMD ["node", "apps/worker/dist/main.js"]
