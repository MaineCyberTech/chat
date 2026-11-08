FROM node:22-alpine@sha256:947e5454e08bfe0b8ddda604915ad76275276c774f47da90d0137252c793a778 AS base
WORKDIR /app

RUN npm install -g pnpm@9.15.4 --no-fund --no-audit

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json .npmrc ./

COPY packages ./packages
COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/

RUN pnpm install --frozen-lockfile

COPY apps/worker/src ./apps/worker/src

RUN pnpm turbo build --filter @chat/worker

FROM node:22-alpine@sha256:947e5454e08bfe0b8ddda604915ad76275276c774f47da90d0137252c793a778 AS runtime
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/packages/db ./packages/db
COPY --from=base /app/packages/config ./packages/config

# Production-only install, then drop the package managers (and their bundled
# dependencies) so the runtime image contains only Node and app deps.
RUN npm install -g pnpm@10.34.6 --no-fund --no-audit \
  && pnpm --config.manage-package-manager-versions=false install --frozen-lockfile --filter ./apps/worker --prod --ignore-scripts \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/pnpm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/pnpm /usr/local/bin/pnpx /usr/local/bin/corepack

# wget is provided by the BusyBox applet in the Alpine base image; no extra
# package is needed for the healthcheck below.
RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
USER appuser

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["wget", "-q", "--spider", "http://localhost:4100/healthz"]

CMD ["node", "apps/worker/dist/main.js"]
