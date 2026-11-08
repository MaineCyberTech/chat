# apps/api/Dockerfile
# Multi-stage production build for the Express API server.

FROM node:26-alpine@sha256:b2646ba6d774dc22c24d89fc37103fcf4c4467e870c78b9519aa403300b2835a AS base
WORKDIR /app

# pnpm
RUN npm install -g pnpm@9.15.4 --no-fund --no-audit

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
FROM node:26-alpine@sha256:b2646ba6d774dc22c24d89fc37103fcf4c4467e870c78b9519aa403300b2835a AS runtime
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/packages/db/package.json ./packages/db/package.json
COPY --from=base /app/packages/db/dist ./packages/db/dist
COPY --from=base /app/packages/config/package.json ./packages/config/package.json
COPY --from=base /app/packages/config/dist ./packages/config/dist

# Production-only install, then drop the package managers (and their bundled
# dependencies) so the runtime image contains only Node and app deps. pnpm 10
# is used here because 9.15.4 carries published advisories; the lockfile format
# is unchanged.
RUN npm install -g pnpm@10.34.6 --no-fund --no-audit \
  && pnpm --config.manage-package-manager-versions=false install --frozen-lockfile --filter ./apps/api --prod --ignore-scripts \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/pnpm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/pnpm /usr/local/bin/pnpx /usr/local/bin/corepack

ENV NODE_ENV=production
ENV PORT=4000

# wget is provided by the BusyBox applet in the Alpine base image; no extra
# package is needed for the healthcheck below.
WORKDIR /app/apps/api

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "-qO-", "http://localhost:4000/healthz"]

EXPOSE 4000

RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
USER appuser

CMD ["node", "dist/server.js"]
