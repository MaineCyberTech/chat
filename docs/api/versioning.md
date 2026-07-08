# API Versioning

## Current Approach

All API paths use a `/v1` URL prefix. The client-side `api.ts` library automatically prepends `/v1` to paths that don't already start with it (see `apiPath()` in `apps/web/lib/api.ts`).

The OpenAPI spec at `docs/api/openapi.json` defines version `1.0.0` in its `info.version` field.

## Adding a New Version (v2)

1. Create new route files under `apps/api/src/modules/` with a `/v2/` prefix
2. Mount v2 routes in `apps/api/src/app.ts` at `/v2`
3. Update `apps/web/lib/api.ts` `apiPath()` to support explicit v2 paths
4. Add a new OpenAPI spec file `docs/api/openapi.v2.json`

Example mount in `app.ts`:

```ts
app.use("/v2", v2Router);
```

## Deprecation Policy

- Each API version is supported for **6 months** after its replacement is released
- Deprecated versions return a `Sunset` header with the deprecation date
- Deprecation is announced via changelog (`docs/api/changelog.json`)
- After 6 months, the deprecated version may be removed in a minor release

## Header-Based Versioning (Alternative)

Clients can also request a specific version via the `Accept-Version` header:

```
Accept-Version: 2
```

This is handled by middleware that rewrites the path. This approach is available for clients that cannot easily change URL paths.
