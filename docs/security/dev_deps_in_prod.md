# Dev Dependencies in Production

## Issue

Some devDependencies are accidentally included in production builds or Docker images.

## Current State

- **pino-pretty**: In `apps/api/package.json` dependencies (should be devDependencies)
- **@testing-library/\***: In `packages/ui` dependencies (should be devDependencies)

## Fix: Move to devDependencies

### apps/api/package.json

```json
{
  "dependencies": {
    "pino": "^10.3.1",
    "pino-pretty": "^13.1.3"
  },
  "devDependencies": {
    "pino-pretty": "^13.1.3"
  }
}
```

**Correction**: pino-pretty should ONLY be in devDependencies. It's used for pretty logging in development only.

### packages/ui/package.json

```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.22.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

**Note**: React and ReactDOM should remain in peerDependencies, not devDependencies.

## Docker Build Verification

```dockerfile
# In Dockerfile, use --production flag
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Or use multi-stage build (already implemented)
# Build stage: pnpm install --frozen-lockfile
# Runtime stage: pnpm install --frozen-lockfile --prod --ignore-scripts
```

## Verification

```bash
# Check production deps only
pnpm list --prod --depth=0

# Should NOT contain:
# - pino-pretty
# - @testing-library/*
# - vitest
# - eslint
# - typescript
```

## CI Check

Add to validate.yml:

```yaml
- name: Check no dev deps in production
  run: |
    pnpm list --prod --depth=0 --parseable | grep -E "(pino-pretty|@testing-library|vitest|eslint|typescript)" && exit 1 || echo "OK"
```
